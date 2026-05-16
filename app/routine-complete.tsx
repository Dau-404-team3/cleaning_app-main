import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedFlame } from '../components/AnimatedFlame';
import { completeTask, getTodayRoutine, getWeeklyStats } from '../src/api/routine';

const confetti = [
  { color: '#F4CF23', rotate: '42deg', x: -176, y: -146 },
  { color: '#56B6B3', rotate: '-31deg', x: -148, y: -76 },
  { color: '#F88C76', rotate: '49deg', x: -122, y: 20 },
  { color: '#F6A46F', rotate: '31deg', x: -76, y: -172 },
  { color: '#D8E7CF', rotate: '-43deg', x: -22, y: -204 },
  { color: '#8DCB8B', rotate: '64deg', x: 72, y: -168 },
  { color: '#F8C26A', rotate: '48deg', x: 154, y: -92 },
  { color: '#78C9AD', rotate: '-28deg', x: 182, y: -162 },
  { color: '#F88C76', rotate: '48deg', x: 166, y: 14 },
  { color: '#F4CF23', rotate: '-37deg', x: 198, y: -40 },
  { color: '#7BBC6B', rotate: '19deg', x: -196, y: -28 },
  { color: '#F2A0B6', rotate: '-55deg', x: 116, y: -218 },
  { color: '#F4CF23', rotate: '81deg', x: -48, y: 70 },
  { color: '#78C9AD', rotate: '-74deg', x: 42, y: 76 },
  { color: '#F6A46F', rotate: '128deg', x: -210, y: -112 },
  { color: '#8DCB8B', rotate: '-112deg', x: 214, y: -112 },
];

const encouragementMessages = [
  '오늘도 해냈어요. 이런 하루가 당신을 더 단단하게 만들어요',
  '작은 정리를 끝낸 당신, 충분히 멋져요',
  '완벽하지 않아도 괜찮아요. 오늘의 한 걸음이 중요해요',
  '꾸준히 해내는 힘이 벌써 쌓이고 있어요',
  '지금처럼 조금씩 하면 분명 더 편한 내일이 와요',
];

