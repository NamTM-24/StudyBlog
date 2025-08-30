import { prisma } from '../config/database.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class PasswordResetService {
    private static transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'zlatannam2491@gmail.com',
            pass: process.env.EMAIL_PASSWORD || 'dyemnqldxvukgblk'
        }
    });

    // Tạo mã xác nhận 6 số
    static generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Tạo token reset password
    static generateResetToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // Gửi email với mã xác nhận
    static async sendResetEmail(email: string, code: string, token: string): Promise<boolean> {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'zlatannam2491@gmail.com',
                to: email,
                subject: 'Đặt lại mật khẩu - StudyBlog',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; font-size: 28px;">StudyBlog</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Đặt lại mật khẩu</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #333; margin-bottom: 20px;">Xin chào!</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại StudyBlog.
                            </p>
                            
                            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
                                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Mã xác nhận của bạn:</h3>
                                <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; border-radius: 8px; display: inline-block;">
                                    ${code}
                                </div>
                            </div>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                                <strong>Lưu ý:</strong>
                            </p>
                            <ul style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                                <li>Mã xác nhận này có hiệu lực trong 15 phút</li>
                                <li>Không chia sẻ mã này với bất kỳ ai</li>
                                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                            </ul>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}" 
                                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                                    Đặt lại mật khẩu
                                </a>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                            
                            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                                Email này được gửi từ StudyBlog. Nếu có thắc mắc, vui lòng liên hệ chúng tôi.
                            </p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Reset email sent to ${email}`);
            return true;
        } catch (error) {
            console.error('❌ Error sending reset email:', error);
            return false;
        }
    }

    // Tạo yêu cầu reset password
    static async createPasswordReset(email: string): Promise<{ success: boolean; message: string; code?: string; token?: string }> {
        try {
            // Kiểm tra email có tồn tại trong database không
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return { success: false, message: 'Email không tồn tại trong hệ thống' };
            }

            // Xóa các yêu cầu reset cũ của email này
            await prisma.passwordReset.deleteMany({
                where: { email }
            });

            // Tạo mã xác nhận và token
            const code = this.generateVerificationCode();
            const token = this.generateResetToken();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

            // Lưu vào database
            await prisma.passwordReset.create({
                data: {
                    email,
                    token,
                    code,
                    expiresAt
                }
            });

            console.log(`✅ Password reset created for ${email}, code: ${code}, token: ${token}`);

            // Gửi email
            const emailSent = await this.sendResetEmail(email, code, token);
            if (!emailSent) {
                return { success: false, message: 'Không thể gửi email. Vui lòng thử lại sau.' };
            }

            return {
                success: true,
                message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
                code: code, // Trả về code để test
                token: token
            };
        } catch (error) {
            console.error('❌ Error creating password reset:', error);
            return { success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' };
        }
    }

    // Xác thực mã và token
    static async verifyResetCode(token: string, code: string): Promise<{ success: boolean; message: string; email?: string }> {
        try {
            console.log('🔍 Verifying reset code:', { token: token.substring(0, 10) + '...', code });

            // Tìm yêu cầu reset trong database
            const resetRequest = await prisma.passwordReset.findFirst({
                where: {
                    token,
                    code,
                    used: false,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });

            console.log('🔍 Reset request found:', resetRequest ? 'Yes' : 'No');

            if (!resetRequest) {
                console.log('❌ No valid reset request found');
                return { success: false, message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' };
            }

            console.log('✅ Reset request is valid');
            return {
                success: true,
                message: 'Mã xác nhận hợp lệ',
                email: resetRequest.email
            };
        } catch (error) {
            console.error('❌ Error verifying reset code:', error);
            return { success: false, message: 'Có lỗi xảy ra khi xác thực mã' };
        }
    }

    // Đặt lại mật khẩu
    static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        try {
            // Tìm yêu cầu reset trong database
            const resetRequest = await prisma.passwordReset.findFirst({
                where: {
                    token,
                    used: false,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });

            if (!resetRequest) {
                return { success: false, message: 'Token không hợp lệ hoặc đã hết hạn' };
            }

            // Tìm user
            const user = await prisma.user.findUnique({
                where: { email: resetRequest.email }
            });

            if (!user) {
                return { success: false, message: 'Người dùng không tồn tại' };
            }

            // Hash mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Cập nhật mật khẩu user
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });

            // Đánh dấu token đã sử dụng
            await prisma.passwordReset.update({
                where: { id: resetRequest.id },
                data: { used: true }
            });

            console.log(`✅ Password reset successfully for ${resetRequest.email}`);

            return { success: true, message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.' };
        } catch (error) {
            console.error('❌ Error resetting password:', error);
            return { success: false, message: 'Có lỗi xảy ra khi đặt lại mật khẩu' };
        }
    }

    // Xóa các yêu cầu reset hết hạn
    static async cleanupExpiredResets(): Promise<void> {
        try {
            const result = await prisma.passwordReset.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { used: true }
                    ]
                }
            });
            console.log(`🧹 Cleaned up ${result.count} expired password reset requests`);
        } catch (error) {
            console.error('❌ Error cleaning up expired resets:', error);
        }
    }
}
