# StudyBlog - Hệ Thống Blog Học Tập Tích Hợp Chat Real-time

## 📋 Tổng Quan

**StudyBlog** là một nền tảng blog học tập hiện đại được xây dựng bằng **Node.js**, **Express**, **TypeScript**, **Prisma ORM** và **MySQL**. Trang web tích hợp nhiều tính năng tiên tiến bao gồm hệ thống chat real-time, quản lý bài viết, bình luận đa tầng, và giao diện admin chuyên nghiệp.

## 🚀 Công Nghệ Sử Dụng

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Ngôn ngữ lập trình type-safe
- **Prisma ORM** - Database ORM hiện đại
- **MySQL** - Hệ quản trị cơ sở dữ liệu
- **Socket.IO** - Real-time communication
- **JWT** - Xác thực và phân quyền
- **bcrypt** - Mã hóa mật khẩu
- **Nodemailer** - Gửi email
- **Multer** - Upload file

### Frontend

- **EJS** - Template engine
- **Tailwind CSS** - CSS framework
- **Vanilla JavaScript** - Client-side logic
- **Socket.IO Client** - Real-time chat

### Database

- **MySQL** với Prisma ORM
- **Migrations** tự động
- **Relationships** phức tạp

## 🏗️ Kiến Trúc Hệ Thống

### Cấu Trúc Thư Mục

```
PrismaLearn/
├── config/                 # Cấu hình database, multer
├── middleware/            # Middleware xác thực, phân quyền
├── routes/               # Định tuyến API
├── services/             # Business logic
├── utils/                # Tiện ích helper
├── types/                # TypeScript type definitions
├── views/                # EJS templates
├── public/               # Static files (CSS, JS, images)
├── prisma/               # Database schema & migrations
├── chat-realtime/        # Socket.IO chat handlers
└── scripts/              # Utility scripts
```

## 🔐 Hệ Thống Xác Thực & Phân Quyền

### Chức Năng Đăng Ký/Đăng Nhập

- **Đăng ký tài khoản** với validation đầy đủ
- **Đăng nhập** với JWT token
- **Quên mật khẩu** với email verification
- **Reset mật khẩu** qua mã xác nhận 6 số
- **Refresh token** tự động

### Phân Quyền Người Dùng

- **USER**: Đọc bài viết, tạo/sửa bình luận, sử dụng chat
- **ADMIN**: Quản lý toàn bộ hệ thống, xóa bình luận, chat với users

## 📝 Hệ Thống Quản Lý Bài Viết

### Tính Năng Bài Viết

- **Tạo bài viết mới** với rich text editor
- **Upload ảnh** cho bài viết
- **Quản lý trạng thái** (ACTIVE/INACTIVE)
- **Soft delete** và **Hard delete**
- **SEO-friendly URLs** với slug tự động
- **Meta data** đầy đủ (excerpt, author, publishedAt)

### Giao Diện Admin

- **Dashboard** quản lý bài viết
- **CRUD operations** đầy đủ
- **Bulk operations** (xóa nhiều bài viết)
- **Image upload** tích hợp
- **Real-time notifications**

## 💬 Hệ Thống Bình Luận Đa Tầng

### Tính Năng Bình Luận

- **Bình luận đa tầng** (nested comments)
- **Reply system** linh hoạt
- **Edit/Delete** bình luận
- **Permission-based** actions
- **Real-time updates** không reload trang
- **Optimistic UI** cho trải nghiệm mượt mà

### Quản Lý Bình Luận

- **User**: Chỉ sửa/xóa bình luận của mình
- **Admin**: Có thể xóa bất kỳ bình luận nào
- **Soft delete** với tracking người xóa
- **Edit history** tracking

## 💬 Hệ Thống Chat Real-time

### Chat Widget

- **Floating chat widget** cho users
- **Real-time messaging** với Socket.IO
- **Typing indicators**
- **Message history** persistence
- **Auto-scroll** và responsive design

### Admin Chat Interface

- **Dedicated admin chat panel**
- **Multi-user chat management**
- **User online/offline status**
- **Message notifications**
- **Chat history** cho từng user

### Tính Năng Chat

- **Private chat rooms** cho từng user
- **Admin can join** bất kỳ user room nào
- **System messages** tự động
- **Message persistence** trong database
- **Real-time notifications**

