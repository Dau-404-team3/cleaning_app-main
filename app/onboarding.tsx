import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView, ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { submitOnboarding } from '../src/api/onboarding';
import type { OnboardingAnswers } from '../src/types/onboarding';

type SurveyOption = {
  emoji: string;
  text: string;
};

type SurveyQuestion = {
  id: number;
  maxSelections?: number;
  multi?: boolean;
  options: SurveyOption[];
  question: string;
};

const questions: SurveyQuestion[] = [
  {
    id: 1,
    question: 'Q1. 지금 어떤 환경에서 생활하고 계세요?',
    options: [
      { emoji: '🏠', text: '혼자 살고 있어요' },
      { emoji: '👨‍👩‍👧', text: '가족과 함께 살고 있어요' },
      { emoji: '👥', text: '친구나 지인과 함께 살고 있어요' },
      { emoji: '🏢', text: '기숙사나 고시원에 살고 있어요' },
    ],
  },
  {
    id: 2,
    question: 'Q2. 집이 어떻게 생겼나요?',
    options: [
      { emoji: '🚪', text: '원룸' },
      { emoji: '🏠', text: '투룸/쓰리룸' },
      { emoji: '🏢', text: '오피스텔' },
      { emoji: '📦', text: '기타' },
    ],
  },
  {
    id: 3,
    question: 'Q3. 함께 사는 반려동물이 있나요?',
    options: [
      { emoji: '🐕', text: '강아지가 있어요' },
      { emoji: '🐈', text: '고양이가 있어요' },
      { emoji: '🐹', text: '다른 동물이 있어요' },
      { emoji: '❌', text: '없어요' },
    ],
  },
  {
    id: 4,
    question: 'Q4. 집에서 요리를 얼마나 자주 하나요?',
    options: [
      { emoji: '🍔', text: '거의 안 해요' },
      { emoji: '🍳', text: '가끔 해요 (주 1~2회)' },
      { emoji: '🥘', text: '자주 해요 (주 3회 이상)' },
      { emoji: '👨‍🍳', text: '거의 매일 해요' },
    ],
  },
  {
    id: 5,
    question: 'Q5. 평소에 청소를 얼마나 자주 하나요?',
    options: [
      { emoji: '😅', text: '거의 안 해요' },
      { emoji: '🧹', text: '주 1~2회 정도' },
      { emoji: '✨', text: '주 3~5회' },
      { emoji: '💪', text: '거의 매일' },
    ],
  },
  {
    id: 6,
    question: 'Q6. 청소할 때 어떤 스타일인가요?',
    options: [
      { emoji: '🌊', text: '한 번에 몰아서 싹 다 해요 (평소에 모아뒀다가 한 번에 처리하는 편)' },
      { emoji: '⚡', text: '매일 조금씩 틈틈이 해요 (조금씩 자주 하는 편)' },
    ],
  },
  {
    id: 7,
    question: 'Q7. 집안일을 미루는 편인가요?',
    options: [
      { emoji: '😊', text: '거의 안 미뤄요' },
      { emoji: '😐', text: '가끔 미루긴 해요' },
      { emoji: '😓', text: '자주 미뤄요' },
      { emoji: '😪', text: '많이 미뤄요' },
    ],
  },
  {
    id: 8,
    question: 'Q8. 집안일을 할 때 가장 힘든 게 뭔가요?',
    maxSelections: 2,
    multi: true,
    options: [
      { emoji: '🤔', text: '어디서부터 시작해야 할지 모르겠어요' },
      { emoji: '⏰', text: '자꾸 미루게 돼요' },
      { emoji: '📉', text: '내 생활 패턴에 맞는 방법을 모르겠어요' },
      { emoji: '🧼', text: '특정 공간 청소법을 잘 모르겠어요' },
      { emoji: '😥', text: '해도 티가 안 나서 의욕이 안 생겨요' },
      { emoji: '✅', text: '딱히 어려움은 없어요' },
    ],
  },
];

