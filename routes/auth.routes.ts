import express from 'express';
import { AuthService } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';
import { PasswordResetService } from '../services/password-reset.service.js';
import { jwtSecret } from '../utils/jwt.utils.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Route: Trang đăng nhập
router.get('/login', (req, res) => {
    res.render('login');
});

// Route: Xử lý đăng nhập
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).render('login', { error: 'Email và mật khẩu là bắt buộc' });
    }

    try {
        const result = await AuthService.login(email, password);

        res.cookie('accessToken', result.accessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).render('login', { error: 'Lỗi server khi đăng nhập' });
    }
});

// Route: Trang đăng ký
router.get('/register', (req, res) => {
    res.render('dangky');
});

// Route: Xử lý đăng ký
router.post('/register', async (req, res) => {
    const { email, name, password, confirmPassword } = req.body;

    if (!email || !name || !password || !confirmPassword) {
        return res.status(400).render('dangky', { error: 'Email, tên, mật khẩu và xác nhận mật khẩu là bắt buộc' });
    }

    if (password !== confirmPassword) {
        return res.status(400).render('dangky', { error: 'Mật khẩu và xác nhận mật khẩu không khớp' });
    }

    if (password.length < 6) {
        return res.status(400).render('dangky', { error: 'Mật khẩu phải ít nhất 6 ký tự' });
    }

    try {
        await AuthService.register(email, name, password);
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(400).render('dangky', { error: 'Lỗi đăng ký: Email đã tồn tại hoặc lỗi server' });
    }
});

// Route: Trang quên mật khẩu
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

// Route: Xử lý gửi email reset password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).render('forgot-password', { error: 'Email là bắt buộc' });
    }

    try {
        const result = await PasswordResetService.createPasswordReset(email);

        if (result.success) {
            res.render('forgot-password', {
                success: true,
                message: result.message,
                showCodeForm: true,
                token: result.token
            });
        } else {
            res.render('forgot-password', { error: result.message });
        }
    } catch (error) {
        console.error('Error in forgot-password POST:', error);
        res.render('forgot-password', { error: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
    }
});

// Route: Trang xác nhận mã
router.get('/verify-code', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.redirect('/forgot-password');
    }
    res.render('verify-code', { token });
});

// Route: Xử lý xác nhận mã
router.post('/verify-code', async (req, res) => {
    const { token, code } = req.body;

    console.log('🔍 Verify code request:', { token, code });

    if (!token || !code) {
        console.log('❌ Missing token or code');
        return res.status(400).render('verify-code', {
            error: 'Token và mã xác nhận là bắt buộc',
            token
        });
    }

    try {
        const result = await PasswordResetService.verifyResetCode(token, code);
        console.log('🔍 Verify result:', result);

        if (result.success) {
            // Khi xác nhận mã thành công, render trực tiếp trang reset password
            console.log('✅ Code verified successfully, rendering reset-password page');
            return res.render('reset-password', {
                token,
                success: false,
                message: 'Mã xác nhận hợp lệ! Vui lòng nhập mật khẩu mới của bạn.'
            });
        } else {
            console.log('❌ Code verification failed:', result.message);
            return res.render('verify-code', {
                error: result.message,
                token
            });
        }
    } catch (error) {
        console.error('❌ Error in verify-code POST:', error);
        return res.render('verify-code', {
            error: 'Có lỗi xảy ra khi xác thực mã',
            token
        });
    }
});

// Route: Trang đặt lại mật khẩu
router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    console.log('🔍 Reset password GET request, token:', token ? 'provided' : 'none');

    if (!token) {
        console.log('❌ No token provided, redirecting to forgot-password');
        return res.redirect('/forgot-password');
    }

    console.log('✅ Rendering reset-password page with token');
    res.render('reset-password', { token });
});

// Route: Xử lý đặt lại mật khẩu
router.post('/reset-password', async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
        return res.status(400).render('reset-password', {
            error: 'Token và mật khẩu mới là bắt buộc',
            token
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).render('reset-password', {
            error: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
            token
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).render('reset-password', {
            error: 'Mật khẩu phải ít nhất 6 ký tự',
            token
        });
    }

    try {
        const result = await PasswordResetService.resetPassword(token, newPassword);

        if (result.success) {
            res.render('reset-password', {
                success: true,
                message: result.message
            });
        } else {
            res.render('reset-password', {
                error: result.message,
                token
            });
        }
    } catch (error) {
        console.error('Error in reset-password POST:', error);
        res.render('reset-password', {
            error: 'Có lỗi xảy ra khi đặt lại mật khẩu',
            token
        });
    }
});

// Route: Đăng xuất
router.get('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.redirect('/login');
});

export default router;
