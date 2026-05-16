import { create } from 'zustand';
import { saveTokens, clearTokens, getIdToken, getLastActive, SESSION_TIMEOUT_MS } from '../utils/storage';
import { getMe } from '../api/auth';

interface AuthState {
  idToken: string | null;
  uid: string | null;
  email: string | null;
  isLoggedIn: boolean;
  isOnboarded: boolean;
  isLoading: boolean;

  login: (idToken: string, refreshToken: string, uid: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  setOnboarded: (value: boolean) => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  idToken: null,
  uid: null,
  email: null,
  isLoggedIn: false,
  isOnboarded: false,
  isLoading: true,

  login: async (idToken, refreshToken, uid, email) => {
    await saveTokens(idToken, refreshToken);
    try {
      const profile = await getMe();
      set({
        idToken,
        uid: profile.uid,
        email: profile.email,
        isLoggedIn: true,
        isOnboarded: profile.isOnboarded ?? false,
      });
    } catch {
      // 404 = 온보딩 전 계정, 일단 로그인 유지 후 온보딩으로 이동
      set({ idToken, uid, email, isLoggedIn: true, isOnboarded: false });
    }
  },

  logout: async () => {
    await clearTokens();
    set({ idToken: null, uid: null, email: null, isLoggedIn: false, isOnboarded: false });
  },

  setOnboarded: (value) => {
    set({ isOnboarded: value });
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getIdToken();
      if (!token) {
        set({ isLoading: false, isLoggedIn: false });
        return;
      }

      // 마지막 활동 시간 확인 — 24시간 초과 시 자동 로그아웃
      const lastActive = await getLastActive();
      if (!lastActive || Date.now() - lastActive > SESSION_TIMEOUT_MS) {
        await clearTokens();
        set({ isLoading: false, isLoggedIn: false });
        return;
      }

      // 서버 응답 확인 — 8초 이내에 응답 없으면 서버 재시작 중으로 판단해 로그아웃
      const profilePromise = getMe();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('auth_timeout')), 8000)
      );

      const profile = await Promise.race([profilePromise, timeoutPromise]);
      set({
        idToken: token,
        uid: profile.uid,
        email: profile.email,
        isLoggedIn: true,
        isOnboarded: !!profile.isOnboarded,
      });
    } catch {
      // 토큰 만료, 네트워크 오류, 타임아웃 등 모든 실패 → 로그아웃 후 로그인 화면
      await clearTokens();
      set({ isLoggedIn: false, idToken: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
