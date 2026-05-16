import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { refreshRecommendations } from '../src/api/routine';

type RouteParams = {
  spaceKey?: string;
};

export default function RoutineLoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const sweep = useRef(new Animated.Value(0)).current;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sweepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    sweepLoop.start();

    const navigate = (spaceChanges?: Record<string, string>) => {
      sweepLoop.stop();
      const spaceKey = params.spaceKey;
      if (spaceKey && spaceChanges) {
        // 건너뛰기 기반: 트리거 공간 하나만 하이라이트
        router.replace({
          pathname: '/routine-add',
          params: { highlightSpace: spaceKey, spaceChange: spaceChanges[spaceKey] ?? '' },
        });
      } else if (spaceChanges && Object.keys(spaceChanges).length > 0) {
        // 수동 재생성: 변경된 모든 공간 전달
        router.replace({
          pathname: '/routine-add',
          params: { spaceChanges: JSON.stringify(spaceChanges) },
        });
      } else {
        router.replace({ pathname: '/routine-add', params: {} });
      }
    };

    const timeout = setTimeout(() => {
      sweepLoop.stop();
      navigate();
    }, 30000);

    refreshRecommendations(params.spaceKey)
      .then(({ spaceChanges }) => { clearTimeout(timeout); navigate(spaceChanges); })
      .catch(() => {
        clearTimeout(timeout);
        sweepLoop.stop();
        setFailed(true);
      });

    return () => { sweepLoop.stop(); clearTimeout(timeout); };
  }, []);

  const broomTransform = {
    transform: [
      {
        translateX: sweep.interpolate({
          inputRange: [0, 1],
          outputRange: [-70, 70],
        }),
      },
      {
        rotate: sweep.interpolate({
          inputRange: [0, 1],
          outputRange: ['-14deg', '14deg'],
        }),
      },
    ],
  };

  if (failed) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Text style={styles.failIcon}>⚠️</Text>
          <Text style={styles.title}>추천 업데이트 실패</Text>
          <Text style={styles.subtitle}>네트워크 오류가 발생했어요.{'\n'}기존 추천 루틴으로 이동할게요.</Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => router.replace('/routine-add')}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>계속하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.stage}>
          <Animated.Text style={[styles.broom, broomTransform]}>🧹</Animated.Text>
        </View>
        <Text style={styles.title}>맞춤 루틴 분석 중</Text>
        <Text style={styles.subtitle}>
          {params.spaceKey
            ? `건너뜀 패턴을 분석해\n더 적합한 루틴으로 바꾸고 있어요.`
            : `성향과 생활환경을 분석해\n맞춤 루틴을 준비하고 있어요.`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const colors = {
  background: '#FBFCFA',
  green: '#2F7A4A',
  muted: '#657067',
  text: '#171F19',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  broom: {
    fontSize: 76,
    lineHeight: 88,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  failIcon: {
    fontSize: 52,
    lineHeight: 60,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: colors.green,
    borderRadius: 14,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  stage: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
    width: 240,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 280,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 31,
    marginTop: 18,
    textAlign: 'center',
  },
});
