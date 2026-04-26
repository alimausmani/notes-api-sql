import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

type AuthPayload = {
	userId: number;
	email: string;
};

function getTokenFromRequest(request: FastifyRequest): string | null {
	const header = request.headers.authorization;

	if (!header) {
		return null;
	}

	const [scheme, token] = header.split(" ");

	if (scheme !== "Bearer" || !token) {
		return null;
	}

	return token;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
	const token = getTokenFromRequest(request);

	if (!token) {
		return reply.code(401).send({ message: "Authorization token is required" });
	}

	const secret = process.env.JWT_SECRET;

	if (!secret) {
		return reply.code(500).send({ message: "JWT secret is not configured" });
	}

	try {
		const payload = jwt.verify(token, secret) as AuthPayload;
		(request as FastifyRequest & { user?: AuthPayload }).user = payload;
		return;
	} catch {
		return reply.code(401).send({ message: "Invalid or expired token" });
	}
}
