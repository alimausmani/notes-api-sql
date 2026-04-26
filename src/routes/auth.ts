import { FastifyInstance } from "fastify";  

import { pool } from "../db/db";
import { hashPassword, comparePassword } from "../utils/hash";

import jwt from "jsonwebtoken";

export async function authRoutes(app: FastifyInstance) {

  app.post('/signup', {
    schema: {
      tags: ['Auth'],
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      },
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', minLength: 5 },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (req: any, reply: any) => {
    try {
      const { name, email, password } = req.body;

      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if ((existing.rowCount ?? 0) > 0) {
        return reply.code(409).send({ message: 'Email already registered' });
      }

      const hashed = await hashPassword(password);

      await pool.query(
        'INSERT INTO users (name,email,password) VALUES ($1,$2,$3)',
        [name, email, hashed]
      );

      return reply.code(201).send({ message: 'User created' });
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ message: 'Unable to create user' });
    }
  });

  app.post('/login', {
    schema: {
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        additionalProperties: false,
        properties: {
          email: { type: 'string', minLength: 5 },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (req: any, reply: any) => {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        'SELECT id, name, email, password FROM users WHERE email = $1',
        [email]
      );

      if (result.rowCount === 0) {
        return reply.code(401).send({ message: 'Invalid email or password' });
      }

      const user = result.rows[0];
      const isValidPassword = await comparePassword(password, user.password);

      if (!isValidPassword) {
        return reply.code(401).send({ message: 'Invalid email or password' });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return reply.code(500).send({ message: 'JWT secret is not configured' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        secret,
        { expiresIn: '1d' }
      );

      return {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      req.log.error(error);
      return reply.code(500).send({ message: 'Unable to login' });
    }
  });

}