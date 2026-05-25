import client from './client';
import type { CommunityPost, PostComment } from '../types/community';

export async function getPosts(
  type: 'all' | 'cleaning_cert' | 'info_share' = 'all',
  cursor?: string
): Promise<{ posts: CommunityPost[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ type });
  if (cursor) params.append('cursor', cursor);
  const { data } = await client.get<{ posts: CommunityPost[]; nextCursor: string | null }>(
    `/community/posts?${params.toString()}`
  );
  return data;
}

export async function getPost(postId: string): Promise<CommunityPost> {
  const { data } = await client.get<CommunityPost>(`/community/posts/${postId}`);
  return data;
}

export async function createPost(
  type: 'cleaning_cert' | 'info_share',
  title: string,
  content: string,
  tags?: string[],
  imageBase64?: string
): Promise<CommunityPost> {
  const { data } = await client.post<CommunityPost>('/community/posts', { type, title, content, tags, imageBase64 });
  return data;
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likes: number }> {
  const { data } = await client.post<{ liked: boolean; likes: number }>(
    `/community/posts/${postId}/like`
  );
  return data;
}

export async function getComments(postId: string): Promise<{ comments: PostComment[] }> {
  const { data } = await client.get<{ comments: PostComment[] }>(
    `/community/posts/${postId}/comments`
  );
  return data;
}

export async function createComment(
  postId: string,
  content: string
): Promise<PostComment> {
  const { data } = await client.post<PostComment>(
    `/community/posts/${postId}/comments`,
    { content }
  );
  return data;
}

export async function updatePost(
  postId: string,
  type: 'cleaning_cert' | 'info_share',
  title: string,
  content: string,
  imageBase64?: string,
  removeImage?: boolean
): Promise<CommunityPost> {
  const { data } = await client.put<CommunityPost>(`/community/posts/${postId}`, { type, title, content, imageBase64, removeImage });
  return data;
}

export async function deletePost(postId: string): Promise<void> {
  await client.delete(`/community/posts/${postId}`);
}

export async function deleteComment(commentId: string): Promise<void> {
  await client.delete(`/community/comments/${commentId}`);
}
