import { prisma } from '../config/database.js';
import type { ChatMessage } from '../types/chat.types.js';

export class ChatService {
    static async saveChatMessageToDatabase(roomId: string, userId: number, message: string, isAdmin: boolean) {
        try {
            await prisma.chatMessage.create({
                data: {
                    roomId,
                    userId,
                    message,
                    isAdmin
                }
            });
            console.log('✅ Chat message saved to database:', { roomId, userId, message, isAdmin });
        } catch (error) {
            console.error('❌ Error saving chat message to database:', error);
        }
    }

    static async loadChatMessagesFromDatabase(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
        try {
            const dbMessages = await prisma.chatMessage.findMany({
                where: { roomId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });

            // Convert to ChatMessage format
            const messages: ChatMessage[] = dbMessages.reverse().map(msg => ({
                id: `db-${msg.id}`,
                userId: msg.userId || undefined,
                userName: msg.user?.name,
                userAvatar: msg.user?.avatar || undefined,
                message: msg.message,
                timestamp: msg.createdAt,
                isAdmin: msg.isAdmin
            }));

            console.log(`✅ Loaded ${messages.length} messages from database for room: ${roomId}`);
            return messages;
        } catch (error) {
            console.error('❌ Error loading chat messages from database:', error);
            return [];
        }
    }

    static async getUsersWithMessages() {
        try {
            const usersWithMessages = await prisma.chatMessage.findMany({
                select: {
                    userId: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true
                        }
                    }
                },
                distinct: ['userId'],
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return usersWithMessages.map(msg => ({
                userId: msg.userId,
                userName: msg.user?.name,
                userAvatar: msg.user?.avatar
            }));
        } catch (error) {
            console.error('Error getting users with messages:', error);
            return [];
        }
    }
}
