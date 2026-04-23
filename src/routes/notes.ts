import { FastifyInstance } from "fastify";

import { pool } from "../db/db";

export async function notesRoutes(app: FastifyInstance) {

  app.get('/notes', {
    schema: {
      tags: ['Notes'],
      querystring: {
        type: 'object',
        properties: {
          tag: { type: 'string' },
          tags: { type: 'string' }
        }
      }
    }
  }, async (req: any) => {
    const { tag, tags } = req.query;

    let query = `SELECT id, user_id, title, content, tags FROM notes`;
    const params: any[] = [];

    if (tag) {
      query += ` WHERE tags @> $1`;
      params.push([tag]);
    } else if (tags) {
      const tagArray = tags.split(',').map((t: string) => t.trim());
      query += ` WHERE tags && $1`;
      params.push(tagArray);
    }

    query += ` ORDER BY id DESC`;

    const result = await pool.query(query, params);

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

  app.put('/notes/:id', {
    schema: {
        tags: ['Notes'],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'number' }
            }
        },
        body: {
            type: 'object',
            required: ['title', 'content', 'tags'],
            properties: {
                title: { type: 'string' },
                content: { type: 'string' },
                tags: {
                    type: 'array',
                    items: { type: 'string' }
                }
            }
        }
    }
}, async (req: any, reply: any) => {
    const { id } = req.params;          
    const { title, content, tags } = req.body;

    const result = await pool.query(
        `UPDATE notes
         SET title = $1, content = $2, tags = $3
         WHERE id = $4
         RETURNING id`,
        [title, content, tags, id]
    );

    if (result.rowCount === 0) {
        return reply.code(404).send({ message: 'Note not found' });
    }

    return result.rows[0];
});

  app.delete('/notes/:id', {
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
      `DELETE FROM notes
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return reply.code(404).send({ message: 'Note not found' });
    }

    return { message: 'Note deleted', id: result.rows[0].id };
  });

}