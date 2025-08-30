import express from 'express';
import { PostService } from '../services/post.service.js';
import { UserService } from '../services/user.service.js';
import { authenticateJWT, optionalAuth } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import type { AuthenticatedRequest } from '../types/auth.types.js';

const router = express.Router();

// Route: Trang danh sách bài viết
router.get('/', async (req, res) => {
    try {
        const posts = await PostService.getActivePosts();
        res.render('posts-list', { posts });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi lấy danh sách bài viết');
    }
});

// ==================== USER POST ROUTES ====================

// Route: Trang tạo bài viết mới cho user
router.get('/create/new', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await UserService.getUserById(req.payload!.id);
        res.render('user-create-post', { error: null, user });
    } catch (error) {
        console.error('Lỗi load trang tạo bài viết:', error);
        res.render('user-create-post', { error: null, user: null });
    }
});

// Route: Trang xem bài viết chi tiết (public - sử dụng optionalAuth)
router.get('/:slug', optionalAuth, async (req: any, res) => {
    try {
        const post = await PostService.getPostBySlug(req.params.slug);
        if (!post) {
            return res.status(404).send('Không tìm thấy bài viết');
        }

        const otherPosts = await PostService.getOtherPosts(req.params.slug);

        // Format posts để có url
        const formattedOtherPosts = otherPosts.map(post => ({
            ...post,
            url: `/posts/${post.slug}`
        }));

        // Lấy thông tin user từ middleware optionalAuth
        let user: any = null;
        if (req.user) {
            user = await UserService.getUserById(req.user.id);
        }

        res.render('post-view', { post, otherPosts: formattedOtherPosts, relatedPosts: formattedOtherPosts, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi lấy bài viết');
    }
});

// Route: Upload ảnh cho editor của user
router.post('/upload-image', authenticateJWT, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file ảnh được tải lên' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        res.status(500).json({ error: 'Không thể tải ảnh lên' });
    }
});

// Route: Tạo bài viết mới cho user
router.post('/create/new', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const { title, content } = req.body;

        if (!title || title.trim().length < 3) {
            return res.status(400).render('user-create-post', {
                error: 'Tiêu đề bắt buộc (>= 3 ký tự).',
                user: await UserService.getUserById(req.payload!.id)
            });
        }

        if (!content || content.trim().length < 10) {
            return res.status(400).render('user-create-post', {
                error: 'Nội dung bắt buộc (>= 10 ký tự).',
                user: await UserService.getUserById(req.payload!.id)
            });
        }

        await PostService.createUserPost({
            title,
            content,
            authorId: req.payload!.id
        });

        res.redirect('/posts/user/manage?success=submitted');
    } catch (e: any) {
        console.error('Lỗi tạo bài viết:', e);
        res.status(500).render('user-create-post', {
            error: 'Không tạo được bài viết. Vui lòng thử lại.',
            user: await UserService.getUserById(req.payload!.id)
        });
    }
});

// Route: Trang quản lý bài viết của user
router.get('/user/manage', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await UserService.getUserById(req.payload!.id);
        const userPosts = await PostService.getUserPosts(req.payload!.id);

        const success = req.query.success;
        res.render('user-manage-posts', { posts: userPosts, success, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi lấy danh sách bài viết');
    }
});

// Route: Xóa bài viết của user
router.delete('/user/delete/:postId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const postId = parseInt(req.params.postId || '0');
        const userId = req.payload!.id;

        // Kiểm tra xem bài viết có thuộc về user này không
        const post = await PostService.getPostById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Không tìm thấy bài viết' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ error: 'Bạn không có quyền xóa bài viết này' });
        }

        // Xóa bài viết
        await PostService.deletePost(postId);

        res.json({ success: true, message: 'Đã xóa bài viết thành công' });
    } catch (err) {
        console.error('Lỗi xóa bài viết:', err);
        res.status(500).json({ error: 'Không thể xóa bài viết' });
    }
});

// Route: Trang chỉnh sửa bài viết
router.get('/user/edit/:postId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const postId = parseInt(req.params.postId || '0');
        const userId = req.payload!.id;

        // Kiểm tra xem bài viết có thuộc về user này không
        const post = await PostService.getPostById(postId);
        if (!post) {
            return res.status(404).send('Không tìm thấy bài viết');
        }

        if (post.authorId !== userId) {
            return res.status(403).send('Bạn không có quyền chỉnh sửa bài viết này');
        }

        const user = await UserService.getUserById(userId);
        res.render('user-edit-post', { post, user, error: null });
    } catch (err) {
        console.error('Lỗi load trang chỉnh sửa:', err);
        res.status(500).send('Lỗi khi tải trang chỉnh sửa');
    }
});

// Route: Cập nhật bài viết
router.post('/user/edit/:postId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
    try {
        const postId = parseInt(req.params.postId || '0');
        const userId = req.payload!.id;
        const { title, content } = req.body;

        // Kiểm tra xem bài viết có thuộc về user này không
        const post = await PostService.getPostById(postId);
        if (!post) {
            return res.status(404).send('Không tìm thấy bài viết');
        }

        if (post.authorId !== userId) {
            return res.status(403).send('Bạn không có quyền chỉnh sửa bài viết này');
        }

        // Validate input
        if (!title || title.trim().length < 3) {
            const user = await UserService.getUserById(userId);
            return res.status(400).render('user-edit-post', {
                post,
                user,
                error: 'Tiêu đề bắt buộc (>= 3 ký tự).'
            });
        }

        if (!content || content.trim().length < 10) {
            const user = await UserService.getUserById(userId);
            return res.status(400).render('user-edit-post', {
                post,
                user,
                error: 'Nội dung bắt buộc (>= 10 ký tự).'
            });
        }

        // Cập nhật bài viết
        await PostService.updateUserPost(postId, {
            title: title.trim(),
            content: content.trim()
        });

        res.redirect('/posts/user/manage?success=updated');
    } catch (e: any) {
        console.error('Lỗi cập nhật bài viết:', e);
        const user = await UserService.getUserById(req.payload!.id);
        const post = await PostService.getPostById(parseInt(req.params.postId || '0'));
        res.status(500).render('user-edit-post', {
            post,
            user,
            error: 'Không cập nhật được bài viết. Vui lòng thử lại.'
        });
    }
});

export default router;
