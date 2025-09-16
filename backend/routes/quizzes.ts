import type { FastifyInstance } from "fastify";
import { db } from "../db-client";

export async function quizzesRoutes(app: FastifyInstance) {
	// GET /quizzes
	app.get("/", (request, response) => {
		const data = db.prepare("SELECT * FROM assignments").all();

		return data;
	});

	// GET /quizzes/:id
	app.get("/:id", (request, response) => {
		const data = db.prepare("SELECT * FROM assignments WHERE id = :id");

		return data.get(request.params);
	});
}
