import { Router } from 'express';
import passport from 'passport';
import { Client } from '@microsoft/microsoft-graph-client';
import { User } from '../types/user';
import { fetchEmails, processEmail } from '../services/emailService';

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
        const emails = await fetchEmails(user);
        const processedEmails = await Promise.all(emails.map(processEmail));
        res.json(processedEmails);
    } catch (error) {
        console.error('Error fetching and processing emails:', error);
        res.status(500).json({ message: 'Error fetching and processing emails' });
    }
});


router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

export default router;