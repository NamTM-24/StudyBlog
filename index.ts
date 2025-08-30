import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import các module đã tách
import { prisma } from './config/database.js';
import { upload } from './config/multer.js';
import { initializeDefaultPosts } from './utils/database.utils.js';
import { jwtSecret } from './utils/jwt.utils.js';
import { authenticateJWT } from './middleware/auth.js';
import { requireAdmin } from './middleware/admin.js';
import { AuthService } from './services/auth.service.js';
import { PostService } from './services/post.service.js';
import { CommentService } from './services/comment.service.js';
import { UserService } from './services/user.service.js';
import { setupChatHandlers } from './chat-realtime/chat-handlers.js';
import { PasswordResetService } from './services/password-reset.service.js';
import type { AuthenticatedRequest } from './types/auth.types.js';
import jwt from 'jsonwebtoken';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';
import homeRoutes from './routes/home.routes.js';
import testRoutes from './routes/test.routes.js';

// Cấu hình file tĩnh
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình dotenv
dotenv.config();

// Khởi tạo Express
const app = express();
const port = process.env.PORT || 3000;

// Khởi tạo HTTP server và Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Serve fix-chat-errors.js from scripts folder
app.get('/fix-chat-errors.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts', 'fix-chat-errors.js'));
});

// Cấu hình view engine
app.set('views', './views');
app.set('view engine', 'ejs');

// Khởi tạo dữ liệu mặc định và setup chat handlers
initializeDefaultPosts();
setupChatHandlers(io);

// Setup cleanup password reset requests định kỳ (mỗi giờ)
setInterval(async () => {
    try {
        await PasswordResetService.cleanupExpiredResets();
    } catch (error) {
        console.error('Error in password reset cleanup:', error);
    }
}, 60 * 60 * 1000); // 1 giờ

// Chạy cleanup ngay khi khởi động
PasswordResetService.cleanupExpiredResets().catch(console.error);

// ==================== ROUTES ====================

// Sử dụng các route modules đã tách
app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/posts', postRoutes);
app.use('/api', commentRoutes);
app.use('/', testRoutes);

// Route: Upload avatar cho user
app.post('/api/upload-avatar', authenticateJWT, upload.single('avatar'), async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file avatar được tải lên' });
        }

        const userId = req.payload!.id;
        const avatarUrl = `/uploads/${req.file.filename}`;

        // Cập nhật avatar trong database
        await UserService.updateUserAvatar(userId, avatarUrl);

        res.json({ avatar: avatarUrl });
    } catch (error) {
        console.error('Lỗi upload avatar:', error);
        res.status(500).json({ error: 'Không thể tải avatar lên' });
    }
});

// Khởi động server
httpServer.listen(port, () => {
    console.log(`Ứng dụng đang chạy trên cổng ${port}`);
    console.log(`Socket.IO chat system đã sẵn sàng`);
});
