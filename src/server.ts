import Fastify from "fastify";

import dotenv from "dotenv";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import { authRoutes } from "./routes/auth";
import { notesRoutes } from "./routes/notes";

dotenv.config();

const app = Fastify();
const port = Number(process.env.PORT ?? 3000);

async function start() {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Notes API",
        version: "1.0.0"
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs"
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