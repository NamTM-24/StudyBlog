import { prisma } from '../config/database.js';
import { makeUniqueSlug } from '../utils/slug.utils.js';

export class PostService {
    static async getAllPosts() {
        return await prisma.post.findMany({
            include: {
                author: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getActivePosts() {
        return await prisma.post.findMany({
            where: { status: 'ACTIVE' },
            include: {
                author: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: { publishedAt: 'desc' },
        });
    }

    static async getPostBySlug(slug: string) {
        return await prisma.post.findUnique({
            where: { slug, status: 'ACTIVE' },
            include: {
                author: {
                    select: { id: true, name: true, email: true, role: true, avatar: true }
                }
            }
        });
    }

    static async getPostById(id: number) {
        return await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, name: true, email: true, role: true, avatar: true }
                }
            }
        });
    }

    static async getHomePost() {
        return await prisma.post.findUnique({ where: { slug: 'home' } });
    }

    // Tạo bài viết cho admin (tự động active)
    static async createAdminPost(postData: {
        title: string;
        content: string;
        authorId: number;
    }) {
        const user = await prisma.user.findUnique({
            where: { id: postData.authorId },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });

        const finalSlug = await makeUniqueSlug(postData.title);

        const postDataForDB: any = {
            title: postData.title.trim(),
            slug: finalSlug,
            authorName: user?.name || 'Tác giả',
            authorUrl: `mailto:${user?.email || ''}`,
            lead: postData.content.trim(),
            excerpt: postData.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            publishedAt: new Date(),
            status: 'ACTIVE',
            postType: 'ADMIN',
            authorId: postData.authorId
        };

        return await prisma.post.create({
            data: postDataForDB
        });
    }

    // Tạo bài viết cho user (tự động active)
    static async createUserPost(postData: {
        title: string;
        content: string;
        authorId: number;
    }) {
        const user = await prisma.user.findUnique({
            where: { id: postData.authorId },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });

        const finalSlug = await makeUniqueSlug(postData.title);

        const postDataForDB: any = {
            title: postData.title.trim(),
            slug: finalSlug,
            authorName: user?.name || 'Tác giả',
            authorUrl: `mailto:${user?.email || ''}`,
            lead: postData.content.trim(),
            excerpt: postData.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            publishedAt: new Date(), // Tự động publish
            status: 'ACTIVE', // Tự động active
            postType: 'USER',
            authorId: postData.authorId
        };

        return await prisma.post.create({
            data: postDataForDB
        });
    }

    // Lấy bài viết của user cụ thể
    static async getUserPosts(userId: number) {
        return await prisma.post.findMany({
            where: {
                authorId: userId,
                postType: 'USER'
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Lấy tất cả bài viết của user (cho admin quản lý)
    static async getAllUserPosts() {
        return await prisma.post.findMany({
            where: {
                postType: 'USER'
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Duyệt bài viết của user
    static async approveUserPost(postId: number) {
        return await prisma.post.update({
            where: { id: postId },
            data: {
                status: 'ACTIVE',
                publishedAt: new Date()
            }
        });
    }

    // Từ chối bài viết của user
    static async rejectUserPost(postId: number) {
        return await prisma.post.update({
            where: { id: postId },
            data: {
                status: 'INACTIVE',
                deletedAt: new Date()
            }
        });
    }

    static async updatePost(id: number, data: any) {
        return await prisma.post.update({
            where: { id },
            data
        });
    }

    // Cập nhật bài viết của user
    static async updateUserPost(postId: number, postData: {
        title: string;
        content: string;
    }) {
        const user = await prisma.user.findUnique({
            where: { id: (await prisma.post.findUnique({ where: { id: postId } }))?.authorId },
            select: { id: true, email: true, name: true, role: true, avatar: true }
        });

        const finalSlug = await makeUniqueSlug(postData.title, postId);

        const postDataForDB: any = {
            title: postData.title.trim(),
            slug: finalSlug,
            authorName: user?.name || 'Tác giả',
            authorUrl: `mailto:${user?.email || ''}`,
            lead: postData.content.trim(),
            excerpt: postData.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            updatedAt: new Date()
        };

        return await prisma.post.update({
            where: { id: postId },
            data: postDataForDB
        });
    }

    static async deletePost(id: number) {
        return await prisma.post.update({
            where: { id },
            data: { status: 'INACTIVE', deletedAt: new Date() },
        });
    }

    // Khôi phục bài viết từ soft delete
    static async restorePost(id: number) {
        return await prisma.post.update({
            where: { id },
            data: { status: 'ACTIVE', deletedAt: null },
        });
    }

    static async hardDeletePost(id: number) {
        return await prisma.post.delete({
            where: { id }
        });
    }

    static async togglePostStatus(id: number) {
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) throw new Error('Không tìm thấy bài viết');

        const isActive = post.status === 'ACTIVE';
        return await prisma.post.update({
            where: { id },
            data: {
                status: isActive ? 'INACTIVE' : 'ACTIVE',
                deletedAt: isActive ? new Date() : null,
            }
        });
    }

    static async getOtherPosts(excludeSlug: string, limit: number = 6) {
        return await prisma.post.findMany({
            where: {
                status: 'ACTIVE',
                slug: { not: excludeSlug }
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, role: true }
                }
            },
            orderBy: { publishedAt: 'desc' },
            take: limit
        });
    }
}
