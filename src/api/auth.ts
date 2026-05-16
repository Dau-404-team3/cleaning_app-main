import client from './client';
import { LoginResponse, RefreshResponse, SignupResponse } from '../types/auth';

export async function signup(email: string, password: string, displayName: string): Promise<SignupResponse> {
  const { data } = await client.post<SignupResponse>('/auth/signup', { email, password, displayName });
  return data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const { data } = await client.post<RefreshResponse>('/auth/refresh', { refreshToken });
  return data;
}

export async function getMe(): Promise<{ uid: string; email: string; isOnboarded: boolean }> {
  const response = await client.get('/profile');
  const profileData = response.data.data || response.data;
  return profileData;
}

export async function withdraw(): Promise<void> {
  await client.delete('/auth/withdraw');
}
