import cors from "@fastify/cors";
import fastify from "fastify";
import { db } from "./db-client";
import { attemptsRoutes } from "./routes/attempts";
import { quizzesRoutes } from "./routes/quizzes";

const server = fastify();

server.register(cors, {});

const PORT = +(process.env.BACKEND_SERVER_PORT ?? 3001);

server.get("/", async (req, res) => {
	return "hello world\n";
});

server.get("/users", (req, res) => {
	const data = db.prepare("SELECT * FROM users").all();

	return data;
});

server.register(attemptsRoutes, { prefix: "/attempts" });
server.register(quizzesRoutes, { prefix: "/quizzes" });

server.listen({ port: PORT }, (err) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at http://localhost:${PORT}`);
});
