import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import { createUserGoogle, getUserByEmail, getUserById } from './db.js';
import { registerLocalUser, verifyLocalCredentials } from '../services/auth.js';

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const configurePassport = (): void => {
  passport.use(
    'local',
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email: string, password: string, done: any) => {
        try {
          const user = await verifyLocalCredentials({ email: String(email), password: String(password) });
          if (!user) return done(null, false);
          return done(null, user);
        } catch (err) {
          return done(err as any);
        }
      },
    ),
  );

  const googleClientID = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (googleClientID && googleClientSecret && googleCallbackURL) {
    passport.use(
      'google',
      new GoogleStrategy(
        {
          clientID: googleClientID,
          clientSecret: googleClientSecret,
          callbackURL: googleCallbackURL,
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile?.emails?.[0]?.value;
            if (!email) return done(new Error('Google account did not provide an email address.'));

            const user = await getUserByEmail(email);
            if (!user) {
              const newUser = await createUserGoogle({ email });
              return done(null, newUser);
            }

            return done(null, user);
          } catch (err) {
            return done(err as any);
          }
        },
      ),
    );
  }

  passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done: any) => {
    try {
      const user = await getUserById(id);
      done(null, user);
    } catch (err) {
      done(err as any);
    }
  });
};

export const ensureLocalUser = async (args: {
  email: string;
  password: string;
}) => {
  return registerLocalUser(args);
};

