import client from './client';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export async function savePushToken(token: string): Promise<void> {
  await client.post('/notification/token', { token });
}

export async function saveNotificationPreference(enabled: boolean, time: string): Promise<void> {
  await client.post('/notification/preference', { enabled, time });
}

export async function getNotificationPreference(): Promise<{ enabled: boolean; time: string } | null> {
  const { data } = await client.get<{ enabled: boolean; time: string } | null>('/notification/preference');
  return data;
}

export async function testNotification(): Promise<void> {
  await client.post('/notification/test');
}

export async function testRoutineRefreshNotification(): Promise<{ success: boolean; spaceCount?: number; changeBody?: string }> {
  const { data } = await client.post<{ success: boolean; spaceCount?: number; changeBody?: string }>('/notification/test/routine-refresh');
  return data;
}

export async function testScheduledNotification(): Promise<{ success: boolean; count?: number; message?: string }> {
  const { data } = await client.post<{ success: boolean; count?: number; message?: string }>('/notification/test/scheduled');
  return data;
}

export async function getNotificationInbox(): Promise<NotificationItem[]> {
  const { data } = await client.get<{ notifications: NotificationItem[] }>('/notification/inbox');
  return data.notifications;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await client.post('/notification/inbox/read', { ids });
}
