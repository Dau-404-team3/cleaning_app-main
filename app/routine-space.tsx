import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '../src/utils/useSafeBack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RoutineIconName,
  RoutineSuggestion,
  getRoutineSpace,
  routineToPayload,
} from '../constants/routines';
import { CatalogueRoutine, GeneratedRoutine, getActiveTaskIds, getSpaceRecommendations } from '../src/api/routine';

type RouteParams = {
  spaceKey?: string;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

type RoutineCardProps = {
  ai?: boolean;
  alreadyAdded?: boolean;
  basis?: string;
  generated?: boolean;
  onToggle: () => void;
  routine: RoutineSuggestion;
  selected: boolean;
};

function RoutineCard({ ai, alreadyAdded, basis, generated, onToggle, routine, selected }: RoutineCardProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={alreadyAdded ? 1 : 0.78}
      onPress={alreadyAdded ? undefined : onToggle}
      style={[
        styles.routineCard,
        ai && styles.aiRoutineCard,
        generated && styles.genRoutineCard,
        selected && styles.routineCardSelected,
        alreadyAdded && styles.routineCardAdded,
      ]}
    >
      <View style={styles.routineCardTop}>
        <View style={styles.routineTitleWrap}>
          <View style={[
            styles.routineIconCircle,
            ai && styles.aiRoutineIconCircle,
            generated && styles.genRoutineIconCircle,
          ]}>
            <Ionicons
              color={generated ? '#1A6570' : ai ? colors.greenDark : colors.muted}
              name={routine.icon}
              size={20}
            />
          </View>
          <View style={styles.routineTitleColumn}>
            <View style={styles.routineTitleRow}>
              <Text numberOfLines={2} style={styles.routineName}>
                {routine.title}
              </Text>
              {alreadyAdded ? (
                <View style={styles.addedBadge}>
                  <Text style={styles.addedBadgeText}>추가됨</Text>
                </View>
              ) : (ai || generated) ? (
                <View style={[styles.aiBadge, generated && styles.genBadge]}>
                  <Text style={[styles.aiBadgeText, generated && styles.genBadgeText]}>
                    {generated ? '맞춤 생성' : 'AI 추천'}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text numberOfLines={2} style={styles.routineDescription}>
              {routine.description}
            </Text>
            {generated && basis ? (
              <View style={styles.basisChip}>
                <Text style={styles.basisChipText}>{basis}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.routineActionWrap}>
          <Text style={styles.routineTime}>{routine.minutes}분</Text>
          {alreadyAdded ? (
            <View style={styles.addedButton}>
              <Ionicons color="#FFFFFF" name="checkmark" size={20} />
            </View>
          ) : (
            <View style={[styles.plusButton, selected && styles.plusButtonSelected]}>
              <Ionicons color="#FFFFFF" name={selected ? 'close' : 'add'} size={22} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoutineSpaceScreen() {
  const router = useRouter();
  const safeBack = useSafeBack();
  const params = useLocalSearchParams<RouteParams>();
  const space = getRoutineSpace(getFirstParam(params.spaceKey));
  const [activeTaskIds, setActiveTaskIds] = useState<Set<string>>(new Set());
  const [aiRecommendationIds, setAiRecommendationIds] = useState<string[] | null>(null);
  const [generatedAiRoutines, setGeneratedAiRoutines] = useState<GeneratedRoutine[]>([]);
  const [serverCatalogueRoutines, setServerCatalogueRoutines] = useState<CatalogueRoutine[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const aiRoutines = useMemo<RoutineSuggestion[]>(() => {
    if (aiRecommendationIds && aiRecommendationIds.length > 0) {
      // 서버 카탈로그 → 로컬 카탈로그 순으로 룩업 (새 해시 ID 우선 지원)
      const lookup = new Map<string, RoutineSuggestion>();
      for (const r of space.routines) lookup.set(r.id, r);
      for (const r of serverCatalogueRoutines) {
        if (!lookup.has(r.id)) {
          lookup.set(r.id, {
            description: r.tip || '',
            icon: 'sparkles-outline' as RoutineIconName,
            id: r.id,
            minutes: r.minutes,
            title: r.title,
          });
        }
      }
      const matched = aiRecommendationIds.map((id) => lookup.get(id)).filter((r): r is RoutineSuggestion => Boolean(r));
      if (matched.length > 0) return matched;
    }
    if (serverCatalogueRoutines.length > 0) return [];
    return space.ai.small;
  }, [aiRecommendationIds, serverCatalogueRoutines, space]);
  const generatedAsSuggestions = useMemo<RoutineSuggestion[]>(() =>
    generatedAiRoutines.map((gen) => ({
      description: gen.basis ? `${gen.basis} 기반 맞춤 루틴이에요.` : `${space.label}에 맞게 생성된 루틴이에요.`,
      icon: 'sparkles' as RoutineIconName,
      id: gen.id,
      minutes: gen.minutes,
      title: gen.title,
    })),
    [generatedAiRoutines, space.label]
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getActiveTaskIds()
      .then((ids) => setActiveTaskIds(new Set(ids)))
      .catch(() => null);
  }, []);

  useEffect(() => {
    const key = getFirstParam(params.spaceKey);
    if (!key) { setAiLoading(false); return; }
    setAiLoading(true);
    getSpaceRecommendations(key)
      .then(({ ids, generated, routines }) => {
        console.log('[맞춤추천] API 응답:', {
          space: key,
          aiRecommendedIds: ids,
          aiRecommendedCount: ids.length,
          generatedRoutines: generated,
          generatedCount: generated.length,
          catalogueCount: routines.length,
        });
        setAiRecommendationIds(ids);
        setGeneratedAiRoutines(generated);
        setServerCatalogueRoutines(routines);
      })
      .catch((err) => {
        console.error('[맞춤추천] API 실패:', {
          space: key,
          error: err?.message ?? err,
          status: err?.response?.status,
        });
      })
      .finally(() => setAiLoading(false));
  }, [params.spaceKey]);

  const allRoutines = useMemo(() => {
    const aiRoutineIds = new Set([
      ...aiRoutines.map((routine) => routine.id),
      ...generatedAiRoutines.map((gen) => gen.id),
    ]);
    // 서버 카탈로그가 있으면 그것을 기본 목록으로 사용, 없으면 로컬 정적 목록 사용
    const baseRoutines: RoutineSuggestion[] = serverCatalogueRoutines.length > 0
      ? serverCatalogueRoutines.map((r) => ({
          description: r.tip || '',
          icon: 'sparkles-outline' as RoutineIconName,
          id: r.id,
          minutes: r.minutes,
          title: r.title,
        }))
      : space.routines;

    return baseRoutines.filter((routine) => !aiRoutineIds.has(routine.id));
  }, [aiRoutines, generatedAiRoutines, serverCatalogueRoutines, space.routines]);
  const routineLookup = useMemo(() => {
    const lookup = new Map<string, RoutineSuggestion>();

    [...aiRoutines, ...generatedAsSuggestions, ...allRoutines].forEach((routine) =>
      lookup.set(routine.id, routine)
    );

    return lookup;
  }, [aiRoutines, generatedAsSuggestions, allRoutines]);
  const selectedCount = selectedIds.size;
  const selectedRoutinePayloads = useMemo(() => {
    return [...selectedIds]
      .map((id) => routineLookup.get(id))
      .filter((routine): routine is RoutineSuggestion => Boolean(routine))
      .map((routine) => routineToPayload(routine, space.label, space.key));
  }, [routineLookup, selectedIds, space.label]);

  const toggleSelect = (routineId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(routineId)) {
        next.delete(routineId);
      } else {
        next.add(routineId);
      }

      return next;
    });
  };

  const handleSubmit = () => {
    if (selectedRoutinePayloads.length === 0) return;

    router.push({
      pathname: '/routine-setting',
      params: { selectedRoutines: JSON.stringify(selectedRoutinePayloads) },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
              <Text style={styles.title}>{space.label} 루틴</Text>
              <Text style={styles.subtitle}>원하는 루틴을 여러 개 골라 추가할 수 있어요</Text>
            </View>
          </View>

          <View style={styles.aiBanner}>
            <View style={styles.aiIconWrap}>
              <Ionicons color={colors.white} name="sparkles" size={20} />
            </View>
            <View style={styles.aiCopy}>
              <Text style={styles.aiTitle}>AI 맞춤 추천</Text>
              <Text style={styles.aiText}>
                성향·생활환경을 분석해 선별하고 직접 생성한 루틴이에요.
              </Text>
            </View>
          </View>

          <View style={[styles.sectionBlock, styles.aiSectionBlock]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={styles.sectionIcon}>
                  <Ionicons color={colors.green} name="sparkles" size={16} />
                </View>
                <Text style={styles.sectionLabel}>AI 맞춤 추천</Text>
              </View>
              <Text style={styles.sectionCount}>{aiRoutines.length + generatedAiRoutines.length}개</Text>
            </View>
            <Text style={styles.sectionDescription}>
              성향·공간에 맞게 고른 루틴과 생활환경 기반으로 새로 만든 루틴이에요.
            </Text>
            {aiLoading ? (
              <ActivityIndicator color={colors.green} size="small" style={{ marginVertical: 16 }} />
            ) : aiRoutines.length === 0 && generatedAiRoutines.length === 0 ? (
              <Text style={styles.emptyText}>
                아직 이 공간의 추천 데이터가 없어요.{'\n'}아래 전체 루틴에서 직접 선택해보세요.
              </Text>
            ) : (
              <View style={styles.routineList}>
                {aiRoutines.map((routine) => (
                  <RoutineCard
                    ai
                    alreadyAdded={activeTaskIds.has(routine.id)}
                    key={`ai-${routine.id}`}
                    onToggle={() => toggleSelect(routine.id)}
                    routine={routine}
                    selected={selectedIds.has(routine.id)}
                  />
                ))}
                {generatedAsSuggestions.map((routine, i) => (
                  <RoutineCard
                    alreadyAdded={activeTaskIds.has(routine.id)}
                    basis={generatedAiRoutines[i]?.basis}
                    generated
                    key={`gen-${routine.id}`}
                    onToggle={() => toggleSelect(routine.id)}
                    routine={routine}
                    selected={selectedIds.has(routine.id)}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={[styles.sectionIcon, styles.sectionIconNeutral]}>
                  <Ionicons color={colors.text} name="list" size={16} />
                </View>
                <Text style={styles.sectionLabel}>전체 루틴</Text>
              </View>
              <Text style={styles.sectionCount}>{allRoutines.length}개</Text>
            </View>
            <Text style={styles.sectionDescription}>이 공간에서 선택할 수 있는 전체 목록이에요.</Text>
            <View style={styles.routineList}>
              {allRoutines.map((routine) => (
                <RoutineCard
                  alreadyAdded={activeTaskIds.has(routine.id)}
                  key={routine.id}
                  onToggle={() => toggleSelect(routine.id)}
                  routine={routine}
                  selected={selectedIds.has(routine.id)}
                />
              ))}
            </View>
          </View>

        </ScrollView>

        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>선택한 루틴 {selectedCount}개</Text>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.86}
            disabled={selectedCount === 0}
            onPress={handleSubmit}
            style={[styles.primaryButton, selectedCount === 0 && styles.primaryButtonDisabled]}
          >
            <Text style={styles.primaryButtonText}>선택한 루틴 추가하기</Text>
            <Ionicons color="#FFFFFF" name="chevron-forward" size={21} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const colors = {
  background: '#FBFCFA',
  border: '#DDE2DA',
  card: '#FFFFFF',
  green: '#2F7A4A',
  greenDark: '#173B24',
  greenSoft: '#EDF8F1',
  muted: '#657067',
  text: '#171F19',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  addedBadge: {
    backgroundColor: '#ECEEE9',
    borderColor: '#C0C5BC',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  addedBadgeText: {
    color: '#6B7368',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
  },
  addedButton: {
    alignItems: 'center',
    backgroundColor: '#9AA89C',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  aiBadge: {
    backgroundColor: colors.greenSoft,
    borderColor: '#B8DFC5',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  aiBadgeText: {
    color: colors.greenDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
  },
  basisChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF7F8',
    borderColor: '#A3D5DC',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  basisChipText: {
    color: '#1A6570',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
  },
  genBadge: {
    backgroundColor: '#EBF7F8',
    borderColor: '#A3D5DC',
  },
  genBadgeText: {
    color: '#1A6570',
  },
  genRoutineCard: {
    backgroundColor: '#EBF7F8',
    borderColor: '#A3D5DC',
  },
  genRoutineIconCircle: {
    backgroundColor: '#C8ECF0',
  },
  aiBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.greenDark,
    borderColor: colors.green,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    marginBottom: 18,
    marginTop: 22,
    padding: 16,
  },
  aiCopy: {
    flex: 1,
  },
  aiIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  aiRoutineCard: {
    backgroundColor: '#F2FBF4',
    borderColor: '#A9DAB7',
  },
  aiRoutineIconCircle: {
    backgroundColor: '#DDF1E3',
  },
  aiSectionBlock: {
    backgroundColor: '#FBFEFC',
    borderColor: '#B8DFC5',
  },
  aiText: {
    color: '#DDEFE1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 5,
  },
  aiTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
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
  bottomBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  customAddButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 5,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  customAddButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  customBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  customCloseButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  customForm: {
    backgroundColor: '#F7FCF8',
    borderColor: '#B8DFC5',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
  },
  customFormBody: {
    padding: 13,
  },
  customFormHeader: {
    alignItems: 'center',
    borderBottomColor: '#D1ECDC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  customFormTitle: {
    color: colors.green,
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  customIcon: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  customInput: {
    backgroundColor: colors.white,
    borderColor: '#CBE5D2',
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    height: 48,
    letterSpacing: 0,
    paddingHorizontal: 13,
  },
  customTrigger: {
    alignItems: 'center',
    backgroundColor: '#F7FCF8',
    borderColor: '#B8DFC5',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  customTriggerCopy: {
    flex: 1,
    gap: 2,
  },
  customTriggerText: {
    color: '#6B9B76',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  customTriggerTitle: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 16,
  },
  header: {
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 20,
  },
  headerCopy: {
    gap: 8,
  },
  keyboardView: {
    flex: 1,
  },
  minuteInput: {
    backgroundColor: colors.white,
    borderColor: '#CBE5D2',
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    height: 38,
    letterSpacing: 0,
    paddingHorizontal: 8,
    textAlign: 'center',
    width: 48,
  },
  minuteInputGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  minuteLabel: {
    color: '#6B9B76',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  plusButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  plusButtonSelected: {
    backgroundColor: '#A7603B',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 15,
    flexDirection: 'row',
    gap: 6,
    height: 56,
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#B8C5B9',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  routineActionWrap: {
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
    minWidth: 46,
  },
  routineCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  routineCardSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  routineCardAdded: {
    backgroundColor: '#F4F5F2',
    borderColor: '#C0C5BC',
    opacity: 0.8,
  },
  routineCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routineDescription: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 5,
  },
  routineIconCircle: {
    alignItems: 'center',
    backgroundColor: '#F0F1ED',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    marginTop: 1,
    width: 34,
  },
  routineList: {
    gap: 10,
  },
  routineName: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 22,
  },
  routineTime: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  routineTitleColumn: {
    flex: 1,
  },
  routineTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routineTitleWrap: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    gap: 11,
  },
  scrollContent: {
    paddingBottom: 30,
    paddingHorizontal: 18,
  },
  sectionBlock: {
    backgroundColor: '#F7F8F4',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    padding: 13,
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginVertical: 14,
    textAlign: 'center',
  },
  sectionDescription: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 18,
    marginBottom: 11,
    marginTop: 7,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  sectionIconNeutral: {
    backgroundColor: '#ECEEE9',
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  sectionTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  selectedCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
  },
  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 30,
  },
});
