import express from 'express';
import { UserService } from '../services/user.service.js';
import { PostService } from '../services/post.service.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { upload } from '../config/multer.js';
import { prisma } from '../config/database.js';
import type { AuthenticatedRequest } from '../types/auth.types.js';

const router = express.Router();

// Route: Trang admin liệt kê bài viết 
router.get('/', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await UserService.getUserById(req.payload!.id);
        const posts = await PostService.getAllPosts();
        const users = await UserService.getAllUsers();
        const userPosts = await PostService.getAllUserPosts();

        const viewPosts = posts.map(p => ({
            id: p.id,
            title: p.title,
            url: `/posts/${p.slug}`,
            createdAt: p.createdAt,
            status: p.status,
            imageUrl: p.heroImage || '',
            postType: (p as any).postType,
            author: (p as any).author
        }));

        const success = req.query.success;
        res.render('admin', { posts: viewPosts, success, user, users, userPosts });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi lấy danh sách bài viết');
    }
});

// Route: Trang quản lý bài viết của user (cho admin)
router.get('/user-posts', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await UserService.getUserById(req.payload!.id);
        const userPosts = await PostService.getAllUserPosts();

        const success = req.query.success;
        res.render('admin-user-posts', { posts: userPosts, success, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi lấy danh sách bài viết của user');
    }
});

// Route: Duyệt bài viết của user
router.post('/user-posts/:id/approve', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        await PostService.approveUserPost(id);
        return res.redirect('/admin/user-posts?success=approved');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể duyệt bài viết');
    }
});

// Route: Từ chối bài viết của user
router.post('/user-posts/:id/reject', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        await PostService.rejectUserPost(id);
        return res.redirect('/admin/user-posts?success=rejected');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể từ chối bài viết');
    }
});

// Route: Xóa mềm bài viết của user
router.post('/user-posts/:id/delete', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        await PostService.deletePost(id);
        return res.redirect('/admin/user-posts?success=deleted');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể xóa bài viết');
    }
});

// Route: Khôi phục bài viết của user
router.post('/user-posts/:id/restore', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        await PostService.restorePost(id);
        return res.redirect('/admin/user-posts?success=restored');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể khôi phục bài viết');
    }
});

// Route: Xóa vĩnh viễn bài viết của user
router.post('/user-posts/:id/hard-delete', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        await PostService.hardDeletePost(id);
        return res.redirect('/admin/user-posts?success=hard-deleted');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể xóa vĩnh viễn bài viết');
    }
});

// Route: Trang admin chat
router.get('/chat', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await UserService.getUserById(req.payload!.id);
        res.render('admin-chat', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tải trang admin chat');
    }
});

// Route: Trang admin chat fixed
router.get('/chat-fixed', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await UserService.getUserById(req.payload!.id);
        res.render('admin-chat-fixed', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tải trang admin chat fixed');
    }
});

// API: Lấy thông tin admin
router.get('/admin-info', async (req, res) => {
    try {
        const admin = await UserService.getAdminInfo();
        if (admin) {
            res.json(admin);
        } else {
            res.status(404).json({ error: 'Không tìm thấy admin' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Route thực hiện xoá bài viết
router.post('/posts/:id/delete', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        await PostService.deletePost(id);
        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không xoá được bài viết');
    }
});

// Route xoá hẳn bài viết (hard delete)
router.post('/posts/:id/hard-delete', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        await PostService.hardDeletePost(id);
        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không xoá được bài viết');
    }
});

// Route xoá hàng loạt bài viết
router.post('/posts/bulk-delete', authenticateJWT, requireAdmin, async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send('Danh sách ID không hợp lệ');
    }

    try {
        await prisma.post.deleteMany({
            where: {
                id: {
                    in: ids.map(id => Number(id)).filter(id => Number.isFinite(id))
                }
            }
        });

        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không xoá được bài viết');
    }
});

// Route toggle trạng thái bài viết
router.post('/posts/:id/toggle-status', authenticateJWT, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        await PostService.togglePostStatus(id);
        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể cập nhật trạng thái bài viết');
    }
});

// Route chỉnh sửa bài viết
router.post('/posts/:id/edit', authenticateJWT, requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).send('ID không hợp lệ');

    try {
        const { title } = req.body as { title?: string };
        const data: any = {};
        if (title && title.trim().length >= 3) {
            data.title = title.trim();
        }
        if (req.file) {
            data.heroImage = `/uploads/${req.file.filename}`;
        }

        if (Object.keys(data).length === 0) {
            return res.redirect('/admin');
        }

        await PostService.updatePost(id, data);
        return res.redirect('/admin');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Không thể chỉnh sửa bài viết');
    }
});

// Route tạo bài viết mới
router.get('/posts/new', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const user = await UserService.getUserById(req.payload!.id);
        res.render('create-post', { error: null, user });
    } catch (error) {
        console.error('Lỗi load trang create-post:', error);
        res.render('create-post', { error: null, user: null });
    }
});

// Route upload ảnh cho editor
router.post('/upload-image', authenticateJWT, requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res) => {
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

// Route tạo bài viết mới
router.post('/posts/new', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const { title, content } = req.body;

        if (!title || title.trim().length < 3) {
            return res.status(400).render('create-post', {
                error: 'Tiêu đề bắt buộc (>= 3 ký tự).'
            });
        }

        if (!content || content.trim().length < 10) {
            return res.status(400).render('create-post', {
                error: 'Nội dung bắt buộc (>= 10 ký tự).'
            });
        }

        await PostService.createAdminPost({
            title,
            content,
            authorId: req.payload!.id
        });

        res.redirect('/admin?success=published');
    } catch (e: any) {
        console.error('Lỗi tạo bài viết:', e);
        res.status(500).render('create-post', {
            error: 'Không tạo được bài viết. Vui lòng thử lại.'
        });
    }
});

// Admin user management
router.get('/users', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const users = await UserService.getAllUsers();
        res.render('admin-users', {
            user: req.payload,
            users
        });
    } catch (error) {
        console.error('Error loading users:', error);
        res.status(500).render('error', {
            message: 'Lỗi khi tải danh sách user',
            user: req.payload
        });
    }
});

// Delete user
router.post('/users/:id/delete', authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        await UserService.deleteUser(userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Không thể xóa user' });
    }
});

export default router;
