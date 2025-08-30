import express from 'express';
import { PostService } from '../services/post.service.js';
import { CommentService } from '../services/comment.service.js';
import { UserService } from '../services/user.service.js';
import { authenticateJWT, optionalAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.types.js';

const router = express.Router();

// Route: Trang chủ (public - sử dụng optionalAuth)
router.get('/', optionalAuth, async (req: any, res) => {
    try {
        // Lấy thông tin user từ middleware optionalAuth
        let user: any = null;
        if (req.user) {
            user = await UserService.getUserById(req.user.id);
        }

        // Lấy bài viết "home"
        const post = await PostService.getHomePost();
        if (!post) return res.status(404).send('Không tìm thấy bài viết home');

        // Lấy comments cho trang home
        const comments = await CommentService.getCommentsByPostId(post.id);

        // Lấy tất cả bài viết active (cả admin và user) trừ bài home
        const allActivePosts = await PostService.getActivePosts();
        const otherPosts = allActivePosts
            .filter(p => p.slug !== 'home' && p.status === 'ACTIVE')
            .sort((a, b) => {
                const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 6);

        // Format dữ liệu cho template
        const formattedPosts = otherPosts.map(post => ({
            ...post,
            url: `/posts/${post.slug}`,
            prettyDate: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '',
            excerpt: post.excerpt || post.title.substring(0, 100) + '...',
            readTime: Math.max(1, Math.ceil((post.title.length + (post.excerpt?.length || 0)) / 200)),
            isUserPost: post.postType === 'USER'
        }));

        res.render('home', { comments, user, post, otherPosts: formattedPosts });
    } catch (error) {
        console.error('Lỗi load trang chủ:', error);
        res.status(500).send('Lỗi server');
    }
});

// Route: Trang chủ (bảo vệ - cần đăng nhập)
router.get('/home', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const post = await PostService.getHomePost();
        if (!post) return res.status(404).send('Không tìm thấy bài viết home');

        const comments = await CommentService.getCommentsByPostId(post.id);

        // Lấy tất cả bài viết active (cả admin và user) trừ bài home
        const allActivePosts = await PostService.getActivePosts();
        const otherPosts = allActivePosts
            .filter(p => p.slug !== 'home' && p.status === 'ACTIVE')
            .sort((a, b) => {
                const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 6);

        // Format dữ liệu cho template
        const formattedPosts = otherPosts.map(post => ({
            ...post,
            url: `/posts/${post.slug}`,
            prettyDate: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '',
            excerpt: post.excerpt || post.title.substring(0, 100) + '...',
            readTime: Math.max(1, Math.ceil((post.title.length + (post.excerpt?.length || 0)) / 200)),
            isUserPost: post.postType === 'USER'
        }));

        // Lấy user từ DB để có đủ role
        let user: any = null;
        if (req.payload?.id) {
            user = await UserService.getUserById(req.payload.id);
        }

        res.render('home', { comments, user, post, otherPosts: formattedPosts });
    } catch (error) {
        console.error('Lỗi load trang chủ:', error);
        res.status(500).send('Lỗi server');
    }
});

// Route xử lý comment cho trang home
router.post('/home/comment', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const { comment, parentId } = req.body;
    const userId = req.payload?.id;
    const post = await PostService.getHomePost();
    if (!comment || !userId || !post) return res.redirect('/home');

    await CommentService.createComment({
        postId: post.id,
        authorId: userId,
        content: comment,
        parentId: parentId ? Number(parentId) : undefined
    });
    res.redirect('/home');
});

// delete comment user 
router.post('/home/comment/:id/delete', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const commentId = Number(req.params.id);
    const userId = req.payload?.id;
    const user = await UserService.getUserById(userId!);

    // Tìm comment cần xoá
    const comment = await CommentService.getCommentById(commentId);
    if (!comment) return res.redirect('/home');

    // Chỉ cho phép xoá nếu là chủ comment hoặc admin
    if (comment.authorId !== userId && user?.role !== 'ADMIN') {
        return res.status(403).send('Bạn không có quyền xoá bình luận này');
    }

    await CommentService.deleteComment(commentId, userId!, user?.role || 'USER');
    res.redirect('/home');
});

// update comment by user
router.post('/home/comment/:id/edit', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    const commentId = Number(req.params.id);
    const userId = req.payload?.id;
    const { content } = req.body;
    const user = await UserService.getUserById(userId!);

    // Tìm comment và kiểm tra quyền
    const comment = await CommentService.getCommentById(commentId);

    if (!comment || comment.authorId !== userId && user?.role !== 'ADMIN') {
        return res.status(403).send('Bạn không có quyền chỉnh sửa bình luận này');
    }

    await CommentService.updateComment(commentId, content, userId!);
    res.redirect('/home');
});

export default router;
