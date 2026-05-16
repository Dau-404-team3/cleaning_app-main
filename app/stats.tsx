import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeBack } from '../src/utils/useSafeBack';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutineBottomNav } from '../components/RoutineBottomNav';
import { getCalendar, getWeeklyStats } from '../src/api/routine';
import type { WeeklyStatsResponse } from '../src/types/routine';

type RoutineStatus = {
  done: boolean;
  name: string;
};

type DayMeta = {
  completionRate: number;
  routines: RoutineStatus[];
};

function dotColor(rate: number): string {
  if (rate >= 80) return '#287A40';
  if (rate >= 50) return '#C87B1A';
  return '#C85040';
}

type CalendarDay = {
  currentMonth: boolean;
  dateKey: string;
  day: number;
};

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateKey(year: number, month: number, day: number) {
  const monthText = String(month + 1).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}

function createCalendarDays(year: number, month: number): CalendarDay[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const currentMonthDays = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const offsetDay = index - firstWeekday + 1;

    if (offsetDay < 1) {
      const day = previousMonthDays + offsetDay;
      const date = new Date(year, month - 1, day);
      return {
        currentMonth: false,
        dateKey: formatDateKey(date.getFullYear(), date.getMonth(), date.getDate()),
        day,
      };
    }

    if (offsetDay > currentMonthDays) {
      const day = offsetDay - currentMonthDays;
      const date = new Date(year, month + 1, day);
      return {
        currentMonth: false,
        dateKey: formatDateKey(date.getFullYear(), date.getMonth(), date.getDate()),
        day,
      };
    }

    return {
      currentMonth: true,
      dateKey: formatDateKey(year, month, offsetDay),
      day: offsetDay,
    };
  });
}

function toMonthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export default function StatsScreen() {
  const safeBack = useSafeBack();
  const now = new Date();
  const [calendarView, setCalendarView] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  });
  const [selectedDate, setSelectedDate] = useState(
    formatDateKey(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const [stats, setStats] = useState<WeeklyStatsResponse | null>(null);
  const [routinesByDate, setRoutinesByDate] = useState<Record<string, DayMeta>>({});

  const loadCalendar = useCallback(async (year: number, month: number) => {
    try {
      const data = await getCalendar(toMonthParam(year, month));
      const mapped: Record<string, DayMeta> = {};
      for (const [date, dayData] of Object.entries(data.days)) {
        mapped[date] = {
          completionRate: dayData.completionRate,
          routines: dayData.tasks.map((t) => ({ done: true, name: t.taskName })),
        };
      }
      setRoutinesByDate((prev) => ({ ...prev, ...mapped }));
    } catch {
      // keep existing data on error
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          const [statsData] = await Promise.all([
            getWeeklyStats(),
            loadCalendar(calendarView.year, calendarView.month),
          ]);
          if (active) setStats(statsData);
        } catch {
          // keep existing data
        }
      }

      load();
      return () => { active = false; };
    }, [])
  );

  const calendarDays = useMemo(
    () => createCalendarDays(calendarView.year, calendarView.month),
    [calendarView.month, calendarView.year]
  );
  const calendarWeeks = useMemo(
    () =>
      Array.from({ length: calendarDays.length / 7 }, (_, index) =>
        calendarDays.slice(index * 7, index * 7 + 7)
      ),
    [calendarDays]
  );

  const selectedDayMeta = routinesByDate[selectedDate] ?? null;
  const selectedRoutines = selectedDayMeta?.routines ?? [];
  const selectedDoneCount = selectedRoutines.filter((r) => r.done).length;

  const streak = stats?.currentStreak ?? 0;

  const handleChangeMonth = async (amount: number) => {
    const nextDate = new Date(calendarView.year, calendarView.month + amount, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth();
    setCalendarView({ month: nextMonth, year: nextYear });
    setSelectedDate(formatDateKey(nextYear, nextMonth, 1));
    await loadCalendar(nextYear, nextMonth);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.72}
            onPress={safeBack}
            style={styles.backButton}
          >
            <Ionicons color={colors.text} name="chevron-back" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>마이페이지</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakInline}>
            <Text style={styles.streakLabel}>연속 달성일</Text>
            <Text style={styles.streakValue}>{streak}일</Text>
          </View>
        </View>


        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              activeOpacity={0.72}
              onPress={() => handleChangeMonth(-1)}
              style={styles.monthButton}
            >
              <Ionicons color="#7F8B7C" name="chevron-back" size={22} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {calendarView.year}년 {calendarView.month + 1}월
            </Text>
            <TouchableOpacity
              activeOpacity={0.72}
              onPress={() => handleChangeMonth(1)}
              style={styles.monthButton}
            >
              <Ionicons color="#7F8B7C" name="chevron-forward" size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map((weekday, index) => (
              <Text
                key={weekday}
                style={[
                  styles.weekdayText,
                  index === 0 && styles.sundayText,
                  index === 6 && styles.saturdayText,
                ]}
              >
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week) => (
              <View key={week[0].dateKey} style={styles.calendarWeekRow}>
                {week.map((date) => {
                  const isSelected = date.dateKey === selectedDate;
                  const dayMeta = routinesByDate[date.dateKey];
                  const hasTasks = (dayMeta?.routines.length ?? 0) > 0;
                  const dColor = hasTasks ? dotColor(dayMeta!.completionRate) : undefined;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      key={date.dateKey}
                      onPress={() => setSelectedDate(date.dateKey)}
                      style={styles.dateCell}
                    >
                      <View style={[styles.dateBox, isSelected && styles.dateBoxSelected]}>
                        <Text
                          style={[
                            styles.dateText,
                            !date.currentMonth && styles.dateTextMuted,
                            isSelected && styles.dateTextSelected,
                          ]}
                        >
                          {date.day}
                        </Text>
                        {hasTasks && !isSelected && (
                          <View style={[styles.dateDot, { backgroundColor: dColor }]} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedDate.replaceAll('-', '.')} 루틴</Text>
            {selectedRoutines.length > 0 && (
              <Text style={styles.detailCount}>
                {selectedDoneCount} / {selectedRoutines.length} 완료
              </Text>
            )}
          </View>

          {selectedRoutines.length === 0 ? (
            <Text style={styles.emptyText}>이 날짜에는 기록된 루틴이 없어요.</Text>
          ) : (
            selectedRoutines.map((routine, index) => (
              <View
                key={`${routine.name}-${index}`}
                style={[
                  styles.routineRow,
                  index === selectedRoutines.length - 1 && styles.routineRowLast,
                ]}
              >
                <View style={[styles.routineCircle, routine.done && styles.routineCircleDone]}>
                  {routine.done && <Ionicons color="#FFFFFF" name="checkmark" size={15} />}
                </View>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={[styles.routineStatus, !routine.done && styles.routineStatusMissed]}>
                  {routine.done ? '완료' : '미완료'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <RoutineBottomNav active="my" />
    </SafeAreaView>
  );
}

const colors = {
  background: '#FBFCFA',
  border: '#E2E6E0',
  green: '#36583D',
  greenDark: '#143B22',
  greenSoft: '#EEF6EC',
  muted: '#71806E',
  text: '#102117',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  calendarCard: {
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    width: '88%',
  },
  calendarGrid: {
    paddingBottom: 16,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  calendarWeekRow: {
    flexDirection: 'row',
  },
  cardLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 12,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  dateDot: {
    backgroundColor: colors.green,
    borderRadius: 3,
    height: 4,
    marginTop: 2,
    width: 4,
  },
  dateBox: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 9,
    justifyContent: 'center',
    maxWidth: 48,
    width: '100%',
  },
  dateBoxSelected: {
    backgroundColor: colors.green,
  },
  dateCell: {
    alignItems: 'center',
    flex: 1,
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  dateText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  dateTextMuted: {
    color: '#C5D3BF',
  },
  dateTextSelected: {
    color: colors.white,
  },
  detailCard: {
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
    width: '88%',
  },
  detailCount: {
    color: '#5C7D61',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  detailHeader: {
    alignItems: 'center',
    borderBottomColor: '#EEF0EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  detailTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    padding: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
  },
  monthButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  monthTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
  },
  percent: {
    color: colors.greenDark,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 46,
  },
  progressFill: {
    backgroundColor: '#287A40',
    borderRadius: 8,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: '#E9F2E8',
    borderRadius: 8,
    height: 9,
    marginTop: 10,
    overflow: 'hidden',
    width: '86%',
  },
  rateCard: {
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 20,
    minHeight: 132,
    padding: 22,
    width: '88%',
  },
  rateCount: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 8,
  },
  rateRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routineCircle: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#BFC8BD',
    borderRadius: 13,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  routineCircleDone: {
    backgroundColor: '#287A40',
    borderColor: '#287A40',
  },
  routineName: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },
  routineRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  routineRowLast: {
    borderBottomWidth: 0,
  },
  routineStatus: {
    color: '#5C7D61',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  routineStatusMissed: {
    color: '#9A6A5E',
  },
  saturdayText: {
    color: '#4E72BB',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  streakCard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 14,
    minHeight: 132,
    padding: 22,
    width: '88%',
  },
  streakInline: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  streakLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  streakValue: {
    color: colors.greenDark,
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 54,
    textAlign: 'center',
  },
  sundayText: {
    color: '#CE5D53',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  weekdayText: {
    color: '#71806E',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
