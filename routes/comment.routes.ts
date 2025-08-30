import express from 'express';
import { CommentService } from '../services/comment.service.js';
import { PostService } from '../services/post.service.js';
import { UserService } from '../services/user.service.js';
import { authenticateAPI } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.types.js';

const router = express.Router();

// API tạo comment cho bài viết (không reload trang)
router.post('/posts/:slug/comments', authenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
        const { slug } = req.params;
        const { content, parentId } = req.body;
        const userId = req.payload?.id;

        if (!content || !userId) {
            return res.status(400).json({ error: 'Nội dung comment và user ID là bắt buộc' });
        }

        if (!slug) {
            return res.status(400).json({ error: 'Slug không hợp lệ' });
        }

        const post = await PostService.getPostBySlug(slug);
        if (!post) {
            return res.status(404).json({ error: 'Không tìm thấy bài viết' });
        }

        const newComment = await CommentService.createComment({
            postId: post.id,
            authorId: userId,
            content: content.trim(),
            parentId: parentId ? Number(parentId) : undefined
        });

        res.json({
            success: true,
            comment: {
                id: newComment.id,
                content: newComment.content,
                createdAt: newComment.createdAt,
                author: newComment.author,
                parentId: newComment.parentId
            }
        });
    } catch (err) {
        console.error('Lỗi tạo comment:', err);
        res.status(500).json({ error: 'Không thể tạo comment' });
    }
});

// API xóa comment (không reload trang)
router.delete('/comments/:id', authenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
        const commentId = Number(req.params.id);
        const userId = req.payload?.id;

        const user = await UserService.getUserById(userId!);
        const comment = await CommentService.getCommentById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Không tìm thấy comment' });
        }

        if (comment.authorId !== userId && user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Bạn không có quyền xóa comment này' });
        }

        await CommentService.deleteComment(commentId, userId!, user?.role || 'USER');
        res.json({ success: true });
    } catch (err) {
        console.error('Lỗi xóa comment:', err);
        res.status(500).json({ error: 'Không thể xóa comment' });
    }
});

// API lấy comments cho bài viết (public - không cần auth)
router.get('/posts/:slug/comments', async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await PostService.getPostBySlug(slug);

        if (!post) {
            return res.status(404).json({ error: 'Không tìm thấy bài viết' });
        }

        const comments = await CommentService.getCommentsByPostId(post.id);
        res.json({ comments });
    } catch (err) {
        console.error('Lỗi lấy comments:', err);
        res.status(500).json({ error: 'Không thể lấy comments' });
    }
});

// API cập nhật comment (không reload trang)
router.put('/comments/:id', authenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
        const commentId = Number(req.params.id);
        const userId = req.payload?.id;
        const { content } = req.body;

        const user = await UserService.getUserById(userId!);
        const comment = await CommentService.getCommentById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Không tìm thấy comment' });
        }

        if (comment.authorId !== userId && user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa comment này' });
        }

        const updatedComment = await CommentService.updateComment(commentId, content.trim(), userId!);

        res.json({
            success: true,
            comment: {
                id: updatedComment.id,
                content: updatedComment.content,
                editedAt: updatedComment.editedAt,
                author: updatedComment.author
            }
        });
    } catch (err) {
        console.error('Lỗi cập nhật comment:', err);
        res.status(500).json({ error: 'Không thể cập nhật comment' });
    }
});

export default router;
