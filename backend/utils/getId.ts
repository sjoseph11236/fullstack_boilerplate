import type { FastifyReply, FastifyRequest } from "fastify";
import type { IdParam } from "../types/https";

export function getId(
	req: FastifyRequest<{ Params: IdParam }>,
	res: FastifyReply,
	source: string,
): number | null {
	const id = Number(req.params.id);
	if (!Number.isFinite(id)) {
		res.code(400).send({ error: `Invalid ${source} id"` });
		return null;
	}
	return id;
}
