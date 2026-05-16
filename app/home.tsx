import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedFlame } from '../components/AnimatedFlame';
import { NotificationInbox } from '../components/NotificationInbox';
import { NotificationPopup } from '../components/NotificationPopup';
import { RoutineBottomNav } from '../components/RoutineBottomNav';
import {
  completeTask,
  deleteTask,
  getTodayRoutine,
  getWeeklyStats,
  resetRoutine,
  skipTask,
} from '../src/api/routine';
import {
  getNotificationInbox,
  markNotificationsRead,
  testNotification,
  type NotificationItem,
} from '../src/api/notification';
import { clearPendingRoutineUpdate, getPendingRoutineUpdate } from '../src/api/chatbot';
import { useAuthStore } from '../src/store/authStore';
import type { Task } from '../src/types/routine';

// ─── 당일 완료/건너뜀 상태 추적기 ───
// 날짜가 바뀌면 자동으로 초기화되어 자정 리셋 구현
// frequency-aware 영속 tracker (localStorage)
// daily → 당일만 유지 / weekly → 7일 / monthly → 30일
const _tracker = (() => {
  const BASE_KEY = 'routine_tracker_v2';
  // 사용자별 독립 키 — 계정 전환 시 다른 사용자의 완료 기록이 노출되는 것을 방지
  let _key = BASE_KEY;

  interface Entry { type: 'completed' | 'skipped'; doneAt: number; }

  // 메모리 캐시 (페이지 내 중복 localStorage 읽기 방지)
  let _cache: Record<string, Entry> | null = null;

  function load(): Record<string, Entry> {
    if (_cache) return _cache;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(_key) : null;
      _cache = raw ? JSON.parse(raw) : {};
    } catch { _cache = {}; }
    return _cache!;
  }

  function save(): void {
    if (!_cache) return;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(_key, JSON.stringify(_cache));
    } catch {}
  }

  function daysSince(ts: number): number {
    // 자정(로컬) 기준 달력 일수 차이 — 시간 기반 ms 계산 시 자정 직후 오차 발생 방지
    const doneMidnight = new Date(ts);
    doneMidnight.setHours(0, 0, 0, 0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return Math.round((todayMidnight.getTime() - doneMidnight.getTime()) / 86400000);
  }

  function expired(entry: Entry, freq: 'daily' | 'weekly' | 'monthly'): boolean {
    if (freq === 'daily') {
      const doneDay = new Date(entry.doneAt).toISOString().split('T')[0];
      const today  = new Date().toISOString().split('T')[0];
      return doneDay !== today;
    }
    const limit = freq === 'weekly' ? 7 : 30;
    return daysSince(entry.doneAt) >= limit;
  }

  return {
    checkReset() { /* no-op: lazy expiry */ },

    markCompleted(id: string) {
      load()[id] = { type: 'completed', doneAt: Date.now() };
      save();
    },
    markSkipped(id: string) {
      load()[id] = { type: 'skipped', doneAt: Date.now() };
      save();
    },

    isCompleted(id: string, freq: 'daily' | 'weekly' | 'monthly' = 'daily'): boolean {
      const e = load()[id];
      if (!e || e.type !== 'completed') return false;
      if (expired(e, freq)) { delete load()[id]; save(); return false; }
      return true;
    },
    isSkipped(id: string, freq: 'daily' | 'weekly' | 'monthly' = 'daily'): boolean {
      const e = load()[id];
      if (!e || e.type !== 'skipped') return false;
      if (expired(e, freq)) { delete load()[id]; save(); return false; }
      return true;
    },
    isDone(id: string, freq: 'daily' | 'weekly' | 'monthly' = 'daily'): boolean {
      return this.isCompleted(id, freq) || this.isSkipped(id, freq);
    },

    /** 남은 유효 일수 (daily는 항상 0) */
    remainingDays(id: string, freq: 'daily' | 'weekly' | 'monthly'): number {
      if (freq === 'daily') return 0;
      const e = load()[id];
      if (!e) return 0;
      const period = freq === 'weekly' ? 7 : 30;
      return Math.max(0, period - daysSince(e.doneAt));
    },

    /** 백엔드 날짜 문자열("2026-05-13")로 정확한 시각 복원 */
    markAt(id: string, type: 'completed' | 'skipped', dateStr: string) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const doneAt = new Date(y, m - 1, d).getTime(); // 로컬 자정 기준
      load()[id] = { type, doneAt };
      save();
    },

    /** 계정 전환 시 호출 — 사용자별 독립 저장소로 전환하여 타계정 데이터 혼입 방지 */
    setUser(userIdentifier: string) {
      const newKey = `${BASE_KEY}_${userIdentifier}`;
      if (newKey !== _key) {
        _key = newKey;
        _cache = null; // 키 변경 시 캐시 초기화 → 다음 load()에서 해당 유저 데이터 읽음
      }
    },

    /** 태스크 삭제 시 tracker 항목 제거 — 재추가 후 체크 상태 잔류 방지 */
    clearEntry(id: string) {
      const data = load();
      if (data[id]) {
        delete data[id];
        save();
      }
    },
  };
})();

