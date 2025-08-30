import { prisma } from '../config/database.js';

// Middleware kiểm tra quyền admin 
export const requireAdmin = async (req: any, res: any, next: any) => {
    const userId = req.payload?.id;
    if (!userId) return res.redirect('/login');
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, avatar: true }
    });
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).send('Không có quyền truy cập admin')
    }
    next();
}
