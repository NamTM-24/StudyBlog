import express from 'express';
import { UserService } from '../services/user.service.js';
import { PostService } from '../services/post.service.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Extend Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

// User profile page - Hashnode style
router.get('/profile/:userId', authMiddleware, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // Get user details
        const user = await UserService.getUserById(userId);
        if (!user) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy người dùng',
                user: req.user
            });
        }

        // Get user's posts
        const userPosts = await PostService.getUserPosts(userId);

        // Check if current user is viewing their own profile
        const isOwnProfile = req.user && req.user.id === userId;

        res.render('user-profile', {
            user: req.user,
            profileUser: user,
            userPosts,
            isOwnProfile
        });
    } catch (error) {
        console.error('Error loading user profile:', error);
        res.status(500).render('error', {
            message: 'Lỗi khi tải trang profile',
            user: req.user
        });
    }
});

// Current user's profile (redirect to /profile/:id)
router.get('/profile', authMiddleware, (req, res) => {
    res.redirect(`/user/profile/${req.user.id}`);
});

export default router;
