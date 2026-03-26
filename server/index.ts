import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { authRouter } from './auth/routes.js';
import { z } from 'zod';
import { ApiError } from './services/errors.js';
import { ensureAuthSchema } from './auth/db.js';
import { configurePassport } from './auth/passport.js';
import { tryOnRouter } from './routes/tryonRoutes.js';

export const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));

// Auth foundation (sessions + passport strategies)
configurePassport();

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

ensureAuthSchema().catch((err) => {
  console.error('Failed to initialize auth schema:', err);
});

app.use('/api/auth', authRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use('/api', tryOnRouter);

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Invalid request payload.',
      details: error.flatten(),
    });
  }
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message });
  }

  const fallbackMessage = error instanceof Error ? error.message : 'Unexpected server error.';
  return res.status(500).json({ error: fallbackMessage });
});

if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
  app.listen(port, () => {
    console.log(`VirtualFit backend running on port ${port}`);
  });
}
