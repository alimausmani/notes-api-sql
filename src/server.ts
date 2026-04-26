import Fastify from "fastify";

import dotenv from "dotenv";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import { authRoutes } from "./routes/auth";
import { notesRoutes } from "./routes/notes";

dotenv.config();

const app = Fastify();
const port = Number(process.env.PORT ?? 3000);

async function start() {
  app.setErrorHandler((error, request, reply) => {
    const handledError = error as { message?: string; validation?: unknown[] };

    request.log.error(error);

    if (handledError.validation) {
      return reply.code(400).send({
        message: "Validation failed",
        details: handledError.validation,
      });
    }

    if (reply.statusCode >= 400 && reply.statusCode < 500 && handledError.message) {
      return reply.code(reply.statusCode).send({ message: handledError.message });
    }

    return reply.code(500).send({ message: "Internal server error" });
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((item) => item.trim())
      : true,
  });

  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? "1 minute",
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Notes API",
        version: "1.0.0"
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      persistAuthorization: true,
    },
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(notesRoutes, { prefix: "/api" });

  await app.listen({ port });
  console.log(`Server running on http://localhost:${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});