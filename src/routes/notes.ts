import { FastifyInstance } from "fastify";

import { pool } from "../db/db";
import { authenticate } from "../middleware/auth";

function normalizeTags(tags: unknown): string[] {
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => tag.length > 0);
}

export async function notesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/notes', {
    schema: {
      tags: ['Notes'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
          tags: {
            type: 'string',
            description: 'Comma-separated tags. Example: work,urgent'
          }
        }
      }
    }
  }, async (req: any, reply: any) => {
    try {
      const tags = normalizeTags(req.query.tags);

      let query = `SELECT id, user_id, title, content, tags FROM notes`;
      const params: any[] = [];

      if (tags.length > 0) {
        query += ` WHERE tags && $1::text[]`;
        params.push(tags);
      }

      query += ` ORDER BY id DESC`;

      const result = await pool.query(query, params);

      return result.rows;
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ message: 'Unable to fetch notes' });
    }
  });

  app.post('/notes', {
    schema: {
      tags: ['Notes'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'content', 'tags'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1 },
          content: { type: 'string', minLength: 1 },
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            description: 'At least one tag is required'
          }
        }
      }
    }
  }, async (req: any, reply: any) => {
    try {
      const { title, content, tags } = req.body;
      const normalizedTags = normalizeTags(tags);

      if (normalizedTags.length === 0) {
        return reply.code(400).send({ message: 'At least one valid tag is required' });
      }

      const user = (req as any).user;

      const result = await pool.query(
        `INSERT INTO notes (user_id,title,content,tags)
         VALUES ($1,$2,$3,$4) RETURNING id, user_id, title, content, tags`,
        [user.userId, title, content, normalizedTags]
      );

      return reply.code(201).send(result.rows[0]);
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ message: 'Unable to create note' });
    }
  });

  app.get('/notes/:id', {
    schema: {
      tags: ['Notes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (req: any, reply: any) => {
    try {
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
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ message: 'Unable to fetch note' });
    }
  });

  app.put('/notes/:id', {
    schema: {
      tags: ['Notes'],
      security: [{ bearerAuth: [] }],
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
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1 },
          content: { type: 'string', minLength: 1 },
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          }
        }
      }
    }
  }, async (req: any, reply: any) => {
    try {
      const { id } = req.params;
      const { title, content, tags } = req.body;
      const normalizedTags = normalizeTags(tags);

      if (normalizedTags.length === 0) {
        return reply.code(400).send({ message: 'At least one valid tag is required' });
      }

      const result = await pool.query(
        `UPDATE notes
         SET title = $1, content = $2, tags = $3
         WHERE id = $4
         RETURNING id, user_id, title, content, tags`,
        [title, content, normalizedTags, id]
      );

      if (result.rowCount === 0) {
        return reply.code(404).send({ message: 'Note not found' });
      }

      return result.rows[0];
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ message: 'Unable to update note' });
    }
  });

  app.delete('/notes/:id', {
    schema: {
      tags: ['Notes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (req: any, reply: any) => {
    try {
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
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ message: 'Unable to delete note' });
    }
  });
}