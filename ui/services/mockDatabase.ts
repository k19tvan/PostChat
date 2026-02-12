import { FacebookPost } from '../types';

const MOCK_POSTS: FacebookPost[] = [
  {
    id: '1',
    authorName: 'Sarah Jenkins',
    authorAvatar: 'https://picsum.photos/seed/sarah/50/50',
    content: 'Just launched our new product line! incredibly excited to share this with the world. The team has worked so hard over the last 6 months. #startup #launch',
    timestamp: '2 hours ago',
    likes: 124,
    comments: 45,
    shares: 12,
    imageUrl: 'https://picsum.photos/seed/product/600/300'
  },
  {
    id: '2',
    authorName: 'David Chen',
    authorAvatar: 'https://picsum.photos/seed/david/50/50',
    content: 'Does anyone have recommendations for good hiking trails in the Pacific Northwest? Looking for something intermediate level with good views.',
    timestamp: '5 hours ago',
    likes: 89,
    comments: 23,
    shares: 2
  },
  {
    id: '3',
    authorName: 'Tech Daily',
    authorAvatar: 'https://picsum.photos/seed/tech/50/50',
    content: 'Breaking: New AI models are reshaping how we interact with data. Read the full report on our blog. The implications for privacy and productivity are massive.',
    timestamp: '1 day ago',
    likes: 1205,
    comments: 340,
    shares: 890,
    imageUrl: 'https://picsum.photos/seed/ai/600/300'
  },
  {
    id: '4',
    authorName: 'Emily Rose',
    authorAvatar: 'https://picsum.photos/seed/emily/50/50',
    content: 'Coffee is the only thing keeping me going today. ☕😴 Happy Monday everyone!',
    timestamp: '1 day ago',
    likes: 45,
    comments: 12,
    shares: 0
  }
];

export const fetchPosts = async (): Promise<FacebookPost[]> => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_POSTS);
    }, 800);
  });
};