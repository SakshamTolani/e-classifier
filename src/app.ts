import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { configurePassport } from './config/passportConfig';
import authRoutes from './routes/authRoutes';
import { emailAnalysisQueue } from './services/queueService';

const app = express();

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport
configurePassport();

// Routes
app.use('/', authRoutes);

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Logged in');
  } else {
    res.send('Not logged in');
  }
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await emailAnalysisQueue.close();
    process.exit(0);
  });

export default app;