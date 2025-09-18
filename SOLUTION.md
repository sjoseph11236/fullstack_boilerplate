# Solution

By: Sayeed Joseph
Email: [sayeed.joseph1@gmail.com](mailto:sayeed.joseph1@gmail.com)

---

## Overview

QuizWizard MVP lets students:

1. View a list of quizzes.
2. Start or resume an attempt (one active per quiz).
3. Answer one question at a time (MCQ only for MVP).
4. Get deterministic real-time feedback on correctness.
5. See a summary: score, total points, time spent, breakdown of answers.

The AI free-text grading is scoped as a stretch goal.

---

## Key Product & Technical Decisions

### Database Schema

- **Normalized tables**: `users`, `assignments`, `questions`, `attempts`, `attempt_answers`.
- **Indices**: added for `attempts(user_id, assignment_id, status)` and `attempt_answers(attempt_id)` to speed resumability and summary queries.
- **`questions.choices` as string**: kept simple with `;;` delimiter for SQLite MVP, but schema portable to Postgres (would refactor to `options` table for flexibility).
- **`attempt_answers.explanation`**: designed to support both static and AI-generated explanations later.

➡️ **Tradeoff**: Used SQLite for speed and easy local setup. Portable schema allows migration to Postgres for concurrency and scaling.

## Notes on implementation

For MVP I focused on delivering **real-time feedback** for multiple-choice questions:

---

## Database Schema

```sql
users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
)

assignments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)

questions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  type TEXT NOT NULL,             -- 'mcq' or 'free_text'
  prompt TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  choices TEXT, -- sqlite doesn't support arrays, so we'll store choices as a string of ';;'-separated values
  correct_index INTEGER NOT NULL DEFAULT 0,s
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)

attempts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  assignment_id INTEGER NOT NULL REFERENCES assignment(id),
  status TEXT NOT NULL,           -- "in_progress" | "submitted"
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  total_elapsed_ms INTEGER
  last_activity_at  DATETIME --We track last_activity_at for future use (idle detection, expiration, analytics), though the MVP doesn’t enforce timeouts yet.
)

attempt_answers(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL REFERENCES attempts(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  answer_json TEXT,               -- e.g. { "choice": "B" } or { "text": "Bone is dense" }
  is_correct BOOLEAN,
  points_awarded INTEGER,
  graded_by TEXT,                 -- "system" | "ai"
  explanation TEXT,
  graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attempt_id, question_id) -- only one answer per question per attempt
)
```

---

### API Design (MVP)

- `POST /attempts { quizId }` → resume existing or create new attempt.
- `GET /attempts/:id/next` → next unanswered question, ensures resumability.
- `POST /attempts/:id/answers` → save + grade MCQ answer immediately.
- `POST /attempts/:id/submit` → finalize attempt, compute totals, set elapsed time.
- `GET /attempts/:id/summary` → return score, total, time, per-question breakdown.

➡️ **Decision**: kept endpoints minimal but explicit; avoids overloading routes with multiple responsibilities.

### State Management (Frontend)

- **React + TypeScript**:

  - Local component state tracks current question, answer choice, and feedback.
  - API calls save progress as student clicks “Next.”
  - Resumability handled server-side by fetching next unanswered.

- **Navigation**: forward-only in MVP for clarity; back/retake treated as stretch (adds complexity with re-grading + state reconciliation).

➡️ **Tradeoff**: Simple forward-only loop makes resumability reliable within the 3–4h MVP window.

---

## Edge Cases Considered

- **Invalid attempt IDs** → 400 with clear error.
- **Submitting without an attempt** → safe error (foreign key validation).
- **Leaving mid-quiz** → resumability ensures student restarts at next unanswered.
- **Unanswered on submit** → counted as incorrect (explicitly chosen).
- **Multiple submissions** → rejected with 409 if already submitted.
- ***

## Maintainability & Future proofing

- **DB reset script**: added `db:reset` for reproducible dev setup.
  Ensures schema + seed data can be reapplied cleanly, reducing drift
  and making it easy for reviewers to run the project.
- **Portable schema**: SQLite now, Postgres later with row-level locks + pooling.
- **Code organization**: routes modularized (`attemptsRoutes`, `quizzesRoutes`); utils like `getAttemptId` extracted.
- **AI extension**: schema already supports explanations and `graded_by`; easy to plug in AI grading for free-text.
- **Scalability plan**: containerize API, add caching for hot reads (`GET /quizzes`), migrate questions to normalized `options` table.
- **Error handling**: global 404 + error handler in Fastify; validation with JSON Schema for reusable param checks.

---

## If I Had More Time

- Implement back navigation + retakes with multi-attempt tracking.
- Add randomized choices per attempt to reduce memorization.
- Wire AI grading via Stepful proxy for free-text answers.
- Expand summary to show correct answers alongside student answers.
- Add expiration job to update attempt status as abandon after 7 days of no activity.
- **Frontend tradeoffs**: for rendering quiz choices, I currently key React list items with
  `${q.id}-${idx}`. This guarantees uniqueness even if two choices share the same text.
  In a production system, I would prefer to use a stable identifier from the backend
  (e.g., `choice.id`) for resiliency against reordering or localization changes.
- **Error handling tradeoffs**: for simple demo routes like `/` and `/users`, I didn’t add
  explicit error handling to keep the MVP lean. In production, I would wrap all routes
  with consistent error responses (e.g., `{ code, message }`) and use a global Fastify
  error handler for uniformity and better client-side behavior.
