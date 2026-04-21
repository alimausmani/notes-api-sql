import { FastifyInstance } from "fastify";

import { pool } from "../db/db";

export async function notesRoutes(app: FastifyInstance) {

  app.post('/notes', {
    schema: {
      tags: ['Notes'],
      body: {
        type: 'object',
        required: ['title', 'content', 'userId'],
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          userId: { type: 'number' }
        }
      }
    }
  }, async (req: any) => {

    const { title, content, userId } = req.body;

    const result = await pool.query(
      `INSERT INTO notes (user_id,title,content)
       VALUES ($1,$2,$3) RETURNING id`,
      [userId, title, content]
    );

    return result.rows[0];
  });

}