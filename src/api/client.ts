import axios from 'axios';
import { getIdToken, getRefreshToken, saveTokens } from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// 인터셉터에서 로그아웃을 트리거하기 위한 콜백
// circular import 방지용 — _layout.tsx에서 registerLogout()으로 등록
let _logoutCallback: (() => void) | null = null;
export function registerLogout(fn: () => void) {
  _logoutCallback = fn;
}

client.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const isTokenExpired =
      error.response?.status === 401 &&
      (error.response?.data?.code === 'TOKEN_EXPIRED' ||
        error.response?.data?.code === 'TOKEN_MISSING');

    if (isTokenExpired && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const currentToken = await getIdToken();

        // 요청 사이에 토큰이 갱신된 경우 바로 재시도
        if (currentToken && originalRequest.headers.Authorization !== `Bearer ${currentToken}`) {
          originalRequest.headers.Authorization = `Bearer ${currentToken}`;
          return client(originalRequest);
        }

        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('no refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await saveTokens(data.idToken, data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.idToken}`;
        return client(originalRequest);
      } catch {
        // 리프레시도 실패 → 토큰 완전 만료 or 서버 오류
        // 로그인 화면으로 강제 이동
        _logoutCallback?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
