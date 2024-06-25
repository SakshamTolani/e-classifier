import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';

dotenv.config();

declare global {
  namespace Express {
    interface User {
      id: string;
      provider: string;
      displayName: string;
      emails?: { value: string }[];
      photos?: { value: string }[];
    }
  }
}

const users: Express.User[] = [];

export const configurePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || 
      !process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    throw new Error('Missing OAuth credentials');
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  (accessToken, refreshToken, profile, cb) => {
    let user = users.find(u => u.id === profile.id && u.provider === 'google');
    if (!user) {
      user = {
        id: profile.id,
        provider: 'google',
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos
      };
      users.push(user);
    }
    return cb(null, user);
  }
  ));

  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL,
    scope: ['user.read', 'mail.read'],
    tenant: 'common',
    authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  },
  (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: Express.User | false) => void) => {
    // If you're not using accessToken, you can ignore it with an underscore
    // (_accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: Express.User | false) => void) => {
    let user = users.find(u => u.id === profile.id && u.provider === 'outlook');
    if (!user) {
      user = {
        id: profile.id,
        provider: 'outlook',
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile._json.photo ? [{ value: profile._json.photo }] : undefined
      };
      users.push(user);
    }
    return done(null, user);
  }
  ));

  passport.serializeUser((user, done) => {
    done(null, `${user.provider}:${user.id}`);
  });

  passport.deserializeUser((id: string, done) => {
    const [provider, userId] = id.split(':');
    const user = users.find(u => u.id === userId && u.provider === provider);
    done(null, user);
  });
};