type RoutineRouteParams = {
  completedCount?: string;
  routineId?: string;
  routineMeta?: string;
  routineSpace?: string;
  routineTitle?: string;
  totalRoutineCount?: string;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function ConfettiBurst({ active }: { active: boolean }) {
  const particles = useRef(confetti.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return;
    particles.forEach((p) => p.setValue(0));
    Animated.stagger(
      34,
      particles.map((p) =>
        Animated.timing(p, {
          toValue: 1,
          duration: 1280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [active, particles]);

  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      <View style={styles.confettiOrigin}>
        {confetti.map((piece, index) => {
          const progress = particles[index];
          const opacity = progress.interpolate({ inputRange: [0, 0.08, 0.82, 1], outputRange: [0, 1, 0.96, 0] });
          const scale = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.35, 1.22, 0.9] });
          const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.x] });
          const translateY = progress.interpolate({ inputRange: [0, 0.68, 1], outputRange: [0, piece.y, piece.y + 42] });
          const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', piece.rotate] });
          return (
            <Animated.View
              key={`${piece.x}-${piece.y}`}
              style={[
                styles.confettiPiece,
                { backgroundColor: piece.color, opacity, width: index % 3 === 0 ? 18 : 13, transform: [{ translateX }, { translateY }, { rotate }, { scale }] },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function RoutineCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<RoutineRouteParams>();
  const progress = useRef(new Animated.Value(0)).current;
  const [burstActive, setBurstActive] = useState(false);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const [streak, setStreak] = useState(0);
  const [freshCompleted, setFreshCompleted] = useState<number | null>(null);
  const [freshTotal, setFreshTotal] = useState<number | null>(null);

  const routineId = getFirstParam(params.routineId) ?? '';
  const routineTitle = getFirstParam(params.routineTitle) ?? '';
  const routineSpace = getFirstParam(params.routineSpace) ?? '';
  const completedCountParam = getPositiveNumber(getFirstParam(params.completedCount), 1);
  const totalRoutineCountParam = getPositiveNumber(getFirstParam(params.totalRoutineCount), 1);

  const displayCompleted = freshCompleted ?? completedCountParam;
  const displayTotal = freshTotal ?? totalRoutineCountParam;
  const progressRatio = displayTotal > 0 ? displayCompleted / displayTotal : 0;

  const encouragementMessage = useMemo(
    () => encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)],
    []
  );

  useEffect(() => {
    setBurstActive(true);

    async function finish() {
      try {
        if (routineId) {
          await completeTask(routineId, routineSpace, routineTitle);
        }
        const [routineData, statsData] = await Promise.all([
          getTodayRoutine(),
          getWeeklyStats(),
        ]);
        setFreshCompleted(routineData.completedCount);
        setFreshTotal(routineData.tasks.length);
        setStreak(statsData.currentStreak);
      } catch {
        // 실패 시 params 값으로 표시 유지
      }
    }
    finish();
  }, []);

  useEffect(() => {
    if (progressTrackWidth === 0) return undefined;
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.delay(260),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [progress, progressTrackWidth]);

  const progressWidth = useMemo(
    () => progress.interpolate({ inputRange: [0, 1], outputRange: [0, progressTrackWidth * progressRatio] }),
    [progress, progressRatio, progressTrackWidth]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ConfettiBurst active={burstActive} />
          <View style={styles.checkCircle}>
            <Ionicons color="#FFFFFF" name="checkmark" size={92} />
          </View>
          <Text style={styles.title}>완료했어요!</Text>
          <Text style={styles.subtitle}>{routineTitle}</Text>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakTitleRow}>
            <AnimatedFlame size={34} />
            <Text style={styles.streakTitle}>{streak}일 연속</Text>
          </View>
          <Text style={styles.streakCaption}>{encouragementMessage}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>오늘 진척도</Text>
            <Text style={styles.progressCount}>{displayCompleted} / {displayTotal} 완료</Text>
          </View>
          <View
            onLayout={(e) => setProgressTrackWidth(e.nativeEvent.layout.width)}
            style={styles.progressTrack}
          >
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => router.replace('/home')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>다음 루틴 하기</Text>
          <Ionicons color="#FFFFFF" name="chevron-forward" size={25} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.76}
          onPress={() => router.replace('/home')}
          style={styles.textButton}
        >
          <Text style={styles.textButtonText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#FBFCFA',
  border: '#E4E8E2',
  green: '#4FA85A',
  greenDark: '#143B22',
  greenButton: '#26743E',
  greenSoft: '#EEF7EC',
  muted: '#536357',
  text: '#102117',
};

const styles = StyleSheet.create({
  checkCircle: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 70,
    height: 140,
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#1B5A2C',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    width: 140,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
    zIndex: 4,
  },
  confettiOrigin: {
    alignItems: 'center',
    height: 1,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: 118,
    width: 1,
  },
  confettiPiece: {
    borderRadius: 2,
    height: 10,
    position: 'absolute',
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    minHeight: 415,
    overflow: 'visible',
    paddingTop: 130,
    position: 'relative',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.greenButton,
    borderRadius: 16,
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    marginTop: 34,
    width: '86%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0,
    marginRight: 8,
  },
  progressCard: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '86%',
  },
  progressCount: {
    color: colors.greenDark,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  progressFill: {
    backgroundColor: colors.greenButton,
    borderRadius: 8,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  progressTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  progressTrack: {
    backgroundColor: '#E9F2E8',
    borderRadius: 8,
    height: 9,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  streakCaption: {
    color: colors.greenDark,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
    marginTop: 10,
  },
  streakCard: {
    alignSelf: 'center',
    backgroundColor: colors.greenSoft,
    borderRadius: 18,
    marginBottom: 28,
    minHeight: 128,
    paddingHorizontal: 34,
    paddingVertical: 24,
    width: '75%',
  },
  streakTitle: {
    color: colors.greenDark,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  streakTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 19,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: 14,
  },
  textButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginTop: 14,
  },
  textButtonText: {
    color: '#4F8158',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 42,
  },
});
