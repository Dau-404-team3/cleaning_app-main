export interface CommunityPost {
  id: string;
  uid: string;
  type: 'cleaning_cert' | 'info_share';
  title: string;
  content: string;
  imageUrl: string | null;
  imageUrls: string[];
  tags: string[];
  likes: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  uid: string;
  content: string;
  createdAt: string;
}
