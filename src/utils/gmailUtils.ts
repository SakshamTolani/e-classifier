import { google } from 'googleapis';
// import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_CALLBACK_URL || '';

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

export const getAuthUrl = () => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'], // Scope for reading emails
    });
    return authUrl;
  };

export const getTokensFromCode = async (code: string) => {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log(tokens);
    oAuth2Client.setCredentials(tokens);
    return tokens;
};

export const fetchEmails = async () => {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'label:inbox',
    });
    return res.data.messages;
};