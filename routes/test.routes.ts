import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Route redirect
router.get('/newsTypescript', (req, res) => {
    res.redirect('/posts/typescript-la-gi');
});

// Route: Test API endpoints (giữ lại để test server)
router.get('/api/test', (req, res) => {
    res.json({
        message: 'Test API working!',
        timestamp: new Date().toISOString(),
        env: {
            emailUser: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
            emailPassword: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
            baseUrl: process.env.BASE_URL || 'NOT SET'
        }
    });
});

export default router;
