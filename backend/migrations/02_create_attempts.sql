
CREATE TABLE IF NOT EXISTS attempts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  assignment_id     INTEGER NOT NULL REFERENCES assignments(id),
  status            TEXT NOT NULL CHECK (status IN ('in_progress','submitted')) DEFAULT 'in_progress',
  started_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at      DATETIME,
  total_elapsed_ms  INTEGER,
  last_activity_at  DATETIME
);


CREATE INDEX IF NOT EXISTS idx_attempts_user_assignment_status
  ON attempts(user_id, assignment_id, status);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id       INTEGER NOT NULL REFERENCES attempts(id),
  question_id      INTEGER NOT NULL REFERENCES assignment_questions(id),
  answer_json      TEXT,
  is_correct       INTEGER,
  points_awarded   INTEGER,
  graded_by        TEXT,
  explanation      TEXT,
  graded_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt
  ON attempt_answers(attempt_id);