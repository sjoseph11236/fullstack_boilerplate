import type { FastifyInstance } from "fastify";
import type { WithId } from "../types/https";

import { db } from "../db-client";
import { sendError } from "../utils/error";
import { getId } from "../utils/getId";

export async function quizzesRoutes(app: FastifyInstance) {
	// GET /quizzes
	app.get("/", (req, res) => {
		try {
			const row = db.prepare("SELECT * FROM assignments").all();

			return row;
		} catch (e) {
			req.log.error({ e }, "Failed to list quizzes");
			return sendError(res, 500, "Unable to load quizzes");
		}
	});

	// GET /quizzes/:id
	app.get<WithId>("/:id", (req, res) => {
		try {
			const id = getId(req, res, "quiz");
			const row = db.prepare("SELECT * FROM assignments WHERE id = ?").get(id);

			if (!row) {
				return sendError(res, 404, "Quiz not found");
			}

			return row;
		} catch (e) {
			req.log.error({ e }, "Failed to get quiz");
			return sendError(res, 500, "Unable to load quiz");
		}
	});
}
