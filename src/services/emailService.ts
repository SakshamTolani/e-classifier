import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { User } from '../types/user';
import { analyzeEmailContent } from './anthropicService';
import { queueEmailAnalysis } from './queueService';

export async function fetchEmails(user: User, limit: number = 10) {
  if (user.provider === 'google') {
    return await fetchGmailEmails(user, limit);
  } else if (user.provider === 'outlook') {
    return await fetchOutlookEmails(user, limit);
  } else {
    throw new Error('Unsupported email provider');
  }
}

async function fetchGmailEmails(user: User, limit: number) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: user.accessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: limit
  });

  const emails = await Promise.all(response.data.messages!.map(async (message) => {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!
    });

    const subject = email.data.payload!.headers!.find((header: any) => header.name === 'Subject')?.value;
    const from = email.data.payload!.headers!.find((header: any) => header.name === 'From')?.value;
    const date = email.data.payload!.headers!.find((header: any) => header.name === 'Date')?.value;
    const body = getEmailBody(email.data);

    return {
      id: email.data.id,
      subject,
      from,
      receivedAt: date,
      body
    };
  }));

  return emails;
}

async function fetchOutlookEmails(user: User, limit: number) {
  const client = Client.init({
    authProvider: (done) => {
      done(null, user.accessToken);
    }
  });

  const result = await client
    .api('/me/messages')
    .top(limit)
    .select('id,subject,from,receivedDateTime,body')
    .orderby('receivedDateTime DESC')
    .get();

  return result.value.map((email: any) => ({
    id: email.id,
    subject: email.subject,
    from: email.from.emailAddress.address,
    receivedAt: email.receivedDateTime,
    body: email.body.content
  }));
}

function getEmailBody(message: any): string {
  if (message.payload.body.size > 0) {
    return Buffer.from(message.payload.body.data, 'base64').toString();
  } else if (message.payload.parts) {
    for (let part of message.payload.parts) {
      if (part.mimeType === 'text/plain') {
        return Buffer.from(part.body.data, 'base64').toString();
      }
    }
  }
  return '';
}

export async function processEmail(email: any) {
    const { category, suggestedReply } = await queueEmailAnalysis(email.body);
  
    return {
      ...email,
      category,
      suggestedReply
    };
  }

  