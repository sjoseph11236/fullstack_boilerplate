import type { FastifyReply } from "fastify";

export const sendError = (
	reply: FastifyReply,
	status: number,
	message: string,
) => reply.code(status).send({ message });
