export enum AppMode {
  CONVERSATION = 'CONVERSATION',
  POSTS = 'POSTS'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface FacebookPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  imageUrl?: string;
  ocrText?: string;
  url?: string;

  // Reactions
  reactions?: {
    haha: number;
    love: number;
    care: number;
    wow: number;
    sad: number;
    angry: number;
  };

  sentiment?: string; // Filled by AI
}

export interface User {
  name: string;
  avatar: string;
}