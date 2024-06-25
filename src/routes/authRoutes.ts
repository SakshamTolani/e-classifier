import { Router } from 'express';
import passport from 'passport';
// import { analyzeEmailContentAndAssignLabel } from '../config/passportConfig';
import { Client } from '@microsoft/microsoft-graph-client';
import { fetchEmails } from '../utils/gmailUtils';
import { google } from 'googleapis';
import { User } from '../types/user';

const router = Router();

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'] })
);
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/auth/microsoft',
  passport.authenticate('outlook', { scope: ['user.read', 'mail.read'] })
);

router.get('/auth/microsoft/callback',
  passport.authenticate('outlook', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });


  router.get('/emails', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
  
    const user = req.user as User;
  
    try {
      let emails;
      if (user.provider === 'outlook') {
        emails = await getOutlookEmails(user.accessToken);
      } else if (user.provider === 'google') {
        emails = await getGmailEmails(user.accessToken);
      } else {
        return res.status(400).json({ message: 'Unsupported email provider' });
      }
  
      res.json(emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ message: 'Error fetching emails' });
    }
  });
  
  async function getOutlookEmails(accessToken: string) {
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  
    const result = await client
      .api('/me/messages')
      .top(10)
      .select('subject,from,receivedDateTime')
      .orderby('receivedDateTime DESC')
      .get();
  
    return result.value.map((email: any) => ({
      subject: email.subject,
      from: email.from.emailAddress.address,
      receivedAt: email.receivedDateTime
    }));
  }
  
  async function getGmailEmails(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
  
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });
  
    const emails = await Promise.all(response.data.messages!.map(async (message) => {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!
      });
  
      const subject = email.data.payload!.headers!.find((header: any) => header.name === 'Subject')?.value;
      const from = email.data.payload!.headers!.find((header: any) => header.name === 'From')?.value;
      const date = email.data.payload!.headers!.find((header: any) => header.name === 'Date')?.value;
  
      return {
        subject,
        from,
        receivedAt: date
      };
    }));
  
    return emails;
  }

  
  router.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

export default router;