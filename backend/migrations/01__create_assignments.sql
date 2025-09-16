CREATE TABLE
  assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE
  questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES assignments (id),
    type TEXT NOT NULL DEFAULT 'mcq', -- 'mcq' or 'free_text'
    prompt TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    choices TEXT, -- sqlite doesn't support arrays, so we'll store choices as a string of ';;'-separated values
    correct_index INTEGER NOT NULL DEFAULT 0,      
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );