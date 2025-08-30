import bcrypt from 'bcrypt';
import { prisma } from '../config/database.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils.js';

export class AuthService {
    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error('Email hoặc mật khẩu sai');
        }

        const payload = { id: user.id, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            },
            accessToken,
            refreshToken
        };
    }

    static async register(email: string, name: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        };
    }

    static async getUserById(id: number) {
        return await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, avatar: true }
        });
    }
}
