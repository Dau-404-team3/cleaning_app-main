export interface Task {
  id: string;
  space: string;
  taskName: string;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 'daily' | 'weekly' | 'monthly';
  priority: string;
  isAiRecommended: boolean;
  completed: boolean;
  skipped: boolean;
  lastCompletedAt: string | null;
  lastSkippedAt: string | null;
  dueToday: boolean;
  day?: string;
  streak?: number;
}

export interface HowToStep {
  step: number;
  description: string;
}

export interface TaskGuide {
  source: 'db' | 'ai';
  howTo: HowToStep[];
  tip: string;
  tipEmoji: string;
  estimatedMinutes: number | null;
}

export interface TodayRoutineResponse {
  date: string;
  day: string;
  activeRoutineId?: string | null;
  tasks: Task[];
  totalMinutes: number;
  completedCount: number;
  spaceStatus: Record<string, {
    score: number;
    lastCleanedAt: string | null;
    cleanCount: number;
  }>;
}

export interface WeeklyStatsResponse {
  weeklyCompletionRate: number;
  completedCount: number;
  totalCount: number;
  currentStreak: number;
  remainingToday: number;
}

export interface RoutineByFrequencyResponse {
  frequency: string;
  tasks: Task[];
  totalMinutes: number;
}

export interface RefreshRoutineResponse {
  message: string;
  routine: {
    id: string;
    weeklyRoutine: unknown[];
    generationReason: string;
  };
}

export interface NewTask {
  id: string;
  taskName: string;
  description: string;
  icon: string;
  space: string;
  estimatedMinutes: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  day?: string;
}

export interface EditRoutinePayload {
  removedTasks: { id: string }[];
  addedTasks: NewTask[];
  totalMinutesBefore: number;
  totalMinutesAfter: number;
}

export interface CalendarDayTask {
  taskName: string;
  space: string;
  completedAt: string;
}

export interface CalendarDay {
  tasks: CalendarDayTask[];
  completionRate: number;
}

export interface CalendarData {
  month: string;
  days: Record<string, CalendarDay>;
}
