import { prisma } from '../config/database.js';

export class CommentService {
    static async getCommentsByPostId(postId: number) {
        return await prisma.comment.findMany({
            where: { postId, isDeleted: false, parentId: null },
            include: {
                author: true,
                children: {
                    where: { isDeleted: false },
                    include: { author: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async createComment(data: {
        postId: number;
        authorId: number;
        content: string;
        parentId?: number;
    }) {
        return await prisma.comment.create({
            data: {
                postId: data.postId,
                authorId: data.authorId,
                content: data.content,
                parentId: data.parentId ? Number(data.parentId) : null
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }

    static async updateComment(commentId: number, content: string, userId: number) {
        return await prisma.comment.update({
            where: { id: commentId },
            data: {
                content,
                editedAt: new Date(),
                lastEditedById: userId
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }

    static async deleteComment(commentId: number, userId: number, userRole: string) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            throw new Error('Không tìm thấy comment');
        }

        if (comment.authorId !== userId && userRole !== 'ADMIN') {
            throw new Error('Bạn không có quyền xóa comment này');
        }

        // Xóa mềm comment
        await prisma.comment.update({
            where: { id: commentId },
            data: { isDeleted: true }
        });

        // Nếu là comment cha, cũng xóa mềm các reply con
        if (!comment.parentId) {
            await prisma.comment.updateMany({
                where: { parentId: commentId },
                data: { isDeleted: true }
            });
        }

        return true;
    }

    static async getCommentById(commentId: number) {
        return await prisma.comment.findUnique({
            where: { id: commentId }
        });
    }
}
