import jwt from 'jsonwebtoken';

// Khóa bí mật từ biến môi trường hoặc fallback
const jwtSecret = process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-access-token-key-2024';
const jwtRefreshSecret = process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-token-key-2024';

// Hàm tạo token
export const generateAccessToken = (payload: { id: number; email: string }) => {
    return jwt.sign(payload, jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '1d',
    });
};

export const generateRefreshToken = (payload: { id: number; email: string }) => {
    return jwt.sign(payload, jwtRefreshSecret, {
        algorithm: 'HS256',
        expiresIn: '7d',
    });
};

export { jwtSecret, jwtRefreshSecret };
