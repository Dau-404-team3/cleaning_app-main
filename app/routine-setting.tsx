import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutineBottomNav } from '../components/RoutineBottomNav';
import {
  AddedRoutinePayload,
  RoutinePeriodKey,
  routinePeriodOptions,
} from '../constants/routines';
import { editRoutine } from '../src/api/routine';
import { saveNotificationPreference } from '../src/api/notification';
import { useSafeBack } from '../src/utils/useSafeBack';
import { requestNotificationPermission, scheduleCleaningReminder } from '../src/utils/notifications';

type RouteParams = {
  selectedRoutines?: string;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isAddedRoutinePayload(value: unknown): value is AddedRoutinePayload {
  if (!value || typeof value !== 'object') return false;
  const routine = value as Record<string, unknown>;
  return (
    typeof routine.description === 'string' &&
    typeof routine.icon === 'string' &&
    typeof routine.id === 'string' &&
    typeof routine.meta === 'string' &&
    typeof routine.title === 'string'
  );
}

function parseRoutines(rawRoutines?: string) {
  if (!rawRoutines) return [];
  try {
    const parsed = JSON.parse(rawRoutines);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAddedRoutinePayload);
  } catch {
    return [];
  }
}

// ─── 드럼롤 타임피커 (네이티브 전용) ───────────────────────────────────────
const ITEM_H = 52;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function fmt2(n: number) {
  return String(n).padStart(2, '0');
}

function NativeTimePickerModal({
  value,
  onConfirm,
  onClose,
}: {
  value: string;
  onConfirm: (t: string) => void;
  onClose: () => void;
}) {
  const parts = value.split(':').map(Number);
  const initH = isNaN(parts[0]) ? 8 : parts[0];
  const initM = isNaN(parts[1]) ? 0 : Math.round(parts[1] / 5) * 5;

  const [selHour, setSelHour] = useState(initH);
  const [selMinute, setSelMinute] = useState(initM);

  const hourRef = useRef<FlatList>(null);
  const minRef = useRef<FlatList>(null);

  useEffect(() => {
    const hIdx = HOURS.indexOf(initH);
    const mIdx = MINUTES.indexOf(Math.round(initM / 5) * 5);
    setTimeout(() => {
      if (hIdx >= 0) hourRef.current?.scrollToOffset({ offset: hIdx * ITEM_H, animated: false });
      if (mIdx >= 0) minRef.current?.scrollToOffset({ offset: mIdx * ITEM_H, animated: false });
    }, 80);
  }, []);

  const handleConfirm = () => {
    onConfirm(`${fmt2(selHour)}:${fmt2(selMinute)}`);
    onClose();
  };

  const renderHour = ({ item }: { item: number }) => (
    <View style={pickerSt.item}>
      <Text style={item === selHour ? pickerSt.selText : pickerSt.dimText}>{fmt2(item)}</Text>
    </View>
  );

  const renderMinute = ({ item }: { item: number }) => (
    <View style={pickerSt.item}>
      <Text style={item === selMinute ? pickerSt.selText : pickerSt.dimText}>{fmt2(item)}</Text>
    </View>
  );

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={pickerSt.overlay}>
        <View onStartShouldSetResponder={() => true} style={pickerSt.box}>
          <Text style={pickerSt.title}>시간 선택</Text>

          <View style={pickerSt.drums}>
            {/* 선택 강조 바 */}
            <View pointerEvents="none" style={pickerSt.selBar} />

            <FlatList
              ref={hourRef}
              data={HOURS}
              keyExtractor={String}
              snapToInterval={ITEM_H}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              style={{ height: PICKER_H, width: 80 }}
              contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
                setSelHour(HOURS[Math.max(0, Math.min(idx, HOURS.length - 1))]);
              }}
              renderItem={renderHour}
            />

            <Text style={pickerSt.colon}>:</Text>

            <FlatList
              ref={minRef}
              data={MINUTES}
              keyExtractor={String}
              snapToInterval={ITEM_H}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              style={{ height: PICKER_H, width: 80 }}
              contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
                setSelMinute(MINUTES[Math.max(0, Math.min(idx, MINUTES.length - 1))]);
              }}
              renderItem={renderMinute}
            />
          </View>

          <Text style={pickerSt.preview}>{fmt2(selHour)}:{fmt2(selMinute)}</Text>

          <TouchableOpacity activeOpacity={0.84} onPress={handleConfirm} style={pickerSt.confirmBtn}>
            <Text style={pickerSt.confirmText}>확인</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const pickerSt = StyleSheet.create({
  box: {
    backgroundColor: '#FBFCFA',
    borderRadius: 22,
    paddingBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 22,
    width: 280,
  },
  colon: {
    color: '#287A40',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
    marginHorizontal: 4,
  },
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: '#287A40',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    marginBottom: 6,
    marginTop: 16,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  dimText: {
    color: '#C4CBCA',
    fontSize: 17,
    fontWeight: '700',
  },
  drums: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  item: {
    alignItems: 'center',
    height: ITEM_H,
    justifyContent: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    flex: 1,
    justifyContent: 'center',
  },
  preview: {
    color: '#287A40',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 8,
    textAlign: 'center',
  },
  selBar: {
    backgroundColor: '#E9F4E7',
    borderColor: '#287A40',
    borderRadius: 12,
    borderWidth: 2,
    height: ITEM_H,
    left: 0,
    position: 'absolute',
    right: 0,
    top: ITEM_H * 2,
  },
  selText: {
    color: '#287A40',
    fontSize: 22,
    fontWeight: '900',
  },
  title: {
    color: '#151D17',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 14,
    textAlign: 'center',
  },
});

