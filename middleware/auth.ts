import jwt from 'jsonwebtoken';
import { jwtSecret } from '../utils/jwt.utils.js';

// Middleware xác thực JWT (bắt buộc - redirect nếu không có token)
export const authenticateJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.cookies.accessToken;
    if (!authHeader) {
        return res.redirect('/login'); // Chuyển hướng về login nếu không có token
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    jwt.verify(token, jwtSecret, (err: any, payload: any) => {
        if (err) {
            return res.redirect('/login'); // Chuyển hướng về login nếu token không hợp lệ
        }
        req.payload = payload;
        next();
    });
};

// Middleware xác thực không bắt buộc (không redirect, chỉ set req.user)
export const authMiddleware = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.cookies.accessToken;
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    jwt.verify(token, jwtSecret, (err: any, payload: any) => {
        if (err) {
            req.user = null;
        } else {
            req.user = payload;
        }
        next();
    });
};

// Middleware xác thực cho public pages (không redirect, set req.user và req.payload)
export const optionalAuth = async (req: any, res: any, next: any) => {
    const token = req.cookies.accessToken;
    if (!token) {
        req.user = null;
        req.payload = null;
        return next();
    }

    try {
        const payload = jwt.verify(token, jwtSecret) as any;
        req.user = payload;
        req.payload = payload;
        next();
    } catch (error) {
        // Token không hợp lệ, nhưng không redirect
        req.user = null;
        req.payload = null;
        next();
    }
};

// Middleware xác thực cho API (trả về JSON error thay vì redirect)
export const authenticateAPI = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.cookies.accessToken;
    if (!authHeader) {
        return res.status(401).json({ error: 'Bạn phải đăng nhập để thực hiện hành động này' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    jwt.verify(token, jwtSecret, (err: any, payload: any) => {
        if (err) {
            return res.status(401).json({ error: 'Token không hợp lệ, vui lòng đăng nhập lại' });
        }
        req.payload = payload;
        next();
    });
};
