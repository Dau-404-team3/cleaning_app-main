import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const questions = [
  {
    id: 1,
    question: '혼자 사시나요, 아니면 함께 사시나요?',
    options: ['? 혼자 살아요', '? 둘이서 함께요', '????? 가족과 함께요', '? 룸메이트와 함께요'],
  },
  {
    id: 2,
    question: '집 크기가 어느 정도 되나요?',
    options: ['?? 원룸 / 오피스텔', '? 방 2개 이하', '? 방 3개 이상', '?? 단독주택 / 빌라'],
  },
  {
    id: 3,
    question: '반려동물을 키우시나요?',
    options: ['? 강아지', '? 고양이', '? 소동물', '? 없어요'],
  },
  {
    id: 4,
    question: '먼지나 알레르기가 있으신가요?',
    options: ['? 먼지 알레르기 있어요', '? 호흡기가 약한 편이에요', '? 특별히 없어요'],
  },
  {
    id: 5,
    question: '지금 청소 빈도가 어느 정도예요?',
    options: ['? 매일 조금씩 해요', '? 주 2~3회 몰아서', '?? 주말 한 번 대청소', '? 생각날 때만...'],
  },
  {
    id: 6,
    question: '화장실 청소는 일주일에 몇 번 하나요?',
    options: ['? 거의 매일', '3?? 주 2~3번', '1?? 일주일에 한 번', '? 기억이 잘...'],
  },
  {
    id: 7,
    question: '청소할 때 가장 신경 쓰이는 게 뭔가요?',
    options: ['? 냄새 / 환기', '? 세균 / 위생', '?? 먼지 / 진드기', '? 곰팡이 / 수분', '? 전체적인 깔끔함'],
    multi: true,
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleSelect = (option: string) => {
    if (current.multi) {
      setSelected(prev =>
        prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
      );
    } else {
      setSelected([option]);
    }
  };

  const handleNext = () => {
    setAnswers([...answers, { question: current.question, answer: selected }]);
    setSelected([]);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      navigation.navigate('Result');
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      setSelected([]);
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
          <Text style={styles.multiHint}>복수 선택 가능해요</Text>
        )}
        <View style={styles.options}>
          {current.options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, selected.includes(option) && styles.optionSelected]}
              onPress={() => handleSelect(option)}
            >
              <Text style={[styles.optionText, selected.includes(option) && styles.optionTextSelected]}>
                {option}
              </Text>
              {selected.includes(option) && <Text style={styles.checkmark}>?</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.btnPrev} onPress={handlePrev}>
            <Text style={styles.btnPrevText}>← 이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btnNext, selected.length === 0 && styles.btnDisabled]}
          onPress={handleNext}
          disabled={selected.length === 0}
        >
          <Text style={styles.btnNextText}>
            {step === questions.length - 1 ? '결과 보기 ?' : '다음 →'}
          </Text>
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
  optionText: { fontSize: 14, color: '#4A5548', flex: 1 },
  optionTextSelected: { color: '#3B4F3A', fontWeight: '700' },
  checkmark: {
    fontSize: 14,
    color: '#3B4F3A',
    fontWeight: '800',
  },
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
  btnDisabled: { backgroundColor: '#C8D5C0' },
  btnNextText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});