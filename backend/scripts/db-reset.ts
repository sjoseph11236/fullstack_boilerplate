import { db } from "../db-client";

try {
	console.log("--> Dropping all tables...");
	db.exec(`
    PRAGMA foreign_keys = OFF;

    DROP TABLE IF EXISTS attempt_answers;
    DROP TABLE IF EXISTS attempts;
    DROP TABLE IF EXISTS questions;
    DROP TABLE IF EXISTS assignments;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS my_migrations;

    PRAGMA foreign_keys = ON;
  `);
	console.log("<-- All tables dropped.");
} finally {
	db.close();
}
