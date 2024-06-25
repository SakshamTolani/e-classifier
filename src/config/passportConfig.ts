import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { User } from '../types/user';
import dotenv from 'dotenv';

dotenv.config();

const users: User[] = [];

declare global {
    namespace Express {
        interface User {
            id: string;
            provider: string;
            displayName: string;
            emails?: { value: string }[];
            photos?: { value: string }[];
            accessToken: string;
            refreshToken: string;
        }
    }
}

export const configurePassport = () => {
    passport.use('google', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']
    },
        (accessToken: string, refreshToken: string, profile: any, done: any) => {
            let user = users.find(u => u.id === profile.id && u.provider === 'google');
            if (!user) {
                user = {
                    id: profile.id,
                    provider: 'google',
                    displayName: profile.displayName,
                    emails: profile.emails,
                    photos: profile.photos,
                    accessToken,
                    refreshToken
                };
                users.push(user);
            } else {
                user.accessToken = accessToken;
                user.refreshToken = refreshToken;
            }
            return done(null, user);
        }
    ));

    passport.use('outlook', new MicrosoftStrategy({
        clientID: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL,
        scope: ['user.read', 'mail.read']
    },
        (accessToken: string, refreshToken: string, profile: any, done: any) => {
            let user = users.find(u => u.id === profile.id && u.provider === 'outlook');
            if (!user) {
                user = {
                    id: profile.id,
                    provider: 'outlook',
                    displayName: profile.displayName,
                    emails: profile.emails,
                    photos: profile._json.photo ? [{ value: profile._json.photo }] : undefined,
                    accessToken,
                    refreshToken
                };
                users.push(user);
            } else {
                user.accessToken = accessToken;
                user.refreshToken = refreshToken;
            }
            return done(null, user);
        }
    ));

    passport.serializeUser((user: User, done) => {
        done(null, `${user.provider}:${user.id}`);
    });

    passport.deserializeUser((id: string, done) => {
        const [provider, userId] = id.split(':');
        const user = users.find(u => u.id === userId && u.provider === provider);
        done(null, user);
    });
};