// ─── 메인 화면 ─────────────────────────────────────────────────────────────
export default function RoutineSettingScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const params = useLocalSearchParams<RouteParams>();
  const selectedRoutinesParam = getFirstParam(params.selectedRoutines);
  const selectedRoutines = useMemo(
    () => parseRoutines(selectedRoutinesParam),
    [selectedRoutinesParam]
  );
  const representativeRoutine = selectedRoutines[0];
  const [selectedPeriod, setSelectedPeriod] = useState<RoutinePeriodKey>('daily');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState('08:00'); // HH:MM 24h 형식
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const addedTasks = selectedRoutines.map((routine) => ({
        id: routine.id,
        taskName: routine.title,
        description: routine.description,
        icon: routine.icon,
        space: routine.spaceKey,
        estimatedMinutes: routine.minutes,
        frequency: selectedPeriod,
        // 각 태스크에 알림 시간 개별 저장 — 스케줄러가 태스크별로 발송에 활용
        notificationTime: reminderEnabled ? selectedTime : undefined,
      }));
      const totalMinutesAfter = addedTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
      await editRoutine({ addedTasks, removedTasks: [], totalMinutesBefore: 0, totalMinutesAfter });

      await saveNotificationPreference(reminderEnabled, selectedTime);
      if (reminderEnabled && selectedTime) {
        const granted = await requestNotificationPermission();
        if (granted) await scheduleCleaningReminder(selectedTime);
      }

      router.replace('/home');
    } catch {
      Alert.alert('오류', '루틴 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 웹에서 <input type="time"> 변경 이벤트 핸들러
  const handleWebTimeChange = (e: any) => {
    if (e?.target?.value) setSelectedTime(e.target.value);
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
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
            activeOpacity={0.72}
            onPress={safeBack}
            style={styles.backButton}
          >
            <Ionicons color={colors.text} name="chevron-back" size={23} />
          </TouchableOpacity>
          <Text style={styles.title}>루틴 설정</Text>
        </View>

        {representativeRoutine ? (
          <>
            <View style={styles.routineCard}>
              <Ionicons color="#A7603B" name={representativeRoutine.icon} size={28} />
              <View style={styles.routineInfo}>
                <Text style={styles.routineTitle}>
                  {selectedRoutines.length > 1
                    ? `${representativeRoutine.title} 외 ${selectedRoutines.length - 1}개`
                    : representativeRoutine.title}
                </Text>
                <Text style={styles.routineMeta}>{representativeRoutine.meta}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>얼마나 자주 할까요?</Text>
            <View style={styles.periodGrid}>
              {routinePeriodOptions.map((period) => {
                const selected = selectedPeriod === period.key;
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    key={period.key}
                    onPress={() => setSelectedPeriod(period.key)}
                    style={[styles.periodCard, selected && styles.periodCardSelected]}
                  >
                    <Text style={styles.periodEmoji}>{period.emoji}</Text>
                    <Text style={styles.periodLabel}>{period.label}</Text>
                    <Text style={styles.periodRange}>{period.range}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>알림</Text>
            <View style={styles.notificationCard}>
              <View>
                <Text style={styles.notificationTitle}>알림 받기</Text>
                <Text style={styles.notificationText}>
                  {routinePeriodOptions.find((p) => p.key === selectedPeriod)?.label} 루틴 추가 시 알려드려요
                </Text>
              </View>
              <Switch
                onValueChange={setReminderEnabled}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#CDD6CE', true: colors.green }}
                value={reminderEnabled}
              />
            </View>

            {reminderEnabled && (
              <View style={styles.timeCard}>
                <Text style={styles.timeTitle}>몇 시에 알려드릴까요?</Text>

                {Platform.OS === 'web' ? (
                  // ── 웹: 브라우저 기본 time input ─────────────────────────────
                  <View style={styles.webTimeRow}>
                    <View style={styles.webTimeDisplay}>
                      <Ionicons color={colors.green} name="time-outline" size={20} />
                      <Text style={styles.webTimeLabel}>{selectedTime}</Text>
                    </View>
                    {React.createElement('input', {
                      type: 'time',
                      value: selectedTime,
                      onChange: handleWebTimeChange,
                      style: {
                        border: `2px solid ${colors.green}`,
                        borderRadius: '14px',
                        backgroundColor: '#E9F4E7',
                        color: colors.green,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '18px',
                        fontWeight: '900',
                        letterSpacing: '1px',
                        outline: 'none',
                        padding: '10px 16px',
                        flex: 1,
                      },
                    })}
                  </View>
                ) : (
                  // ── 네이티브: 드럼롤 모달 ─────────────────────────────────
                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={() => setShowTimePicker(true)}
                    style={styles.nativeTimeBtn}
                  >
                    <Ionicons color={colors.green} name="time-outline" size={20} />
                    <Text style={styles.nativeTimeBtnText}>{selectedTime}</Text>
                    <Ionicons color={colors.green} name="chevron-down" size={18} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.86}
              disabled={saving}
              onPress={handleFinish}
              style={styles.primaryButton}
            >
              {saving ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.primaryButtonText}>추가할게요</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.78}
              disabled={saving}
              onPress={() => router.replace('/home')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>나중에 설정할게요</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>설정할 루틴이 없어요.</Text>
          </View>
        )}
      </ScrollView>

      {showTimePicker && Platform.OS !== 'web' && (
        <NativeTimePickerModal
          value={selectedTime}
          onConfirm={setSelectedTime}
          onClose={() => setShowTimePicker(false)}
        />
      )}

      <RoutineBottomNav active="home" />
    </SafeAreaView>
  );
}

const colors = {
  background: '#FBFCFA',
  border: '#DDE2DA',
  green: '#287A40',
  greenDark: '#143B22',
  greenSoft: '#E9F4E7',
  muted: '#68766B',
  text: '#151D17',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: '#F7F8F4',
    borderColor: colors.border,
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 140,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingTop: 20,
  },
  nativeTimeBtn: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderColor: '#B9DEC4',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  nativeTimeBtnText: {
    color: colors.green,
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  notificationCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 18,
  },
  notificationText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 8,
  },
  notificationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  periodCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 124,
  },
  periodCardSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
    borderWidth: 2,
  },
  periodEmoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  periodGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  periodLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 8,
  },
  periodRange: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 9,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.border,
    borderColor: '#B9DEC4',
    borderRadius: 12,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginTop: 22,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
  },
  routineCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginTop: 22,
    minHeight: 84,
    paddingHorizontal: 22,
  },
  routineInfo: {
    flex: 1,
  },
  routineMeta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 6,
  },
  routineTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  scrollContent: {
    paddingBottom: 104,
    paddingHorizontal: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#B8BDB8',
    borderRadius: 12,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 24,
  },
  timeCard: {
    backgroundColor: '#F8FCF9',
    borderColor: '#B9DEC4',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  timeTitle: {
    color: colors.green,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0,
  },
  webTimeDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  webTimeLabel: {
    color: colors.green,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  webTimeRow: {
    gap: 10,
    marginTop: 14,
  },
});
