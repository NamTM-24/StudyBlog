export interface ChatMessage {
    id: string;
    userId?: number;
    userName?: string;
    userAvatar?: string;
    message: string;
    timestamp: Date;
    isAdmin: boolean;
    isSystem?: boolean;
}

export interface ChatUser {
    id: string;
    userId?: number;
    userName?: string;
    userAvatar?: string;
    isAdmin: boolean;
    socketId: string;
}
