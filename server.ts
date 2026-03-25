import http from 'http';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Static Credentials
const ADMIN_USERNAME = 'kaislingpong';
const ADMIN_PASSWORD = 'kais100100';
const JWT_SECRET = 'kais-secret-key-2026';

/**
 * Helper to parse cookies from the request header
 */
function parseCookies(cookieHeader: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    const value = rest.join('=');
    if (name && value) {
      cookies[name.trim()] = value.trim();
    }
  });
  return cookies;
}

/**
 * Helper to parse JSON body from the request stream
 */
async function getJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });
}

/**
 * Main API Handler Function
 * This is exported for Vercel Serverless compatibility
 */
export default async function handler(req: any, res: any) {
  const url = req.url || '';
  const method = req.method || 'GET';
  
  // Vercel provides req.body/req.cookies, but native http doesn't
  const body = req.body || (method === 'POST' ? await getJsonBody(req) : {});
  const cookies = req.cookies || parseCookies(req.headers.cookie);

  // Helper to send JSON response
  const sendJson = (data: any, status = 200) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // Helper to set a cookie
  const setCookie = (name: string, value: string, maxAge: number) => {
    const isProd = process.env.NODE_ENV === 'production';
    let cookieStr = `${name}=${value}; HttpOnly; Path=/; Max-Age=${maxAge / 1000}; SameSite=Strict`;
    if (isProd) cookieStr += '; Secure';
    res.setHeader('Set-Cookie', cookieStr);
  };

  // Routing Logic
  if (url === '/api/admin/login' && method === 'POST') {
    if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
      const token = jwt.sign({ username: body.username }, JWT_SECRET, { expiresIn: '1d' });
      setCookie('admin_token', token, 24 * 60 * 60 * 1000);
      return sendJson({ success: true });
    }
    return sendJson({ error: 'Invalid credentials' }, 401);
  }

  if (url === '/api/admin/logout' && method === 'POST') {
    res.setHeader('Set-Cookie', 'admin_token=; Path=/; Max-Age=0; HttpOnly');
    return sendJson({ success: true });
  }

  if (url === '/api/admin/check' && method === 'GET') {
    const token = cookies.admin_token;
    if (!token) return sendJson({ authenticated: false });
    try {
      jwt.verify(token, JWT_SECRET);
      return sendJson({ authenticated: true });
    } catch (err) {
      return sendJson({ authenticated: false });
    }
  }

  // Fallback for API routes
  if (url.startsWith('/api/')) {
    return sendJson({ error: 'Not Found' }, 404);
  }
}

/**
 * Development Server
 * Runs locally using native http module
 */
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const startDevServer = async () => {
    const server = http.createServer(async (req, res) => {
      // Handle API requests
      if (req.url?.startsWith('/api/')) {
        return handler(req, res);
      }

      // Handle Static Files / Vite
      if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        vite.middlewares(req, res);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url || '');
        
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(distPath, 'index.html');
        }

        const ext = path.extname(filePath);
        const contentTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
        };

        res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
        res.end(fs.readFileSync(filePath));
      }
    });

    server.listen(3000, '0.0.0.0', () => {
      console.log('--- Native Node Server Running (No Express) ---');
      console.log('URL: http://localhost:3000');
    });
  };

  startDevServer();
}
