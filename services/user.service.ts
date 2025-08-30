import { prisma } from '../config/database.js';

export class UserService {
    static async getUserById(id: number) {
        return await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true }
        });
    }

    static async updateUserAvatar(id: number, avatarUrl: string) {
        return await prisma.user.update({
            where: { id },
            data: { avatar: avatarUrl }
        });
    }

    static async getAdminInfo() {
        return await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, email: true, avatar: true }
        });
    }

    static async getUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email }
        });
    }

    static async getAllUsers() {
        return await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async deleteUser(id: number) {
        // First delete all posts by this user
        await prisma.post.deleteMany({
            where: { authorId: id }
        });

        // Then delete the user
        return await prisma.user.delete({
            where: { id }
        });
    }
}
