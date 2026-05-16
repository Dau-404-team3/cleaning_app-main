import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { registerLogout } from '../src/api/client';
import {
  configureNotificationHandler,
  requestNotificationPermission,
  registerPushToken,
  scheduleCleaningReminder,
} from '../src/utils/notifications';
import { getNotificationPreference } from '../src/api/notification';
import { updateLastActive } from '../src/utils/storage';

export default function RootLayout() {
  const { isLoggedIn, isOnboarded, isLoading, initAuth } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 인터셉터에서 리프레시 실패 시 자동 로그아웃 콜백 등록
    registerLogout(() => useAuthStore.getState().logout());

    configureNotificationHandler();
    initAuth();

    // 앱이 백그라운드 → 포그라운드로 돌아올 때 세션 만료 재검사
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // 포그라운드 전환 시 만료 여부 재확인 (initAuth가 만료면 자동 로그아웃)
        initAuth();
      }
      if (nextState === 'active' && isLoggedIn) {
        // 활성 상태일 때 lastActiveAt 갱신
        updateLastActive().catch(() => null);
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isOnboarded) return;
    (async () => {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await registerPushToken();
      const pref = await getNotificationPreference();
      if (pref?.enabled && pref?.time) {
        await scheduleCleaningReminder(pref.time);
      }
    })();
  }, [isLoggedIn, isOnboarded]);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === 'login' || segments[0] === 'signup';
    const inOnboarding = segments[0] === 'onboarding' || segments[0] === 'result';
    const inSplash = !segments[0];

    if (!isLoggedIn && !inAuth) {
      router.replace('/login');
    } else if (isLoggedIn && !isOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (isLoggedIn && isOnboarded && (inAuth || inOnboarding || inSplash)) {
      router.replace('/home');
    }
  }, [isLoggedIn, isOnboarded, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="result" />
      <Stack.Screen name="home" />
      <Stack.Screen name="community" />
      <Stack.Screen name="PostDetail" />
      <Stack.Screen name="PostCompose" />
      <Stack.Screen name="chatbot" />
      <Stack.Screen name="routine-loading" />
      <Stack.Screen name="routine-add" />
      <Stack.Screen name="routine-space" />
      <Stack.Screen name="routine-setting" />
      <Stack.Screen name="routine-detail" />
      <Stack.Screen name="routine-tip" />
      <Stack.Screen name="routine-complete" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="debug" />
    </Stack>
  );
}
