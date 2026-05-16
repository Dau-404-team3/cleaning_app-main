import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type DonutProgressProps = {
  progress: number;
  completed: number;
  total: number;
  label?: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
  segmentCount?: number;
  progressColor?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  percentStyle?: StyleProp<TextStyle>;
};

export function DonutProgress({
  progress,
  completed,
  total,
  label = '오늘 완료',
  subLabel,
  size = 188,
  strokeWidth = 16,
  segmentCount = 72,
  progressColor = '#3B4F3A',
  trackColor = '#DDE7D8',
  style,
  labelStyle,
  percentStyle,
}: DonutProgressProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(clampedProgress * 100);
  const radius = (size - strokeWidth) / 2;
  const segmentLength = (2 * Math.PI * radius) / segmentCount + 1.4;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: clampedProgress,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animatedProgress, clampedProgress]);

  const segments = useMemo(() => {
    return Array.from({ length: segmentCount }, (_, index) => {
      const angle = (360 / segmentCount) * index - 90;
      const radians = (angle * Math.PI) / 180;
      const center = size / 2;

      return {
        angle,
        index,
        left: center + Math.cos(radians) * radius - segmentLength / 2,
        top: center + Math.sin(radians) * radius - strokeWidth / 2,
        threshold: (index + 0.82) / segmentCount,
      };
    });
  }, [radius, segmentCount, segmentLength, size, strokeWidth]);

  return (
    <View
      accessibilityLabel={`${label} ${percentage}%`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: completed }}
      style={[styles.wrap, { height: size, width: size }, style]}
    >
      {segments.map((segment) => (
        <View
          key={`track-${segment.index}`}
          style={[
            styles.segment,
            {
              backgroundColor: trackColor,
              borderRadius: strokeWidth / 2,
              height: strokeWidth,
              left: segment.left,
              top: segment.top,
              transform: [{ rotate: `${segment.angle + 90}deg` }],
              width: segmentLength,
            },
          ]}
        />
      ))}

      {segments.map((segment) => {
        const inputStart = Math.max(0, segment.threshold - 0.035);
        const inputEnd = Math.max(inputStart + 0.001, segment.threshold);
        const opacity = animatedProgress.interpolate({
          inputRange: [inputStart, inputEnd],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });
        const scale = animatedProgress.interpolate({
          inputRange: [inputStart, inputEnd],
          outputRange: [0.76, 1],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={`fill-${segment.index}`}
            style={[
              styles.segment,
              {
                backgroundColor: progressColor,
                borderRadius: strokeWidth / 2,
                height: strokeWidth,
                left: segment.left,
                opacity,
                top: segment.top,
                transform: [{ rotate: `${segment.angle + 90}deg` }, { scale }],
                width: segmentLength,
              },
            ]}
          />
        );
      })}

      <View style={[styles.center, { borderRadius: (size - strokeWidth * 3) / 2 }]}>
        <Text style={[styles.label, labelStyle]}>{label}</Text>
        <Text style={[styles.percent, percentStyle]}>{percentage}%</Text>
        <Text style={styles.subLabel}>{subLabel ?? `${completed} / ${total} 완료`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: '64%',
    justifyContent: 'center',
    shadowColor: '#183118',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    width: '64%',
  },
  label: {
    color: '#7A8A76',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  percent: {
    color: '#1E2620',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 42,
  },
  subLabel: {
    color: '#5C7359',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
});
