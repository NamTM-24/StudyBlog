import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/chat.service.js';
import { chatUsers, chatMessages, adminSockets } from './chat-models.js';
import type { ChatMessage, ChatUser } from '../types/chat.types.js';
import type { JwtPayload } from '../types/auth.types.js';
import { jwtSecret } from '../utils/jwt.utils.js';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

export function setupChatHandlers(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        // Xử lý user join chat
        socket.on('join-chat', async (data: { token?: string }) => {
            try {
                let user: any = null;
                let isAdmin = false;

                if (data.token) {
                    try {
                        const decoded = jwt.verify(data.token, jwtSecret) as JwtPayload;
                        user = await prisma.user.findUnique({
                            where: { id: decoded.id },
                            select: { id: true, name: true, email: true, avatar: true, role: true }
                        });
                        isAdmin = user?.role === 'ADMIN';
                    } catch (error) {
                        console.log('Token verification failed for chat:', error);
                    }
                }

                const chatUser: ChatUser = {
                    id: socket.id,
                    userId: user?.id,
                    userName: user?.name || 'Khách',
                    userAvatar: user?.avatar,
                    isAdmin,
                    socketId: socket.id
                };

                chatUsers.set(socket.id, chatUser);

                // Tạo chat room riêng cho user
                const chatRoomId = isAdmin ? 'admin' : `user-${chatUser.userId || socket.id}`;
                console.log('Chat room created:', chatRoomId, 'for user:', chatUser.userName, 'isAdmin:', isAdmin);

                // Khởi tạo chat messages cho user nếu chưa có
                if (!chatMessages.has(chatRoomId)) {
                    chatMessages.set(chatRoomId, []);
                    console.log('New chat room initialized:', chatRoomId);
                }

                // Join vào room riêng
                socket.join(chatRoomId);

                // Lưu admin socket và join vào tất cả user rooms
                if (isAdmin) {
                    adminSockets.add(socket.id);
                    console.log('=== ADMIN JOIN DEBUG ===');
                    console.log('Admin joined, socket ID:', socket.id);
                    console.log('Total admin sockets:', adminSockets.size);
                    console.log('Admin sockets:', Array.from(adminSockets));

                    // Admin join vào room admin để nhận thông báo
                    socket.join('admin');
                    console.log('Admin joined room "admin"');
                    console.log('=== END ADMIN JOIN DEBUG ===');
                }

                // Gửi thông báo chào mừng chỉ khi user không phải admin và chưa có tin nhắn chào mừng
                if (!isAdmin) {
                    const userMessages = chatMessages.get(chatRoomId) || [];
                    const hasWelcomeMessage = userMessages.some(msg => msg.isSystem && msg.isAdmin);

                    if (!hasWelcomeMessage) {
                        const welcomeMessage: ChatMessage = {
                            id: `welcome-${Date.now()}`,
                            message: `Xin chào ${chatUser.userName}! Tôi có thể giúp bạn như thế nào?`,
                            timestamp: new Date(),
                            isAdmin: true,
                            isSystem: true
                        };

                        // Thêm tin nhắn chào mừng vào chat room
                        userMessages.push(welcomeMessage);
                        chatMessages.set(chatRoomId, userMessages);

                        socket.emit('chat-message', welcomeMessage);
                    }
                }

                // Load tin nhắn từ database và gửi lịch sử chat
                const dbMessages = await ChatService.loadChatMessagesFromDatabase(chatRoomId, 50);
                const userMessages = chatMessages.get(chatRoomId) || [];

                // Merge database messages với memory messages
                const allMessages = [...dbMessages, ...userMessages];
                chatMessages.set(chatRoomId, allMessages);

                socket.emit('chat-history', {
                    chatRoomId: chatRoomId,
                    messages: allMessages.slice(-50)
                }); // Gửi 50 tin nhắn gần nhất

                // Thông báo user online cho admin
                if (!isAdmin) {
                    // Gửi thông báo cho tất cả admin online
                    adminSockets.forEach(adminSocketId => {
                        io.to(adminSocketId).emit('user-online', {
                            userId: chatUser.userId,
                            userName: chatUser.userName,
                            userAvatar: chatUser.userAvatar,
                            chatRoomId: chatRoomId
                        });
                    });
                }
            } catch (error) {
                console.error('Error joining chat:', error);
            }
        });

        // Xử lý tin nhắn chat
        socket.on('send-message', async (data: { message: string, token?: string, targetUserId?: string }) => {
            try {
                const chatUser = chatUsers.get(socket.id);
                if (!chatUser) return;

                let chatRoomId: string;

                if (chatUser.isAdmin) {
                    // Nếu admin gửi tin nhắn, cần targetUserId
                    console.log('Admin sending message, data:', data);
                    console.log('Admin user:', chatUser);

                    if (!data.targetUserId) {
                        console.error('Admin message missing targetUserId');
                        console.error('Data received:', data);
                        return;
                    }
                    chatRoomId = `user-${data.targetUserId}`;
                    console.log('Admin target room:', chatRoomId);

                    // Admin join vào room của user để có thể gửi tin nhắn
                    socket.join(chatRoomId);
                    console.log('Admin joined room:', chatRoomId);

                    // Đảm bảo room tồn tại
                    if (!chatMessages.has(chatRoomId)) {
                        chatMessages.set(chatRoomId, []);
                    }
                } else {
                    // Nếu user gửi tin nhắn, tạo room cho user đó
                    chatRoomId = `user-${chatUser.userId || socket.id}`;
                }

                const newMessage: ChatMessage = {
                    id: `msg-${Date.now()}-${Math.random()}`,
                    userId: chatUser.userId,
                    userName: chatUser.userName,
                    userAvatar: chatUser.userAvatar,
                    message: data.message.trim(),
                    timestamp: new Date(),
                    isAdmin: chatUser.isAdmin
                };

                // Lưu tin nhắn vào database
                if (chatUser.userId) {
                    console.log('💾 Saving message to database:', {
                        roomId: chatRoomId,
                        userId: chatUser.userId,
                        message: newMessage.message,
                        isAdmin: newMessage.isAdmin
                    });
                    await ChatService.saveChatMessageToDatabase(chatRoomId, chatUser.userId, newMessage.message, newMessage.isAdmin);
                } else {
                    console.log('⚠️ Cannot save message to database: no userId');
                }

                // Thêm tin nhắn vào chat room của user (memory cache)
                const userMessages = chatMessages.get(chatRoomId) || [];
                userMessages.push(newMessage);
                chatMessages.set(chatRoomId, userMessages);

                // Gửi tin nhắn đến room riêng - Gửi cho tất cả trong room đó (bao gồm cả sender)
                io.to(chatRoomId).emit('chat-message', newMessage);
                console.log('Message sent to room:', chatRoomId);
                console.log('Message content:', newMessage);
                console.log('Room members:', Array.from(io.sockets.adapter.rooms.get(chatRoomId) || []));

                // Nếu là tin nhắn từ admin, đảm bảo user nhận được
                if (chatUser.isAdmin) {
                    console.log('Admin message sent, ensuring user receives it');
                }

                // Nếu là tin nhắn từ user (không phải admin), gửi thông báo cho admin
                if (!chatUser.isAdmin) {
                    console.log('=== USER MESSAGE DEBUG ===');
                    console.log('User message sent to room:', chatRoomId);
                    console.log('Admin sockets count:', adminSockets.size);

                    // Chỉ gửi thông báo đến room admin, không gửi chat-message
                    // Admin sẽ nhận chat-message khi join vào room của user
                    io.to('admin').emit('new-user-message', {
                        userId: chatUser.userId,
                        userName: chatUser.userName,
                        userAvatar: chatUser.userAvatar,
                        message: data.message,
                        chatRoomId: chatRoomId
                    });

                    console.log('=== END USER MESSAGE DEBUG ===');
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        // Xử lý admin join vào room của user
        socket.on('join-user-room', (data: { chatRoomId: string }) => {
            const chatUser = chatUsers.get(socket.id);
            if (chatUser && chatUser.isAdmin) {
                socket.join(data.chatRoomId);
                console.log('Admin joined user room:', data.chatRoomId);
            }
        });

        // Xử lý request chat history
        socket.on('request-chat-history', async (data: { chatRoomId?: string, token?: string }) => {
            const chatUser = chatUsers.get(socket.id);
            if (!chatUser) {
                console.log('No chat user found for socket:', socket.id);
                return;
            }

            if (chatUser.isAdmin && data.chatRoomId) {
                // Admin requesting specific room history
                console.log('Admin requesting chat history for room:', data.chatRoomId);

                // Load tin nhắn từ database
                const dbMessages = await ChatService.loadChatMessagesFromDatabase(data.chatRoomId, 50);
                const userMessages = chatMessages.get(data.chatRoomId) || [];

                // Merge database messages với memory messages
                const allMessages = [...dbMessages, ...userMessages];
                chatMessages.set(data.chatRoomId, allMessages);

                socket.emit('chat-history', {
                    chatRoomId: data.chatRoomId,
                    messages: allMessages.slice(-50)
                });

                console.log(`Sent ${allMessages.length} messages to admin for room:`, data.chatRoomId);
            } else if (!chatUser.isAdmin) {
                // User requesting their own chat history
                const userRoomId = `user-${chatUser.userId}`;
                console.log('User requesting chat history for room:', userRoomId);

                // Load tin nhắn từ database
                const dbMessages = await ChatService.loadChatMessagesFromDatabase(userRoomId, 50);
                const userMessages = chatMessages.get(userRoomId) || [];

                // Merge database messages với memory messages
                const allMessages = [...dbMessages, ...userMessages];
                chatMessages.set(userRoomId, allMessages);

                socket.emit('chat-history', {
                    chatRoomId: userRoomId,
                    messages: allMessages.slice(-50)
                });

                console.log(`Sent ${allMessages.length} messages to user for room:`, userRoomId);
            }
        });

        // Xử lý admin gửi tin nhắn trực tiếp đến user widget
        socket.on('admin-direct-message', (data: { targetUserId: string, message: string, adminName: string }) => {
            const chatUser = chatUsers.get(socket.id);
            if (chatUser && chatUser.isAdmin) {
                console.log('Admin sending direct message to user widget:', data.targetUserId);

                // Validate data
                if (!data.targetUserId || !data.message || !data.adminName) {
                    console.error('Invalid admin-direct-message data:', data);
                    return;
                }

                // Tìm user socket và gửi tin nhắn đến widget
                let userFound = false;
                for (const [socketId, user] of chatUsers.entries()) {
                    if (user.userId?.toString() === data.targetUserId && !user.isAdmin) {
                        console.log('Sending admin message to user widget:', socketId);
                        io.to(socketId).emit('admin-message', {
                            message: data.message,
                            adminName: data.adminName,
                            timestamp: new Date()
                        });
                        userFound = true;
                        break;
                    }
                }

                if (!userFound) {
                    console.log('Target user not found or not online:', data.targetUserId);
                }
            }
        });

        // Xử lý typing indicator
        socket.on('typing', (data: { isTyping: boolean }) => {
            const chatUser = chatUsers.get(socket.id);
            if (chatUser) {
                let chatRoomId: string;

                if (chatUser.isAdmin) {
                    // Admin typing - cần gửi đến room của user hiện tại
                    // Điều này sẽ được xử lý ở client side
                    return;
                } else {
                    chatRoomId = `user-${chatUser.userId || socket.id}`;
                }

                socket.to(chatRoomId).emit('user-typing', {
                    userId: chatUser.userId,
                    userName: chatUser.userName,
                    isTyping: data.isTyping
                });
            }
        });

        // Xử lý request users with messages
        socket.on('request-users-with-messages', async () => {
            const chatUser = chatUsers.get(socket.id);
            if (chatUser && chatUser.isAdmin) {
                console.log('Admin requesting users with messages');

                try {
                    const users = await ChatService.getUsersWithMessages();
                    socket.emit('users-with-messages', users);
                    console.log(`Sent ${users.length} users with messages to admin`);
                } catch (error) {
                    console.error('Error getting users with messages:', error);
                }
            }
        });

        // Test admin connection
        socket.on('test-admin-connection', (data) => {
            const chatUser = chatUsers.get(socket.id);
            if (chatUser && chatUser.isAdmin) {
                console.log('=== ADMIN CONNECTION TEST ===');
                console.log('Admin test connection received:', data);
                console.log('Admin socket ID:', socket.id);
                console.log('Admin in adminSockets:', adminSockets.has(socket.id));
                console.log('Total admin sockets:', adminSockets.size);
                console.log('Admin user data:', chatUser);
                console.log('=== END ADMIN CONNECTION TEST ===');

                // Send confirmation back to admin
                socket.emit('admin-connection-confirmed', {
                    message: 'Admin connection confirmed',
                    socketId: socket.id,
                    adminSocketsCount: adminSockets.size,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Xử lý disconnect
        socket.on('disconnect', () => {
            const chatUser = chatUsers.get(socket.id);
            if (chatUser) {
                chatUsers.delete(socket.id);

                // Xóa admin socket nếu là admin
                if (chatUser.isAdmin) {
                    adminSockets.delete(socket.id);
                }

                // Thông báo user offline cho admin
                if (!chatUser.isAdmin) {
                    // Gửi thông báo cho tất cả admin online
                    adminSockets.forEach(adminSocketId => {
                        io.to(adminSocketId).emit('user-offline', {
                            userId: chatUser.userId,
                            userName: chatUser.userName,
                            userAvatar: chatUser.userAvatar
                        });
                    });
                }
            }
            console.log('User disconnected:', socket.id);
        });
    });
}
