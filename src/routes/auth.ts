import { FastifyInstance } from "fastify";  

import { pool } from "../db/db";
import { hashPassword, comparePassword } from "../utils/hash";

import jwt from "jsonwebtoken";

export async function authRoutes(app: FastifyInstance) {

  app.post('/signup', {
    schema: {
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (req: any) => {
    const { name, email, password } = req.body;

    const hashed = await hashPassword(password);

    await pool.query(
      'INSERT INTO users (name,email,password) VALUES ($1,$2,$3)',
      [name, email, hashed]
    );

    return { message: 'User created' };
  });

  app.post('/login', {
    schema: {
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (req: any, reply: any) => {
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
  });

}