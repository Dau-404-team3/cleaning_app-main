import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useSafeBack } from '../src/utils/useSafeBack';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getNotificationPreference,
  testNotification,
  testRoutineRefreshNotification,
  testScheduledNotification,
} from '../src/api/notification';
import { getTodayRoutine, getWeeklyStats } from '../src/api/routine';
import { useAuthStore } from '../src/store/authStore';
import type { TodayRoutineResponse, WeeklyStatsResponse } from '../src/types/routine';

interface DebugData {
  auth: {
    uid: string | null;
    email: string | null;
    isLoggedIn: boolean;
    isOnboarded: boolean;
  };
  todayRoutine: TodayRoutineResponse | null;
  weeklyStats: WeeklyStatsResponse | null;
  notificationPref: { enabled: boolean; time: string } | null;
  scheduledNotifications: Notifications.NotificationRequest[];
  notificationPermission: string;
  loadedAt: string;
}

export default function DebugScreen() {
  const safeBack = useSafeBack();
  const { uid, email, isLoggedIn, isOnboarded } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DebugData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testingNotif, setTestingNotif] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingRefresh, setTestingRefresh] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const [testingScheduled, setTestingScheduled] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    setTestResult(null);
    const errs: Record<string, string> = {};

    let todayRoutine: TodayRoutineResponse | null = null;
    try {
      todayRoutine = await getTodayRoutine();
    } catch (e: any) {
      errs['todayRoutine'] = e?.message ?? '알 수 없는 오류';
    }

    let weeklyStats: WeeklyStatsResponse | null = null;
    try {
      weeklyStats = await getWeeklyStats();
    } catch (e: any) {
      errs['weeklyStats'] = e?.message ?? '알 수 없는 오류';
    }

    let notificationPref: { enabled: boolean; time: string } | null = null;
    try {
      notificationPref = await getNotificationPreference();
    } catch (e: any) {
      errs['notificationPref'] = e?.message ?? '알 수 없는 오류';
    }

    let scheduledNotifications: Notifications.NotificationRequest[] = [];
    let notificationPermission = 'web (미지원)';
    if (Platform.OS !== 'web') {
      try {
        const perm = await Notifications.getPermissionsAsync();
        notificationPermission = perm.status;
        scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      } catch (e: any) {
        errs['notifications'] = e?.message ?? '알 수 없는 오류';
      }
    }

    setErrors(errs);
    setData({
      auth: { uid, email, isLoggedIn, isOnboarded },
      todayRoutine,
      weeklyStats,
      notificationPref,
      scheduledNotifications,
      notificationPermission,
      loadedAt: new Date().toLocaleString('ko-KR'),
    });
    setLoading(false);
  }, [uid, email, isLoggedIn, isOnboarded]);

  useEffect(() => { loadAll(); }, []);

  const handleTestNotification = async () => {
    setTestingNotif(true);
    setTestResult(null);
    try {
      await testNotification();
      setTestResult('✅ 성공 — 홈 화면에서 30초 내 팝업이 뜨는지 확인하세요');
    } catch (e: any) {
      setTestResult(`❌ 실패: ${e?.message ?? '서버 오류'}`);
    } finally {
      setTestingNotif(false);
    }
  };

  const handleTestRoutineRefresh = async () => {
    setTestingRefresh(true);
    setRefreshResult(null);
    try {
      const result = await testRoutineRefreshNotification();
      const detail = result.changeBody ? `\n📋 알림 내용: ${result.changeBody}` : '';
      setRefreshResult(`✅ AI 맞춤 추천 업데이트 완료 (${result.spaceCount ?? 0}개 공간)${detail}`);
    } catch (e: any) {
      setRefreshResult(`❌ 실패: ${e?.message ?? '서버 오류 또는 AI API 응답 없음'}`);
    } finally {
      setTestingRefresh(false);
    }
  };

  const handleTestScheduled = async () => {
    setTestingScheduled(true);
    setScheduledResult(null);
    try {
      const result = await testScheduledNotification();
      if (result.success) {
        setScheduledResult(`✅ 태스크 ${result.count}개 개별 알림 발송 — 홈 화면에서 팝업 확인`);
      } else {
        setScheduledResult(`⚠️ ${result.message ?? '알림 없음'}`);
      }
    } catch (e: any) {
      setScheduledResult(`❌ 실패: ${e?.message ?? '서버 오류'}`);
    } finally {
      setTestingScheduled(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={safeBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>🛠 디버그 패널</Text>
        <TouchableOpacity onPress={loadAll} style={styles.iconBtn} disabled={loading}>
          <Ionicons name="refresh" size={20} color={loading ? '#ccc' : colors.green} />
        </TouchableOpacity>
      </View>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.mutedText}>API 응답 불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAll} tintColor={colors.green} />}
          showsVerticalScrollIndicator={false}
        >
          {data && (
            <>
              <Text style={styles.timestamp}>마지막 로드: {data.loadedAt}</Text>

              {/* ─── 인증 정보 ─── */}
              <Section title="🔑 인증 정보">
                <Row label="UID" value={data.auth.uid ?? '없음'} />
                <Row label="이메일" value={data.auth.email ?? '없음'} />
                <Row label="로그인 상태" value={data.auth.isLoggedIn ? '✅ 로그인됨' : '❌ 비로그인'} />
                <Row label="온보딩 완료" value={data.auth.isOnboarded ? '✅ 완료' : '❌ 미완료'} />
              </Section>

              {/* ─── 공간별 점수 ─── */}
              <Section title="📊 공간별 점수 (spaceStatus)">
                {errors['todayRoutine'] ? (
                  <ErrRow msg={errors['todayRoutine']} />
                ) : !data.todayRoutine || Object.keys(data.todayRoutine.spaceStatus).length === 0 ? (
                  <Text style={styles.mutedText}>데이터 없음 — 루틴이 없거나 아직 집계 전이에요</Text>
                ) : (
                  Object.entries(data.todayRoutine.spaceStatus).map(([space, s]) => (
                    <View key={space} style={styles.card}>
                      <Text style={styles.cardTitle}>{space}</Text>
                      <Row label="누적 점수" value={String(s.score)} />
                      <Row label="총 청소 횟수" value={`${s.cleanCount}회`} />
                      <Row label="마지막 청소" value={s.lastCleanedAt ?? '기록 없음'} />
                    </View>
                  ))
                )}
              </Section>

              {/* ─── 오늘 루틴 원본 ─── */}
              <Section title="📋 오늘 루틴 원본 데이터">
                {errors['todayRoutine'] ? (
                  <ErrRow msg={errors['todayRoutine']} />
                ) : data.todayRoutine ? (
                  <>
                    <Row label="날짜" value={`${data.todayRoutine.date} (${data.todayRoutine.day})`} />
                    <Row label="전체 태스크" value={`${data.todayRoutine.tasks.length}개`} />
                    <Row label="완료 태스크" value={`${data.todayRoutine.completedCount}개`} />
                    <Row label="총 예상 시간" value={`${data.todayRoutine.totalMinutes}분`} />
                    <Divider />
                    <Text style={styles.subLabel}>태스크 목록 (완료 ✅ / 미완료 ⬜ / 오늘 아님 ⏭)</Text>
                    {data.todayRoutine.tasks.map((t, i) => (
                      <View key={t.id ?? i} style={styles.taskRow}>
                        <Text style={styles.taskIcon}>
                          {t.completed ? '✅' : t.dueToday ? '⬜' : '⏭'}
                        </Text>
                        <View style={styles.taskInfo}>
                          <Text style={styles.taskName}>{t.taskName}</Text>
                          <Text style={styles.taskMeta}>{t.space} · {t.frequency} · {t.estimatedMinutes}분</Text>
                        </View>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text style={styles.mutedText}>데이터 없음</Text>
                )}
              </Section>

              {/* ─── 주간 통계 ─── */}
              <Section title="📈 주간 통계 원본 데이터">
                {errors['weeklyStats'] ? (
                  <ErrRow msg={errors['weeklyStats']} />
                ) : data.weeklyStats ? (
                  <>
                    <Row
                      label="주간 완료율"
                      value={`${Math.round((data.weeklyStats.weeklyCompletionRate ?? 0) * 100)}%`}
                    />
                    <Row
                      label="완료 / 전체"
                      value={`${data.weeklyStats.completedCount} / ${data.weeklyStats.totalCount}`}
                    />
                    <Row label="연속 일수 (streak)" value={`${data.weeklyStats.currentStreak}일`} />
                    <Row label="오늘 남은 루틴" value={`${data.weeklyStats.remainingToday}개`} />
                  </>
                ) : (
                  <Text style={styles.mutedText}>데이터 없음</Text>
                )}
              </Section>

              {/* ─── 알림 상태 ─── */}
              <Section title="🔔 알림 동작 상태">
                {errors['notifications'] && <ErrRow msg={errors['notifications']} />}

                <Row label="권한 상태" value={permLabel(data.notificationPermission)} />

                {errors['notificationPref'] ? (
                  <ErrRow msg={errors['notificationPref']} />
                ) : data.notificationPref ? (
                  <>
                    <Row label="서버 알림 켜짐" value={data.notificationPref.enabled ? '✅ 켜짐' : '❌ 꺼짐'} />
                    <Row label="서버 설정 시간" value={data.notificationPref.time || '설정 안됨'} />
                  </>
                ) : (
                  <Row label="서버 알림 설정" value="없음 (루틴 세팅 안 됨)" />
                )}

                <Divider />

                {Platform.OS === 'web' ? (
                  <Text style={styles.mutedText}>웹은 로컬 알림 미지원 — 백엔드 cron으로 발송</Text>
                ) : (
                  <>
                    <Text style={styles.subLabel}>
                      예약된 로컬 알림 ({data.scheduledNotifications.length}개)
                    </Text>
                    {data.scheduledNotifications.length === 0 ? (
                      <Text style={styles.mutedText}>
                        예약 없음 — 루틴 설정에서 알림 시간을 설정하면 여기 뜨게 돼요
                      </Text>
                    ) : (
                      data.scheduledNotifications.map((n, i) => (
                        <View key={i} style={styles.card}>
                          <Row label="제목" value={String(n.content.title ?? '없음')} />
                          <Row label="내용" value={String(n.content.body ?? '없음')} />
                          <Row label="트리거" value={JSON.stringify(n.trigger)} />
                        </View>
                      ))
                    )}
                  </>
                )}

                <Divider />
                <Text style={styles.subLabel}>알림 즉시 발송 테스트 (쿨다운 무시)</Text>

                <TouchableOpacity
                  style={[styles.btn, testingNotif && styles.btnDisabled]}
                  onPress={handleTestNotification}
                  disabled={testingNotif}
                  activeOpacity={0.78}
                >
                  {testingNotif ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnText}>🔔 기본 테스트 알림</Text>
                  )}
                </TouchableOpacity>
                {testResult && (
                  <Text style={[styles.testResult, testResult.startsWith('✅') ? styles.testResultOk : styles.testResultErr]}>
                    {testResult}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.btn, styles.btnGreen, testingRefresh && styles.btnDisabled]}
                  onPress={handleTestRoutineRefresh}
                  disabled={testingRefresh}
                  activeOpacity={0.78}
                >
                  {testingRefresh ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnText}>✨ AI 맞춤 추천 재생성 시뮬레이션</Text>
                  )}
                </TouchableOpacity>
                {refreshResult && (
                  <Text style={[styles.testResult, refreshResult.startsWith('✅') ? styles.testResultOk : styles.testResultErr]}>
                    {refreshResult}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.btn, styles.btnBlue, testingScheduled && styles.btnDisabled]}
                  onPress={handleTestScheduled}
                  disabled={testingScheduled}
                  activeOpacity={0.78}
                >
                  {testingScheduled ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.btnText}>🧹 오늘 청소 알림 시뮬레이션</Text>
                  )}
                </TouchableOpacity>
                {scheduledResult && (
                  <Text style={[styles.testResult, scheduledResult.startsWith('✅') ? styles.testResultOk : styles.testResultErr]}>
                    {scheduledResult}
                  </Text>
                )}
              </Section>

              {/* ─── 오류 요약 ─── */}
              {Object.keys(errors).length > 0 && (
                <View style={styles.errSummary}>
                  <Text style={styles.errSummaryTitle}>⚠️ 로드 실패 항목</Text>
                  {Object.entries(errors).map(([k, v]) => (
                    <Text key={k} style={styles.errSummaryItem}>• {k}: {v}</Text>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function permLabel(status: string) {
  if (status === 'granted') return '✅ 허용됨';
  if (status === 'denied') return '❌ 거부됨';
  if (status === 'undetermined') return '⏳ 아직 요청 안 함';
  return `❓ ${status}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={3}>{value}</Text>
    </View>
  );
}

function ErrRow({ msg }: { msg: string }) {
  return <Text style={styles.errText}>❌ {msg}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

const colors = {
  background: '#FBFCFA',
  border: '#E2E6E0',
  green: '#26743E',
  text: '#0F2116',
  muted: '#627064',
  white: '#FFFFFF',
  error: '#C0392B',
  errorBg: '#FFF0EE',
  errorBorder: '#FFCDC8',
  cardBg: '#F4F8F4',
  cardBorder: '#DDE8DD',
};

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnGreen: { backgroundColor: '#26743E' },
  btnBlue: { backgroundColor: '#1565C0' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  card: {
    backgroundColor: colors.cardBg,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginTop: 6,
    padding: 10,
  },
  cardTitle: { color: colors.green, fontSize: 14, fontWeight: '900', marginBottom: 2 },
  center: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  container: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 14, padding: 18, paddingBottom: 48 },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: 8 },
  errSummary: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  errSummaryItem: { color: colors.error, fontSize: 12, fontWeight: '600' },
  errSummaryTitle: { color: colors.error, fontSize: 14, fontWeight: '900' },
  errText: { color: colors.error, fontSize: 13, fontWeight: '600' },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconBtn: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  mutedText: { color: colors.muted, fontSize: 13, fontStyle: 'italic', fontWeight: '600' },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  rowLabel: { color: colors.muted, flexShrink: 0, fontSize: 13, fontWeight: '700' },
  rowValue: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  section: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 4 },
  subLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 4 },
  taskIcon: { fontSize: 16 },
  taskInfo: { flex: 1 },
  taskMeta: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 1 },
  taskName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  taskRow: {
    alignItems: 'center',
    borderBottomColor: '#F0F4F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
  },
  testResult: { fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 8 },
  testResultErr: { color: colors.error },
  testResultOk: { color: colors.green },
  timestamp: { color: colors.muted, fontSize: 11, marginBottom: 2, textAlign: 'right' },
  title: { color: colors.text, flex: 1, fontSize: 17, fontWeight: '900', textAlign: 'center' },
});
