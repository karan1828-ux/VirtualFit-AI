import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { createUserLocal, getUserByEmail } from '../auth/db.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const isAuthed = typeof (req as any).isAuthenticated === 'function' ? (req as any).isAuthenticated() : false;
  if (!isAuthed) return res.status(401).json({ error: 'Unauthorized' });
  return next();
};

export const registerLocalUser = async (args: { email: string; password: string }) => {
  const existing = await getUserByEmail(args.email);
  if (existing) throw new Error('Email is already registered.');

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(args.password, saltRounds);
  return createUserLocal({ email: args.email, passwordHash });
};

export const verifyLocalCredentials = async (args: { email: string; password: string }) => {
  const user = await getUserByEmail(args.email);
  if (!user || !user.password_hash) return null;

  const ok = await bcrypt.compare(args.password, user.password_hash);
  return ok ? user : null;
};

