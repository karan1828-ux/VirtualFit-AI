import { Router, type Request, type Response, type NextFunction } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { registerLocalUser, requireAuth } from '../services/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.get('/me', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ id: user.id, email: user.email });
});

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const created = await registerLocalUser({ email, password });

    (req as any).logIn(created, (loginErr: any) => {
      if (loginErr) return next(loginErr);
      return res.json({ ok: true, user: { id: created.id, email: created.email } });
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {
  let parsed: { email: string; password: string };
  try {
    parsed = loginSchema.parse(req.body);
  } catch (err) {
    return next(err);
  }

  // passport-local reads from body fields
  req.body.email = parsed.email;
  req.body.password = parsed.password;

  passport.authenticate('local', { session: true }, (err: any, user: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    (req as any).logIn(user, (loginErr: any) => {
      if (loginErr) return next(loginErr);
      return res.json({ ok: true, user: { id: user.id, email: user.email } });
    });
  })(req, res, next);
});

authRouter.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  (req as any).logout((err: any) => {
    if (err) return next(err);
    req.session?.destroy(() => {
      res.json({ ok: true });
    });
  });
});

authRouter.get(
  '/google',
  (req, res, next) => {
    const enabled =
      Boolean(process.env.GOOGLE_CLIENT_ID) &&
      Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
      Boolean(process.env.GOOGLE_CALLBACK_URL);
    if (!enabled) return res.status(501).json({ error: 'Google auth is not configured.' });
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  },
);

authRouter.get(
  '/google/callback',
  (req, res, next) => {
    const enabled =
      Boolean(process.env.GOOGLE_CLIENT_ID) &&
      Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
      Boolean(process.env.GOOGLE_CALLBACK_URL);
    if (!enabled) return res.status(501).json({ error: 'Google auth is not configured.' });
    passport.authenticate('google', { failureRedirect: '/', successRedirect: '/' })(req, res, next);
  },
);

export { requireAuth };

