import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);
console.log(`--- Startup Debug ---`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`.env file exists: ${envExists}`);
if (envExists) {
  const result = dotenv.config({ override: true });
  if (result.error) {
    console.error('Dotenv error:', result.error);
  } else {
    console.log('Dotenv loaded successfully (with override)');
    console.log('Keys loaded:', Object.keys(result.parsed || {}));
  }
} else {
  console.warn('.env file not found at root.');
}
console.log(`----------------------`);

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const ADMIN_USERNAME = 'kaislingpong';
const ADMIN_PASSWORD = 'kais100100';
const JWT_SECRET = process.env.JWT_SECRET || 'kais-secret-key-2026';

console.log(`--- Final Config ---`);
console.log(`Admin Portal Initialized`);
console.log(`----------------------`);

if (!process.env.ADMIN_PASSWORD) {
  console.warn('WARNING: ADMIN_PASSWORD not found in environment. Using default fallback.');
} else {
  console.log('SUCCESS: ADMIN_PASSWORD loaded from environment.');
}

// Admin Auth Middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Login Route
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    return res.json({ success: true });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// Admin Logout Route
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

// Check Auth Status
app.get('/api/admin/check', (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) return res.json({ authenticated: false });

  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
