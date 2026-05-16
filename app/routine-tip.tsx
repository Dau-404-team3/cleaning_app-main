import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '../src/utils/useSafeBack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutineBottomNav } from '../components/RoutineBottomNav';
import { getTaskGuide } from '../src/api/routine';
import type { TaskGuide } from '../src/types/routine';

type RoutineRouteParams = {
  completedCount?: string;
  isCompleted?: string;
  isSkipped?: string;
  routineIcon?: string;
  routineId?: string;
  routineMeta?: string;
  routineSpace?: string;
  routineTitle?: string;
  totalRoutineCount?: string;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function RoutineTipScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const params = useLocalSearchParams<RoutineRouteParams>();
  const completedCount = getFirstParam(params.completedCount);
  const isCompleted = getFirstParam(params.isCompleted) === 'true';
  const isSkipped = getFirstParam(params.isSkipped) === 'true';
  const routineId = getFirstParam(params.routineId);
  const routineIcon = getFirstParam(params.routineIcon) ?? 'sparkles-outline';
  const routineMeta = getFirstParam(params.routineMeta) ?? '';
  const routineSpace = getFirstParam(params.routineSpace) ?? '';
  const routineTitle = getFirstParam(params.routineTitle) ?? '';
  const totalRoutineCount = getFirstParam(params.totalRoutineCount);

  const [guide, setGuide] = useState<TaskGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(true);

  useEffect(() => {
    if (!routineTitle) {
      setGuideLoading(false);
      return;
    }
    getTaskGuide(routineTitle, routineSpace || undefined)
      .then(setGuide)
      .catch(() => {})
      .finally(() => setGuideLoading(false));
  }, [routineTitle, routineSpace]);

  const forwardParams = {
    ...(completedCount != null ? { completedCount } : {}),
    ...(routineId ? { routineId } : {}),
    routineMeta,
    routineSpace,
    routineTitle,
    ...(totalRoutineCount != null ? { totalRoutineCount } : {}),
  };

  const handleStopCleaning = () => {
    router.replace('/home');
  };

  const howToSteps = guide?.howTo ?? [];
  const bonusTip = guide?.tip ?? null;
  const tipEmoji = guide?.tipEmoji ?? '💡';

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
            <Ionicons color={colors.text} name="chevron-back" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{routineTitle}</Text>
        </View>

        <View style={styles.metaPill}>
          <Ionicons
            color="#8D8982"
            name={routineIcon as keyof typeof Ionicons.glyphMap}
            size={22}
          />
          <Text style={styles.metaPillText}>{routineMeta}</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>이렇게 하면 더 쉬워요 💡</Text>
          <Text style={styles.heroCaption}>청소 전에 한번 읽어보세요</Text>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipHeaderIcon}>✨</Text>
            <Text style={styles.tipHeaderText}>청소 순서</Text>
          </View>

          {guideLoading ? (
            <ActivityIndicator color={colors.green} style={styles.loader} />
          ) : howToSteps.length > 0 ? (
            howToSteps.map((step, index) => (
              <View
                key={step.step}
                style={[styles.tipRow, index === howToSteps.length - 1 && styles.tipRowLast]}
              >
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step.step}</Text>
                </View>
                <Text style={styles.tipText}>{step.description}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.tipText, styles.tipFallback]}>
              필요한 도구를 미리 준비하고 청소를 시작해보세요.
            </Text>
          )}

          {bonusTip && !guideLoading && (
            <View style={styles.bonusTip}>
              <Text style={styles.bonusTipIcon}>{tipEmoji}</Text>
              <Text style={styles.bonusTipText}>{bonusTip}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={isCompleted || isSkipped ? 1 : 0.86}
          onPress={() => {
            if (isSkipped || isCompleted) return;
            router.replace({ pathname: '/routine-complete', params: forwardParams });
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {isCompleted || isSkipped ? '이미 완료했어요' : '청소시작'}
          </Text>
          <Ionicons
            color={colors.text}
            name={isCompleted || isSkipped ? 'checkmark-done' : 'checkmark'}
            size={18}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.76}
          onPress={handleStopCleaning}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>청소 그만하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <RoutineBottomNav active="home" />
    </SafeAreaView>
  );
}

const colors = {
  background: '#FBFCFA',
  border: '#D6D4CA',
  card: '#F8F7F1',
  green: '#28733E',
  greenSoft: '#E6F2EB',
  muted: '#565E55',
  text: '#101A13',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: '#F6F5EF',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  bonusTip: {
    alignItems: 'flex-start',
    backgroundColor: colors.greenSoft,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    padding: 14,
  },
  bonusTipIcon: {
    fontSize: 18,
    lineHeight: 24,
  },
  bonusTipText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroCopy: {
    marginTop: 30,
    paddingHorizontal: 18,
  },
  heroCaption: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: 12,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 40,
  },
  loader: {
    marginVertical: 20,
  },
  metaPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.greenSoft,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 7,
    marginLeft: 18,
    marginTop: 28,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  metaPillText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#BFC3BA',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    marginHorizontal: 18,
    marginTop: 16,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
    marginRight: 3,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#BFC3BA',
    borderRadius: 13,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginHorizontal: 18,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginTop: 1,
    minWidth: 24,
    paddingHorizontal: 6,
  },
  stepBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  tipCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 18,
    marginTop: 32,
    paddingHorizontal: 21,
    paddingVertical: 22,
  },
  tipFallback: {
    paddingVertical: 8,
  },
  tipHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tipHeaderIcon: {
    fontSize: 19,
  },
  tipHeaderText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  tipRow: {
    borderBottomColor: '#DEDDD5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
  },
  tipRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  tipText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 23,
  },
});
