import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { savePushToken } from '../api/notification';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  console.log('[알림] 권한 요청 결과:', status);
  return status === 'granted';
}

export async function registerPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    console.log('[알림] Push 토큰 등록:', token);
    await savePushToken(token);
  } catch (err) {
    console.warn('[알림] push token 등록 실패:', err);
  }
}

export async function scheduleCleaningReminder(timeStr: string): Promise<void> {
  // 웹은 로컬 알림 API 미지원 — 백엔드 cron 발송에 위임
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr ?? '0', 10);
  if (isNaN(hour)) {
    console.warn('[알림] 잘못된 시간 형식:', timeStr);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: { title: '오늘의 청소', body: '오늘 청소 루틴을 확인해보세요!' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  console.log('[알림] 로컬 알림 예약 완료:', { hour, minute, timeStr });
}