## 🎨 Giao Diện Người Dùng

### Trang Chủ

- **Hero section** với background image
- **Featured article** layout
- **Related posts** carousel
- **Social sharing** buttons
- **Responsive design** mobile-first

### Trang Bài Viết

- **Rich content** rendering
- **Author information**
- **Reading time** estimation
- **Social sharing**
- **Comment section** tích hợp

### Dark Mode Support

- **Tailwind CSS** dark mode
- **Automatic theme switching**
- **Consistent styling** across components

## 🔧 Tính Năng Kỹ Thuật

### Database Design

```sql
-- Users table với role-based access
-- Posts table với soft delete
-- Comments table với nested structure
-- ChatMessages table cho real-time chat
-- PasswordReset table cho forgot password
```

### API Endpoints

- **RESTful APIs** cho posts, comments, users
- **WebSocket events** cho real-time chat
- **File upload** endpoints
- **Authentication** middleware

### Security Features

- **JWT token** authentication
- **Password hashing** với bcrypt
- **CSRF protection**
- **Input validation**
- **SQL injection** prevention với Prisma
- **XSS protection**

## 🚀 Triển Khai & Chạy Dự Án

### Yêu Cầu Hệ Thống

- Node.js 18+
- MySQL 8.0+
- npm hoặc yarn

### Cài Đặt

```bash
# Clone repository
git clone <repository-url>
cd PrismaLearn

# Cài đặt dependencies
npm install

# Cấu hình environment
cp .env.example .env
# Chỉnh sửa DATABASE_URL trong .env

# Setup database
npx prisma migrate dev
npx prisma generate

# Chạy development server
npm start

# Chạy Tailwind CSS watcher (terminal khác)
npm run watch
```

### Environment Variables

```env
DATABASE_URL="mysql://user:password@localhost:3306/studyblog"
JWT_SECRET="your-jwt-secret"
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

## 📊 Tính Năng Nâng Cao

### Real-time Features

- **Live chat** giữa users và admin
- **Typing indicators**
- **Online/offline status**
- **Push notifications**

### User Experience

- **Progressive Web App** features
- **Responsive design** cho mọi thiết bị
- **Fast loading** với optimized assets
- **Accessibility** compliance

### Performance

- **Database indexing** cho queries nhanh
- **Image optimization** với Multer
- **Caching strategies**
- **Lazy loading** cho comments

## 🔄 Workflow Hệ Thống

### User Journey

1. **Đăng ký/Đăng nhập** → JWT token
2. **Đọc bài viết** → Rich content
3. **Bình luận** → Nested comments
4. **Chat với admin** → Real-time support
5. **Quản lý profile** → Avatar upload

### Admin Workflow

1. **Dashboard** → Quản lý bài viết
2. **Tạo bài viết** → Rich editor
3. **Quản lý comments** → Moderate content
4. **Chat support** → Real-time assistance
5. **User management** → Role-based access

## 🛠️ Development Features

### Code Quality

- **TypeScript** cho type safety
- **ESLint** cho code consistency
- **Modular architecture** với services
- **Error handling** comprehensive

### Testing

- **API testing** với Postman/Insomnia
- **Database testing** với Prisma Studio
- **Real-time testing** với Socket.IO

### Deployment

- **Environment configuration**
- **Database migrations**
- **Static file serving**
- **Process management**

## 📈 Tính Năng Tương Lai

### Planned Features

- **Email notifications** cho comments
- **Rich text editor** nâng cao
- **File upload** cho comments
- **Analytics dashboard**
- **SEO optimization**
- **Mobile app** với React Native

### Scalability

- **Redis caching**
- **CDN integration**
- **Load balancing**
- **Microservices architecture**

## 🤝 Đóng Góp

Dự án này được phát triển như một phần của chương trình thực tập Weaverse Internship, thể hiện các kỹ năng full-stack development với focus vào:

- **Modern JavaScript/TypeScript**
- **Real-time applications**
- **Database design**
- **User experience**
- **Security best practices**

## 📞 Liên Hệ

- **Developer**: NamHT
- **Project**: StudyBlog - Weaverse Internship

---

_StudyBlog - Nơi chia sẻ kiến thức và kết nối cộng đồng học tập_