function confirmAction(title: string, message: string, confirmText: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function suggestAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  onCancel?: () => void
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    else onCancel?.();
    return;
  }
  Alert.alert(title, message, [
    { text: '나중에', style: 'cancel', onPress: onCancel },
    { text: confirmText, onPress: onConfirm },
  ]);
}

type ActiveFrequency = 'today' | 'all' | 'daily' | 'weekly' | 'monthly';

const frequencyTabs: { emoji: string; key: ActiveFrequency; label: string }[] = [
  { emoji: '📌', key: 'today', label: '오늘' },
  { emoji: '📋', key: 'all', label: '전체' },
  { emoji: '☀️', key: 'daily', label: '매일' },
  { emoji: '📅', key: 'weekly', label: '주간' },
  { emoji: '🗓️', key: 'monthly', label: '월간' },
];


const encouragementMessages = [
  '조금씩 성장하다 보면 어느새 멋진 어른이 되어 있을 거예요',
  '오늘의 작은 정리가 내일의 나를 더 편하게 해줄 거예요',
  '완벽하지 않아도 괜찮아요. 이어가는 마음이 제일 멋져요',
  '차근차근 해내는 지금의 당신을 응원해요',
  '작은 습관들이 모여 단단한 하루를 만들고 있어요',
];

export default function Home() {
  const router = useRouter();
  const { email, logout } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFrequency, setActiveFrequency] = useState<ActiveFrequency>('today');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  // trackerVersion은 _tracker 변경 시 강제 리렌더를 위한 카운터
  const [trackerVersion, setTrackerVersion] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [popupNotification, setPopupNotification] = useState<NotificationItem | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(false);
  const shownIds = useRef<Set<string>>(new Set());
  const isShowingPopup = useRef(false);
  const debugTapCount = useRef(0);
  const debugTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const encouragementMessage = useMemo(
    () => encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)],
    []
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        // 사용자별 tracker 저장소 설정 — 계정 전환 시 타계정 완료 기록 혼입 방지
        if (email) _tracker.setUser(email);
        // 날짜 변경 여부 확인 → 자정 리셋
        _tracker.checkReset();

        setLoading(true);
        try {
          const [routineData, statsData] = await Promise.all([
            getTodayRoutine(),
            getWeeklyStats(),
          ]);
          if (active) {
            console.log('[홈] 오늘 루틴 로드:', {
              date: routineData.date,
              day: routineData.day,
              taskCount: routineData.tasks.length,
              completedCount: routineData.completedCount,
              totalMinutes: routineData.totalMinutes,
              spaceStatus: routineData.spaceStatus,
            });
            console.log('[홈] 주간 통계:', statsData);

            // 백엔드 완료/건너뜀 상태를 실제 날짜 기반으로 tracker에 복원
            // markAt으로 남은 일수가 정확하게 계산됨 (Date.now() 기준 오차 제거)
            routineData.tasks.forEach((t) => {
              if (t.completed && t.lastCompletedAt && !_tracker.isCompleted(t.id, t.frequency)) {
                _tracker.markAt(t.id, 'completed', t.lastCompletedAt);
              }
              if (t.skipped && t.lastSkippedAt && !_tracker.isSkipped(t.id, t.frequency)) {
                _tracker.markAt(t.id, 'skipped', t.lastSkippedAt);
              }
            });

            setTasks(routineData.tasks);
            setStreak(statsData.currentStreak);
            setTrackerVersion((v) => v + 1);
          }
        } catch {
          // 실패 시 빈 목록 유지
        } finally {
          if (active) setLoading(false);
        }

        // 챗봇 세션 분석 결과로 루틴 업데이트 제안이 있으면 팝업
        getPendingRoutineUpdate()
          .then(({ pending }) => {
            if (!active || !pending?.categories?.length) return;
            suggestAction(
              '루틴 재생성',
              '이전 챗봇과의 대화내역을 바탕으로 루틴을 재생성 해드릴까요?',
              '재생성하기',
              async () => {
                await clearPendingRoutineUpdate().catch(() => null);
                router.push('/routine-loading');
              },
              () => clearPendingRoutineUpdate().catch(() => null)
            );
          })
          .catch(() => null);
      }
      load();
      return () => { active = false; };
    }, [])
  );

  // "오늘" 탭: dueToday이면서 아직 완료/건너뜀 처리 안 된 것만
  // 나머지 탭: frequency로 필터 (완료/건너뜀 태스크도 포함, 시각적 구분)
  const activeTasks = useMemo(() => {
    if (activeFrequency === 'today') {
      return tasks.filter((t) => t.dueToday && !_tracker.isDone(t.id, t.frequency));
    }
    if (activeFrequency === 'all') return tasks;
    return tasks.filter((t) => t.frequency === activeFrequency);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, activeFrequency, trackerVersion]);


  const displayName = email ? email.split('@')[0] : '님';

  const handleComplete = async (task: Task) => {
    // 이미 완료/건너뜀 처리된 태스크는 무시
    if (togglingId === task.id || _tracker.isDone(task.id, task.frequency)) return;

    setTogglingId(task.id);
    _tracker.markCompleted(task.id);
    setTrackerVersion((v) => v + 1);

    // 낙관적 UI: completed 상태로 변경
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t))
    );

    try {
      await completeTask(task.id, task.space, task.taskName);
      console.log('[루틴] 완료 처리:', { id: task.id, taskName: task.taskName, space: task.space });
    } catch {
      // 실패해도 완료 상태는 유지 (재완료 방지)
      console.warn('[루틴] 완료 API 실패, 로컬 상태는 유지:', task.id);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = (task: Task) => {
    confirmAction(
      '루틴 삭제',
      `"${task.taskName}"을(를) 루틴에서 삭제할까요?`,
      '삭제',
      async () => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        _tracker.clearEntry(task.id);
        setTrackerVersion((v) => v + 1);
        try {
          await deleteTask(task.id);
        } catch {
          setTasks((prev) => [...prev, task]);
        }
      }
    );
  };

  const handleResetRoutine = () => {
    confirmAction(
      '전체 루틴 초기화',
      '모든 루틴을 삭제하고 처음부터 다시 설정할까요?',
      '초기화',
      async () => {
        try {
          await resetRoutine();
          setTasks([]);
        } catch {
          showAlert('오류', '초기화에 실패했어요. 다시 시도해주세요.');
        }
      }
    );
  };

  const handleSkip = (task: Task) => {
    // 이미 완료/건너뜀 처리된 태스크는 무시
    if (skippingId === task.id || _tracker.isDone(task.id, task.frequency)) return;

    confirmAction(
      '루틴 건너뛰기',
      `"${task.taskName}"을(를) 오늘은 건너뛸까요?\n건너뜀 횟수가 누적되면 루틴 재조정을 제안해드려요.`,
      '건너뛰기',
      async () => {
        setSkippingId(task.id);
        _tracker.markSkipped(task.id);
        setTrackerVersion((v) => v + 1);
        // 태스크를 제거하지 않고 상태만 변경 → 다른 탭에서 건너뜀 상태로 표시

        try {
          const result = await skipTask(task.id, task.space, task.frequency);
          console.log('[루틴] 건너뜀 결과:', {
            id: task.id,
            taskName: task.taskName,
            space: task.space,
            routineRefreshSuggested: result.routineRefreshSuggested,
          });
          if (result.routineRefreshSuggested) {
            setTimeout(() => {
              confirmAction(
                '루틴 재생성',
                '자주 건너뛰기가 발생했습니다. 루틴을 재생성 해드릴까요?',
                '재생성하기',
                () => router.push({
                  pathname: '/routine-loading',
                  params: { spaceKey: task.space },
                })
              );
            }, 300);
          }
        } catch {
          // API 실패해도 로컬 건너뜀 상태는 유지
          console.warn('[루틴] 건너뜀 API 실패, 로컬 상태는 유지:', task.id);
        } finally {
          setSkippingId(null);
        }
      }
    );
  };

  const handleStreakTap = () => {
    debugTapCount.current += 1;
    if (debugTapTimer.current) clearTimeout(debugTapTimer.current);
    if (debugTapCount.current >= 5) {
      debugTapCount.current = 0;
      router.push('/debug');
      return;
    }
    debugTapTimer.current = setTimeout(() => { debugTapCount.current = 0; }, 2000);
  };

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setInboxLoading(true);
    try {
      const items = await getNotificationInbox();
      setNotifications(items);
      if (!isShowingPopup.current) {
        const newUnread = items.find((n) => !n.read && !shownIds.current.has(n.id));
        if (newUnread) {
          shownIds.current.add(newUnread.id);
          isShowingPopup.current = true;
          setPopupNotification(newUnread);
        }
      }
    } catch {
      // silent fail
    } finally {
      if (showLoading) setInboxLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }, [fetchNotifications])
  );

  const handleMarkRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationsRead([id]);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markNotificationsRead(unreadIds);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: false } : n))
      );
    }
  }, [notifications]);

  const handleTestNotification = async () => {
    try {
      await testNotification();
      showAlert('테스트 알림 전송', '잠시 후 알림이 도착해요.');
    } catch {
      showAlert('전송 실패', 'FCM 토큰이 등록되지 않았거나 서버 오류예요.');
    }
  };

  const openRoutine = (task: Task) => {
    router.push({
      pathname: '/routine-tip',
      params: {
        completedCount: String(tasks.filter((t) => t.completed).length),
        isCompleted: String(_tracker.isCompleted(task.id) || task.completed),
        isSkipped: String(_tracker.isSkipped(task.id)),
        routineIcon: 'sparkles-outline',
        routineId: task.id,
        routineMeta: `${task.space} · ${task.estimatedMinutes}분`,
        routineSpace: task.space,
        routineTitle: task.taskName,
        totalRoutineCount: String(tasks.length),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요, {displayName}님 👋</Text>
        <TouchableOpacity activeOpacity={0.72} onPress={() => { setShowInbox(true); fetchNotifications(true); }} style={styles.iconButton}>
          <View>
            <Ionicons color="#0F2116" name="notifications-outline" size={24} />
            {notifications.filter((n) => !n.read).length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notifications.filter((n) => !n.read).length > 9
                    ? '9+'
                    : notifications.filter((n) => !n.read).length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={handleResetRoutine}
          style={styles.iconButton}
        >
          <Ionicons color="#C0392B" name="trash-bin-outline" size={21} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={() => confirmAction('로그아웃', '로그아웃 하시겠어요?', '로그아웃', logout)}
          style={styles.iconButton}
        >
          <Ionicons color="#565E55" name="log-out-outline" size={22} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.green} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.streakCard}>
            <TouchableOpacity activeOpacity={1} onPress={handleStreakTap} style={styles.streakTitleRow}>
              <AnimatedFlame size={28} />
              <Text style={styles.streakTitle}>{streak}일 연속</Text>
            </TouchableOpacity>
            <Text style={styles.streakCaption}>{encouragementMessage}</Text>
          </View>

          {tasks.length > 0 ? (
            <>
              <ScrollView
                contentContainerStyle={styles.periodTabs}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {frequencyTabs.map((tab) => {
                  const selected = activeFrequency === tab.key;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.78}
                      key={tab.key}
                      onPress={() => setActiveFrequency(tab.key)}
                      style={[styles.periodTab, selected && styles.periodTabActive]}
                    >
                      <Text style={[styles.periodTabText, selected && styles.periodTabTextActive]}>
                        {tab.emoji} {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>


              <View style={styles.periodSection}>
                {activeTasks
                  .slice()
                  .sort((a, b) => {
                    // 건너뜀 → 완료 → 미완료 순서
                    const stateOf = (t: Task) => {
                      if (_tracker.isSkipped(t.id, t.frequency)) return 2;
                      if (_tracker.isCompleted(t.id, t.frequency) || t.completed) return 1;
                      return 0;
                    };
                    return stateOf(a) - stateOf(b);
                  })
                  .map((task) => {
                    const isCompleted = _tracker.isCompleted(task.id, task.frequency) || (task.frequency === 'daily' && task.completed);
                    const isSkipped = _tracker.isSkipped(task.id, task.frequency);
                    const remainingDays = (isCompleted || isSkipped) && task.frequency !== 'daily'
                      ? _tracker.remainingDays(task.id, task.frequency)
                      : 0;

                    return (
                      <View
                        key={task.id}
                        style={[
                          styles.routineRow,
                          isSkipped && styles.routineRowSkipped,
                        ]}
                      >
                        {/* 체크 버튼 */}
                        <TouchableOpacity
                          activeOpacity={isCompleted || isSkipped ? 1 : 0.7}
                          disabled={isCompleted || isSkipped || togglingId === task.id}
                          onPress={() => handleComplete(task)}
                          style={[
                            styles.routineCheck,
                            isCompleted && styles.routineCheckDone,
                            isSkipped && styles.routineCheckSkipped,
                          ]}
                        >
                          {togglingId === task.id ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : isCompleted ? (
                            <Ionicons color="#FFFFFF" name="checkmark" size={18} />
                          ) : isSkipped ? (
                            <Ionicons color="#FFFFFF" name="remove" size={18} />
                          ) : null}
                        </TouchableOpacity>

                        {/* 루틴 이름 / 상세 진입 */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => openRoutine(task)}
                          style={styles.routineCopyButton}
                        >
                          <Text style={[
                            styles.routineName,
                            isCompleted && styles.routineNameDone,
                            isSkipped && styles.routineNameSkipped,
                          ]}>
                            {task.taskName}
                          </Text>
                          <Text style={[styles.routineMeta, isSkipped && styles.routineMetaSkipped]}>
                            {task.space} · {task.estimatedMinutes}분 · {task.frequency === 'daily' ? '매일' : task.frequency === 'weekly' ? '주간' : '월간'}
                            {task.frequency === 'daily' && isSkipped ? ' · 오늘 건너뜀' : ''}
                            {task.frequency !== 'daily' && (isCompleted || isSkipped) && remainingDays > 0
                              ? ` · 앞으로 ${remainingDays}일 뒤에 다시 청소`
                              : ''}
                          </Text>
                        </TouchableOpacity>

                        {/* 건너뜀 버튼: 미완료 상태에서만 표시 */}
                        {!isCompleted && !isSkipped && (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            disabled={skippingId === task.id}
                            onPress={() => handleSkip(task)}
                            style={styles.skipButton}
                          >
                            <Ionicons color="#B0BAB2" name="play-skip-forward-outline" size={18} />
                          </TouchableOpacity>
                        )}

                        {/* 삭제 버튼: 항상 표시 */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleDeleteTask(task)}
                          style={styles.deleteButton}
                        >
                          <Ionicons color="#C4CBCA" name="trash-outline" size={17} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            </>
          ) : (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIcon}>
                <Ionicons color={colors.green} name="calendar-outline" size={32} />
              </View>
              <Text style={styles.emptyTitle}>오늘의 루틴이 없어요</Text>
              <Text style={styles.emptyText}>
                루틴이 아직 생성되지 않았거나 오늘은 청소가 없는 날이에요.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        accessibilityLabel="루틴 추가"
        accessibilityRole="button"
        activeOpacity={0.84}
        onPress={() => router.push('/routine-add')}
        style={styles.floatingButton}
      >
        <Ionicons color="#FFFFFF" name="add" size={28} />
      </TouchableOpacity>
      <RoutineBottomNav active="home" />

      {popupNotification && (
        <NotificationPopup
          notification={popupNotification}
          onDismiss={() => {
            setPopupNotification(null);
            isShowingPopup.current = false;
          }}
          onOpenInbox={() => setShowInbox(true)}
        />
      )}

      <NotificationInbox
        loading={inboxLoading}
        notifications={notifications}
        onClose={() => setShowInbox(false)}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
        onSendTest={handleTestNotification}
        visible={showInbox}
      />
    </SafeAreaView>
  );
}

const colors = {
  background: '#FBFCFA',
  border: '#E2E6E0',
  green: '#26743E',
  greenDark: '#143C22',
  greenSoft: '#E9F4E7',
  muted: '#627064',
  text: '#0F2116',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    marginBottom: 14,
    width: 50,
  },
  emptyStateCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 22,
    marginTop: 18,
    padding: 24,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
    marginTop: 9,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
  },
  floatingButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 25,
    bottom: 112,
    elevation: 10,
    height: 50,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    shadowColor: '#123B22',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    width: 50,
    zIndex: 20,
  },
  greeting: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  iconButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  periodSection: {
    marginHorizontal: 22,
  },
  periodTab: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  periodTabActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  periodTabText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  periodTabTextActive: {
    color: colors.white,
  },
  periodTabs: {
    gap: 8,
    paddingHorizontal: 22,
  },
  progressCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  progressFill: {
    backgroundColor: colors.green,
    borderRadius: 4,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 22,
  },
  progressTitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  progressTrack: {
    backgroundColor: '#DFE6DF',
    borderRadius: 4,
    height: 8,
    marginHorizontal: 22,
    marginTop: 8,
    overflow: 'hidden',
  },
  routineCheck: {
    alignItems: 'center',
    borderColor: '#C7D0C8',
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  routineCheckDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  routineCheckSkipped: {
    backgroundColor: '#9EAAA0',
    borderColor: '#9EAAA0',
  },
  routineCopyButton: {
    flex: 1,
  },
  routineMeta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 4,
  },
  routineMetaSkipped: {
    color: '#A8B4A9',
  },
  routineName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  routineNameDone: {
    color: '#8D968E',
    textDecorationLine: 'line-through',
  },
  routineNameSkipped: {
    color: '#A8B4A9',
    textDecorationLine: 'line-through',
  },
  routineRow: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    marginTop: 8,
    minHeight: 73,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  routineRowSkipped: {
    backgroundColor: '#F5F7F5',
    borderColor: '#DDE4DD',
    opacity: 0.8,
  },
  scrollContent: {
    paddingBottom: 104,
  },
  skipButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  deleteButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  streakCaption: {
    color: colors.greenDark,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 8,
  },
  streakCard: {
    backgroundColor: '#DDF2D8',
    borderRadius: 17,
    justifyContent: 'center',
    marginBottom: 18,
    marginHorizontal: 22,
    minHeight: 104,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  streakTitle: {
    color: colors.greenDark,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 0,
  },
  streakTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -5,
    top: -4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
