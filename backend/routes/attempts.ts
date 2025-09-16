import type { FastifyInstance } from "fastify";
import type { WithId } from "../types/https";
import type {
	CreateAttemptBody,
	AttemptRow,
	CreatedAttemptRow,
	QuestionRow,
	CreateAnswerBody,
} from "../types/attempts";
import { db } from "../db-client";
import { getAttemptId } from "../utils/getAttemptId";

export async function attemptsRoutes(app: FastifyInstance) {
	// GET /attempts/:id/next
	app.get<WithId>("/:id/next", async (req, res) => {
		const attemptId = getAttemptId(req, res);
		const row = db
			.prepare<[number, number], QuestionRow>(`
			SELECT q.id, q.prompt, q.points, q.order_index, q.choices, q.type
			FROM questions q
			WHERE q.assignment_id = (SELECT assignment_id FROM attempts WHERE id = ?)
			  AND NOT EXISTS (
				SELECT 1 FROM attempt_answers aa
				WHERE aa.attempt_id = ? AND aa.question_id = q.id
			  )
			ORDER BY q.id ASC       -- or order_index when you add it
			LIMIT 1
		  `)
			.get(attemptId, attemptId);

		if (!row) return res.code(204).send(); // nothing left

		return res.send({
			question: {
				id: row.id,
				prompt: row.prompt,
				points: row.points,
				orderIndex: row.order_index,
				choices: row.choices ? String(row.choices).split(";;") : null,
				type: row.type,
			},
		});
	});

	// GET /attempts/:id/summary
	app.get<WithId>("/:id/summary", async (req, res) => {
		const attemptId = getAttemptId(req, res);

		const header = db
			.prepare<[number], { attempt_id: number; total_ms: number | null }>(`
      SELECT id AS attempt_id, total_elapsed_ms AS total_ms
      FROM attempts WHERE id = ?
    `)
			.get(attemptId);
		if (!header) return res.code(404).send({ error: "attempt not found" });

		// score/possible
		const totals = db
			.prepare<[number, number], { score: number; possible: number }>(`
      SELECT
        COALESCE(SUM(aa.points_awarded), 0) AS score,
        (
          SELECT COUNT(1)
          FROM questions q
          WHERE q.assignment_id = (SELECT assignment_id FROM attempts WHERE id = ?)
        ) AS possible
      FROM attempt_answers aa
      WHERE aa.attempt_id = ?
    `)
			.get(attemptId, attemptId);

		// per-question breakdown (simple version)
		const rows = db
			.prepare<
				[number, number],
				{
					question_id: number;
					prompt: string;
					choices: string | null;
					is_correct: number | null;
					points_awarded: number | null;
					answer_json: string | null;
				}
			>(`
      SELECT
        q.id AS question_id,
        q.prompt,
        q.choices,
        aa.is_correct,
        aa.points_awarded,
        aa.answer_json
      FROM questions q
      LEFT JOIN attempt_answers aa
        ON aa.question_id = q.id AND aa.attempt_id = ?
      WHERE q.assignment_id = (SELECT assignment_id FROM attempts WHERE id = ?)
      ORDER BY q.id ASC
    `)
			.all(attemptId, attemptId);

		const answers = rows.map((r) => {
			const given = r.answer_json ? JSON.parse(r.answer_json) : null;
			const choiceArray = r.choices ? String(r.choices).split(";;") : null;
			const givenAnswer =
				choiceArray && given && typeof given.choiceIndex === "number"
					? choiceArray[given.choiceIndex]
					: undefined;

			// For MVP we don’t store correct choice in schema—omit or compute if you add it later
			return {
				questionId: r.question_id,
				prompt: r.prompt,
				correct: r.is_correct === 1,
				givenAnswer,
				correctAnswer: undefined,
				pointsAwarded: r.points_awarded ?? 0,
			};
		});

		return res.send({
			attemptId: header.attempt_id,
			score: totals?.score ?? 0,
			possible: totals?.possible ?? 0,
			totalTimeMs: header.total_ms ?? 0,
			answers,
		});
	});

	// POST /attempts
	app.post<WithId<{ Body: CreateAttemptBody }>>("/", async (req, res) => {
		const { quizId, userId = 1 } = req.body;

		// 1) Try resume
		const resume = db
			.prepare<[number, number], AttemptRow>(`
		SELECT id, user_id, assignment_id, status, started_at
		FROM attempts
		WHERE user_id = ? AND assignment_id = ? AND status = 'in_progress'
		LIMIT 1
	  `)
			.get(userId, quizId);

		if (resume) {
			return res.send({
				attempt: {
					id: resume.id,
					userId: resume.user_id,
					assignmentId: resume.assignment_id,
					status: resume.status,
					startedAt: resume.started_at,
				},
			});
		}

		// 2) Create new
		const insert = db.prepare<[number, number], CreatedAttemptRow>(`
		  INSERT INTO attempts (user_id, assignment_id, status, started_at, last_activity_at)
		  VALUES (?, ?, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`);
		const info = insert.run(userId, quizId);

		const created = db
			.prepare<[number], AttemptRow>(`
		  SELECT id, user_id, assignment_id, status, started_at
		  FROM attempts WHERE id = ?
		`)
			.get(info.lastInsertRowid as number);

		if (!created) {
			return res.code(500).send({ error: "failed to create attempt" });
		}

		return res.code(201).send({
			attempt: {
				id: created.id,
				userId: created.user_id,
				assignmentId: created.assignment_id,
				status: created.status,
				startedAt: created.started_at,
			},
		});
	});

	// POST /attempts/:id/answers
	app.post<WithId<{ Body: CreateAnswerBody }>>(
		"/:id/answers",
		async (req, res) => {
			const attemptId = getAttemptId(req, res);

			const attempt = db
				.prepare<[number], { id: number; assignment_id: number }>(`
				SELECT id, assignment_id FROM attempts WHERE id = ? AND status = 'in_progress'
				`)
				.get(attemptId);

			if (!attempt) {
				return res.code(409).send({ error: "attempt not in progress" });
			}

			const body = req.body;

			if (!body?.questionId || body.answer?.choiceIndex == null) {
				return res
					.code(400)
					.send({ error: "questionId and answer.choiceIndex required" });
			}

			const question = db
				.prepare<[number], { choices: string | null; correct_index: number }>(`
        SELECT choices, correct_index FROM questions WHERE id = ?
      `)
				.get(body.questionId);

			if (!question) {
				return res.code(404).send({ error: "question not found" });
			}

			// Parse choices into array
			const choices = question.choices
				? String(question.choices).split(";;")
				: [];

			const isCorrect = body.answer.choiceIndex === question.correct_index;
			const pointsAwarded = isCorrect ? 1 : 0;

			// Insert or replace answer
			db.prepare(
				`
      INSERT INTO attempt_answers (attempt_id, question_id, answer_json, is_correct, points_awarded)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(attempt_id, question_id) DO UPDATE SET
        answer_json = excluded.answer_json,
        is_correct = excluded.is_correct,
        points_awarded = excluded.points_awarded,
        graded_at = CURRENT_TIMESTAMP
    `,
			).run(
				attemptId,
				body.questionId,
				JSON.stringify(body.answer),
				isCorrect ? 1 : 0,
				pointsAwarded,
			);

			return res.send({
				correct: isCorrect,
				points: pointsAwarded,
				explanation: isCorrect ? "Correct!" : "Try again — review the concept.", // static for MVP
			});
		},
	);

	// POST /attempts/:id/submit
	app.post<WithId>("/:id/submit", async (req, res) => {
		const attemptId = getAttemptId(req, res);

		// Ensure attempt exists and is still in_progress
		const attempt = db
			.prepare<[number], { id: number; started_at: string }>(`
      SELECT id, started_at FROM attempts
      WHERE id = ? AND status = 'in_progress'
    `)
			.get(attemptId);

		if (!attempt) {
			// Already submitted or not found
			return res.code(409).send({ error: "attempt not in progress" });
		}

		// Compute totals
		const totals = db
			.prepare<[number, number], { score: number; possible: number }>(`
      SELECT
        COALESCE(SUM(aa.points_awarded), 0) AS score,
        (
          SELECT COALESCE(SUM(1), 0)
          FROM questions q
          WHERE q.assignment_id = (SELECT assignment_id FROM attempts WHERE id = ?)
        ) AS possible
      FROM attempt_answers aa
      WHERE aa.attempt_id = ?
    `)
			.get(attemptId, attemptId);

		// Mark submitted and set elapsed time
		db.prepare(`
    UPDATE attempts
    SET status='submitted',
        submitted_at=CURRENT_TIMESTAMP,
        total_elapsed_ms =
          CAST((julianday(CURRENT_TIMESTAMP) - julianday(started_at)) * 24 * 60 * 60 * 1000 AS INTEGER)
    WHERE id = ?
  `).run(attemptId);

		return res.send({
			status: "submitted",
			score: totals?.score ?? 0,
			possible: totals?.possible ?? 0,
		});
	});
}