function mapToApiAnswers(raw: Record<number, string[]>): OnboardingAnswers {
  const q1 = raw[1]?.[0] ?? '';
  const q3 = raw[3]?.[0] ?? '';

  const houseTypeMap: Record<string, OnboardingAnswers['houseType']> = {
    '혼자 살고 있어요': 'solo',
    '가족과 함께 살고 있어요': 'family',
    '친구나 지인과 함께 살고 있어요': 'shared',
    '기숙사나 고시원에 살고 있어요': 'dorm',
  };
  const roomTypeMap: Record<string, OnboardingAnswers['roomType']> = {
    '원룸': 'oneroom',
    '투룸/쓰리룸': 'multiroom',
    '오피스텔': 'officetel',
    '기타': 'other',
  };
  const cookingMap: Record<string, OnboardingAnswers['cookingFrequency']> = {
    '거의 안 해요': 'rarely',
    '가끔 해요 (주 1~2회)': 'sometimes',
    '자주 해요 (주 3회 이상)': 'often',
    '거의 매일 해요': 'daily',
  };
  const cleaningFreqMap: Record<string, OnboardingAnswers['cleaningFrequency']> = {
    '거의 안 해요': 1,
    '주 1~2회 정도': 2,
    '주 3~5회': 3,
    '거의 매일': 4,
  };
  const petTypeMap: Record<string, OnboardingAnswers['petType']> = {
    '강아지가 있어요': 'dog',
    '고양이가 있어요': 'cat',
    '다른 동물이 있어요': 'other',
  };
  const procrastinationOptions = ['거의 안 미뤄요', '가끔 미루긴 해요', '자주 미뤄요', '많이 미뤄요'];
  const procIdx = procrastinationOptions.indexOf(raw[7]?.[0] ?? '');

  const hasPet = q3 !== '없어요' && q3 !== '';

  return {
    houseType: houseTypeMap[q1] ?? null,
    roomType: roomTypeMap[raw[2]?.[0] ?? ''] ?? null,
    hasPet,
    petType: hasPet ? (petTypeMap[q3] ?? null) : null,
    cookingFrequency: cookingMap[raw[4]?.[0] ?? ''] ?? null,
    cleaningFrequency: cleaningFreqMap[raw[5]?.[0] ?? ''] ?? null,
    cleaningStyle: raw[6]?.[0]?.includes('한 번에') ? 1 : raw[6]?.[0] ? 2 : null,
    procrastination: procIdx >= 0 ? ((procIdx + 1) as 1 | 2 | 3 | 4) : null,
    difficulties: raw[8] ?? [],
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleSelect = (option: string) => {
    if (current.multi) {
      setSelected((prev) => {
        if (prev.includes(option)) {
          return prev.filter((item) => item !== option);
        }

        if (current.maxSelections && prev.length >= current.maxSelections) {
          return prev;
        }

        return [...prev, option];
      });
    } else {
      setSelected([option]);
    }
  };

  const handleNext = async () => {
    const nextAnswers = { ...answers, [current.id]: selected };
    setAnswers(nextAnswers);

    if (step < questions.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setSelected(nextAnswers[questions[nextStep].id] ?? []);
    } else {
      setSubmitting(true);
      try {
        const apiAnswers = mapToApiAnswers(nextAnswers);
        const res = await submitOnboarding(apiAnswers);
        router.push({
          pathname: '/result',
          params: { personality: JSON.stringify(res.personality) },
        });
      } catch {
        Alert.alert('오류', '루틴 생성에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      const nextAnswers = { ...answers, [current.id]: selected };
      const prevStep = step - 1;

      setAnswers(nextAnswers);
      setStep(prevStep);
      setSelected(nextAnswers[questions[prevStep].id] ?? []);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>내 청소 스타일을{'\n'}알아볼게요</Text>
        <Text style={styles.heroSub}>잠깐의 설문으로 딱 맞는 루틴을 만들어 드릴게요.</Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>{step + 1}단계</Text>
          <Text style={styles.progressLabel}>{step + 1} / {questions.length}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{current.question}</Text>
        {current.multi && (
          <Text style={styles.multiHint}>
            {current.maxSelections
              ? `최대 ${current.maxSelections}개까지 선택 가능해요`
              : '복수 선택 가능해요'}
          </Text>
        )}
        <View style={styles.options}>
          {current.options.map((option) => {
            const isSelected = selected.includes(option.text);
            const isDisabled =
              Boolean(current.maxSelections) &&
              !isSelected &&
              selected.length >= Number(current.maxSelections);

            return (
              <TouchableOpacity
                disabled={isDisabled}
                key={option.text}
                onPress={() => handleSelect(option.text)}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                  isDisabled && styles.optionDisabled,
                ]}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.text}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.btnPrev} onPress={handlePrev}>
            <Text style={styles.btnPrevText}>← 이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btnNext, (selected.length === 0 || submitting) && styles.btnDisabled]}
          onPress={handleNext}
          disabled={selected.length === 0 || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnNextText}>
                {step === questions.length - 1 ? '결과 보기 ✓' : '다음 →'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: {
    backgroundColor: '#3B4F3A',
    padding: 28,
    paddingTop: 40,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
  },
  progressWrap: { padding: 16, paddingBottom: 0 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#7A8A76' },
  progressTrack: {
    height: 4,
    backgroundColor: '#C8D5C0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#3B4F3A', borderRadius: 4 },
  body: { flex: 1, padding: 20 },
  question: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E2620',
    marginBottom: 6,
    marginTop: 8,
    lineHeight: 24,
  },
  multiHint: { fontSize: 13, color: '#7A8A76', marginBottom: 14 },
  options: { gap: 8, marginTop: 8 },
  option: {
    borderWidth: 1.5,
    borderColor: '#DDE4D9',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#3B4F3A',
    backgroundColor: '#EBF0E8',
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionText: { fontSize: 14, color: '#4A5548', flex: 1 },
  optionTextSelected: { color: '#3B4F3A', fontWeight: '700' },
  checkmark: { fontSize: 14, color: '#3B4F3A', fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2ED',
  },
  btnPrev: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDE4D9',
  },
  btnPrevText: { fontSize: 14, fontWeight: '700', color: '#4A5548' },
  btnNext: {
    flex: 1,
    backgroundColor: '#3B4F3A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  optionEmoji: { fontSize: 20, marginRight: 10 },
  btnDisabled: { backgroundColor: '#C8D5C0' },
  btnNextText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
