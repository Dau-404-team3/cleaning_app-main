import client from './client';
import type {
  WeeklyStatsResponse,
  TodayRoutineResponse,
  RoutineByFrequencyResponse,
  RefreshRoutineResponse,
  EditRoutinePayload,
  NewTask,
  CalendarData,
  TaskGuide,
} from '../types/routine';

export type { NewTask };

export async function getWeeklyStats(): Promise<WeeklyStatsResponse> {
  const { data } = await client.get<WeeklyStatsResponse>('/routine/weekly-stats');
  return data;
}

export async function getAiComment(): Promise<{ message: string }> {
  const { data } = await client.get<{ message: string }>('/routine/ai-comment');
  return data;
}

export async function getTodayRoutine(): Promise<TodayRoutineResponse> {
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const clientDay = DAYS[new Date().getDay()];
  const { data } = await client.get<TodayRoutineResponse>(`/routine/today?day=${clientDay}`);
  return data;
}

export async function uncompleteTask(taskId: string, space: string, taskName: string): Promise<void> {
  await client.post('/routine/checklist/uncomplete', { taskId, space, taskName });
}

export async function completeTask(taskId: string, space: string, taskName: string): Promise<void> {
  await client.post('/routine/checklist/complete', { taskId, space, taskName });
}

export async function skipTask(
  taskId: string,
  space: string,
  frequency: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<{ routineRefreshSuggested: boolean }> {
  const { data } = await client.post<{ routineRefreshSuggested: boolean }>(
    '/routine/checklist/skip',
    { taskId, space, frequency }
  );
  return data;
}

export async function getRoutineByFrequency(
  type: 'daily' | 'weekly' | 'monthly'
): Promise<RoutineByFrequencyResponse> {
  const { data } = await client.get<RoutineByFrequencyResponse>(
    `/routine/by-frequency?type=${type}`
  );
  return data;
}

export async function refreshRoutine(): Promise<RefreshRoutineResponse> {
  const { data } = await client.post<RefreshRoutineResponse>('/routine/refresh');
  return data;
}

export async function editRoutine(payload: EditRoutinePayload): Promise<void> {
  await client.post('/routine/edit', payload);
}

export async function deleteTask(taskId: string): Promise<void> {
  await client.post('/routine/edit', {
    addedTasks: [],
    removedTasks: [{ id: taskId }],
    totalMinutesBefore: 0,
    totalMinutesAfter: 0,
  });
}

export async function resetRoutine(): Promise<void> {
  await client.post('/routine/reset');
}

export async function getCalendar(month: string): Promise<CalendarData> {
  const { data } = await client.get<CalendarData>(`/routine/calendar?month=${month}`);
  return data;
}

export async function getTaskGuide(taskName: string, space?: string): Promise<TaskGuide> {
  const params = new URLSearchParams({ taskName });
  if (space) params.append('space', space);
  const { data } = await client.get<TaskGuide>(`/guide/task?${params.toString()}`);
  return data;
}

export type GeneratedRoutine = {
  basis: string;
  id: string;
  minutes: number;
  title: string;
};

export async function getActiveTaskIds(): Promise<string[]> {
  const { data } = await client.get<{ ids: string[] }>('/routine/task-ids');
  return data.ids ?? [];
}

export async function getCatalogueCounts(): Promise<Record<string, number>> {
  const { data } = await client.get<{ counts: Record<string, number> }>('/routine/catalogue/counts');
  return data.counts ?? {};
}

export type CatalogueRoutine = {
  id: string;
  minutes: number;
  tip: string;
  title: string;
};

export async function getSpaceRecommendations(spaceKey: string): Promise<{
  generated: GeneratedRoutine[];
  ids: string[];
  routines: CatalogueRoutine[];
}> {
  const { data } = await client.get<{
    generated: GeneratedRoutine[];
    ids: string[];
    routines: CatalogueRoutine[];
  }>(`/routine/recommendations/${spaceKey}`);
  return { ids: data.ids ?? [], generated: data.generated ?? [], routines: data.routines ?? [] };
}

export async function refreshRecommendations(spaceKey?: string): Promise<{
  spaceCount: number;
  changeBody: string;
  spaceChanges: Record<string, string>;
}> {
  const { data } = await client.post<{
    spaceCount: number;
    changeBody: string;
    spaceChanges: Record<string, string>;
  }>('/routine/recommendations/refresh', spaceKey ? { spaceKey } : {});
  return data;
}
