export enum AppMode {
  CONVERSATION = 'CONVERSATION',
  POSTS = 'POSTS',
  ROADMAP = 'ROADMAP'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  sources?: Array<{
    content: string;
    metadata: {
      url?: string;
      author?: string;
      time?: string;
      [key: string]: any;
    };
    similarity_score: number;
  }>;
}

export interface MediaItem {
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  ocr_text?: string;
  description?: string;
}

export interface FacebookPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string; // raw_text
  summary?: string;
  sentiment?: string;
  topics?: string[];
  category?: string;
  timestamp: string;
  url?: string;

  likes: number;
  comments: number;
  shares: number;

  // Flexible key-value for reactions
  reactions?: Record<string, number>;

  // New Media Structure
  media?: MediaItem[];

  // Legacy fields (optional, for backward compatibility if needed)
  imageUrl?: string;
  ocrText?: string;
}

export interface User {
  name: string;
  avatar: string;
}