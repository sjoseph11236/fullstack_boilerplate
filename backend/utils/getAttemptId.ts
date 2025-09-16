import type { FastifyReply, FastifyRequest } from "fastify";
import type { IdParam } from "../types/https";

export function getAttemptId(
	req: FastifyRequest<{ Params: IdParam }>,
	res: FastifyReply,
): number {
	const attemptId = Number(req.params.id);
	if (!Number.isFinite(attemptId)) {
		res.code(400).send({ error: "bad attempt id" });
		throw new Error("Response sent");
	}
	return attemptId;
}
