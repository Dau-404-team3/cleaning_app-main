import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); } catch { /* private browsing */ }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveTokens(idToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    setItem('idToken', idToken),
    setItem('refreshToken', refreshToken),
    setItem('lastActiveAt', Date.now().toString()),
  ]);
}

export async function updateLastActive(): Promise<void> {
  await setItem('lastActiveAt', Date.now().toString());
}

export async function getLastActive(): Promise<number | null> {
  const val = await getItem('lastActiveAt');
  return val ? parseInt(val, 10) : null;
}

export async function getIdToken(): Promise<string | null> {
  return getItem('idToken');
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem('refreshToken');
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteItem('idToken'),
    deleteItem('refreshToken'),
    deleteItem('lastActiveAt'),
    deleteItem('routine_tracker_v2'),
  ]);
}

// 마지막 활동 후 24시간 경과 시 세션 만료로 판단
export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;
