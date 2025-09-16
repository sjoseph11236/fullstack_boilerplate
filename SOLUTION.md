# Solution

By: Sayeed Joseph
Email: [sayeed.joseph1@gmail.com](mailto:sayeed.joseph1@gmail.com)

---

## Notes on implementation

For MVP I focused on delivering **real-time feedback** for multiple-choice questions:

**End users:** Students.

**Core loop:**

- Student sees a list of quizzes.
- They start one attempt (one active attempt per user × quiz).
- Answer one question at a time.
- On clicking **Next**, the backend deterministically checks the answer:

  - If MCQ → compare to stored correct answer.
  - Return `{ correct: true|false, explanation: "Optional static text", points }`.

- Responses are saved as they go → enables resumability.
- At the end, student sees a **summary**:

  - Total score / possible points
  - Which answers were right/wrong
  - Total time spent

* Students can:

  - See a list of quizzes
  - Start an attempt
  - Answer one question at a time
  - Get immediate feedback (correct/incorrect) after submitting each answer
  - View a final summary (score, right/wrong, total time)

* **Resumability**: one active attempt per user per quiz. On resume, API serves the next unanswered question.

* **Backend**: Fastify + Node.

* **Database**: SQLite for speed in 3–4 hr build, schema portable to Postgres.

* **Frontend**: React + TypeScript with simple quiz → attempt → summary flow.

---

## API Endpoints (MVP)

- **`GET /quizzes`**
  → Return list of quizzes (id, title, description, numQuestions).

- **`POST /attempts { quizId }`**
  → Create a new attempt or resume in-progress attempt for that quiz.

- **`GET /attempts/:id/next`**
  → Fetch the next unanswered question (id, prompt, options).

- **`POST /attempts/:id/answers`**
  → Save student’s answer, grade MCQ deterministically, return feedback:

  ```json
  { "correct": true, "explanation": "Femur is the longest bone.", "points": 1 }
  ```

- **`POST /attempts/:id/submit`**
  → Mark attempt as submitted, compute totals.

- **`GET /attempts/:id/summary`**
  → Return score, points earned vs possible, incorrect answers with corrections, total time.

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
