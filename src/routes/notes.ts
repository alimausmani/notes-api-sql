import { FastifyInstance } from "fastify";

import { pool } from "../db/db";

export async function notesRoutes(app: FastifyInstance) {

  app.get('/notes', {
    schema: {
      tags: ['Notes']
    }
  }, async () => {
    const result = await pool.query(
      `SELECT id, user_id, title, content, tags__
       FROM notes
       ORDER BY id DESC`
    );

    return result.rows;
  });

  app.post('/notes', {
    schema: {
      tags: ['Notes'],
      body: {
        type: 'object',
        required: ['title', 'content', 'tags', 'userId'],
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          userId: { type: 'number' }
        }
      }
    }
  }, async (req: any) => {

    const { title, content, tags, userId } = req.body;

    const result = await pool.query(
      `INSERT INTO notes (user_id,title,content,tags)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [userId, title, content, tags]
    );

    return result.rows[0];
  });

  app.get('/notes/:id', {
    schema: {
      tags: ['Notes'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (req: any, reply: any) => {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, user_id, title, content, tags
       FROM notes
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return reply.code(404).send({ message: 'Note not found' });
    }

    return result.rows[0];
  });

}