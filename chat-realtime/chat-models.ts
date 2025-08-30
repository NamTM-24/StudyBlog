import type { ChatMessage, ChatUser } from '../types/chat.types.js';

// Lưu trữ thông tin chat
export const chatUsers = new Map<string, ChatUser>();
export const chatMessages = new Map<string, ChatMessage[]>(); // Private chat messages per user
export const adminSockets = new Set<string>(); // Admin socket IDs
