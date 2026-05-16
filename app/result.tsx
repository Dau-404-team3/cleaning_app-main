import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import type { PersonalityResult } from '../src/types/onboarding';

function parsePersonality(raw: string | string[] | undefined): PersonalityResult | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  try {
    return JSON.parse(value) as PersonalityResult;
  } catch {
    return null;
  }
}

export default function ResultScreen() {
  const router = useRouter();
  const { setOnboarded } = useAuthStore();
  const params = useLocalSearchParams<{ personality?: string }>();
  const personality = useMemo(() => parsePersonality(params.personality), [params.personality]);

  if (!personality) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#4A5548', fontSize: 15 }}>결과를 불러오지 못했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.typeLabel}>당신의 청소 유형</Text>
          <Text style={styles.typeName}>{personality.title}</Text>
          <Text style={styles.typeDesc}>{personality.description}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.recommendation}>{personality.recommendation}</Text>

          <View style={styles.recommendCard}>
            <Text style={styles.cardTitle}>이렇게 청소해보세요</Text>
            {personality.tips.map((tip, index) => (
              <View key={index} style={styles.methodRow}>
                <View style={styles.methodNumber}>
                  <Text style={styles.methodNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.methodText}>{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => { setOnboarded(true); router.replace('/routine-add'); }}
            style={styles.startBtn}
          >
            <Text style={styles.startBtnText}>맞춤 루틴 시작하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 20,
  },
  cardTitle: {
    color: '#1E2620',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 16,
  },
  container: {
    backgroundColor: '#F7F8F4',
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#3B4F3A',
    padding: 28,
    paddingTop: 52,
  },
  methodNumber: {
    alignItems: 'center',
    backgroundColor: '#EBF0E8',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginTop: 1,
    width: 28,
  },
  methodNumberText: {
    color: '#3B4F3A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  methodText: {
    color: '#4A5548',
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 23,
  },
  recommendation: {
    fontSize: 14,
    color: '#4A5548',
    lineHeight: 22,
    marginBottom: 16,
  },
  recommendCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE4D9',
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 24,
    padding: 18,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  startBtn: {
    alignItems: 'center',
    backgroundColor: '#3B4F3A',
    borderRadius: 14,
    paddingVertical: 20,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  tag: {
    backgroundColor: '#EBF0E8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagText: {
    color: '#5C7359',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeDesc: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 23,
    marginTop: 10,
    textAlign: 'center',
  },
  typeLabel: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8,
  },
  typeName: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 39,
    textAlign: 'center',
  },
});
