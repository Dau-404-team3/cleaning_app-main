import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '../src/utils/useSafeBack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { routineSpaces } from '../constants/routines';
import { getCatalogueCounts } from '../src/api/routine';

type RouteParams = {
  highlightSpace?: string;
  spaceChange?: string;
  spaceChanges?: string; // 수동 재생성 시 JSON 직렬화된 Record<string, string>
};

export default function RoutineAddScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const { highlightSpace, spaceChange, spaceChanges: spaceChangesRaw } = useLocalSearchParams<RouteParams>();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 36, 430);
  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap) / 2;

  const [catalogueCounts, setCatalogueCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    getCatalogueCounts().then(setCatalogueCounts).catch(() => null);
  }, []);

  // 수동 재생성 시 전달되는 공간별 변경 문자열 맵
  const spaceChangesMap = useMemo<Record<string, string>>(() => {
    if (!spaceChangesRaw) return {};
    try { return JSON.parse(spaceChangesRaw); } catch { return {}; }
  }, [spaceChangesRaw]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { width: contentWidth }]}
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
          <View style={styles.headerCopy}>
            <Text style={styles.title}>어떤 공간을 정리할까요?</Text>
            <Text style={styles.subtitle}>
              공간을 선택해 루틴을 추가해보세요
            </Text>
          </View>
        </View>

        <View style={styles.aiNote}>
          <Ionicons color={colors.green} name="sparkles" size={19} />
          <Text style={styles.aiNoteText}>
            공간을 선택하면 AI 맞춤 추천, 전체 루틴, 직접 추가 입력칸을 한 번에 볼 수 있어요.
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.78}
          onPress={() => router.push('/routine-loading')}
          style={styles.refreshButton}
        >
          <Ionicons color={colors.green} name="refresh-outline" size={15} />
          <Text style={styles.refreshButtonText}>AI 맞춤 추천 업데이트</Text>
        </TouchableOpacity>

        <View style={styles.spaceGrid}>
          {routineSpaces.map((space) => {
            const singleHighlight = highlightSpace === space.key;
            const multiHighlight = Boolean(spaceChangesMap[space.key]);
            const isHighlighted = singleHighlight || multiHighlight;
            const changeText = singleHighlight
              ? (spaceChange || '추천이 업데이트됐어요')
              : (spaceChangesMap[space.key] || '추천이 업데이트됐어요');
            return (
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.82}
                key={space.key}
                onPress={() =>
                  router.push({
                    pathname: '/routine-space',
                    params: { spaceKey: space.key },
                  })
                }
                style={[styles.spaceCard, { width: cardWidth }, isHighlighted && styles.spaceCardHighlighted]}
              >
                <Text style={styles.spaceEmoji}>{space.icon}</Text>
                <Text style={styles.spaceLabel}>{space.label}</Text>
                {isHighlighted ? (
                  <Text style={styles.spaceMetaHighlighted} numberOfLines={2}>
                    ✨ {changeText}
                  </Text>
                ) : (
                  <Text style={styles.spaceMeta}>추천 {catalogueCounts[space.key] ?? space.routines.length}개</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#FBFCFA',
  border: '#DADBD4',
  card: '#F7F6F0',
  green: '#2F7A4A',
  greenDark: '#173B24',
  greenSoft: '#EEF8F1',
  muted: '#6C7169',
  text: '#191F1A',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  refreshButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderColor: '#B9DDC5',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  refreshButtonText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  aiNote: {
    alignItems: 'flex-start',
    backgroundColor: colors.greenSoft,
    borderColor: '#B9DDC5',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  aiNoteText: {
    color: colors.greenDark,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 21,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#F7F6F0',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 20,
  },
  headerCopy: {
    gap: 12,
  },
  scrollContent: {
    alignSelf: 'center',
    paddingBottom: 32,
  },
  spaceCard: {
    alignItems: 'center',
    aspectRatio: 1.44,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 138,
    paddingHorizontal: 10,
  },
  spaceEmoji: {
    fontSize: 42,
    lineHeight: 48,
    marginBottom: 12,
  },
  spaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  spaceLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  spaceMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 5,
  },
  spaceCardHighlighted: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
    borderWidth: 2,
  },
  spaceMetaHighlighted: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 30,
  },
});
