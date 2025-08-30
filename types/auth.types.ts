import type { Request } from 'express';

export interface JwtPayload {
    id: number;
    email: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    payload?: { id: number; email: string };
    // Dùng any để tránh lỗi type với multer namespace khác phiên bản
    file?: any;
    files?: any;
}
