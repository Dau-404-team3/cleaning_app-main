import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type AnimatedFlameProps = {
  size?: number;
  style?: StyleProp<TextStyle>;
};

const FIRE_PARTICLES = [
  { delay: 0, rotate: '-18deg', size: 13, x: -28, y: -20 },
  { delay: 40, rotate: '14deg', size: 15, x: 26, y: -24 },
  { delay: 90, rotate: '-6deg', size: 11, x: -18, y: -42 },
  { delay: 130, rotate: '22deg', size: 12, x: 34, y: -4 },
  { delay: 180, rotate: '-28deg', size: 10, x: -34, y: 4 },
];

export function AnimatedFlame({ size = 24, style }: AnimatedFlameProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 640,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const translateY = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });
  const rotate = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-3deg', '5deg', '-2deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.flame,
        {
          fontSize: size,
          lineHeight: size + 4,
          transform: [{ translateY }, { rotate }, { scale }],
        },
        style,
      ]}
    >
      🔥
    </Animated.Text>
  );
}

type FlameBurstProps = {
  style?: StyleProp<ViewStyle>;
};

export function FlameBurst({ style }: FlameBurstProps) {
  const particles = useRef(FIRE_PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    particles.forEach((particle) => particle.setValue(0));

    Animated.stagger(
      42,
      particles.map((particle, index) =>
        Animated.sequence([
          Animated.delay(FIRE_PARTICLES[index].delay),
          Animated.timing(particle, {
            toValue: 1,
            duration: 720,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, [particles]);

  return (
    <View pointerEvents="none" style={[styles.burst, style]}>
      {FIRE_PARTICLES.map((particle, index) => {
        const progress = particles[index];
        const opacity = progress.interpolate({
          inputRange: [0, 0.18, 0.72, 1],
          outputRange: [0, 1, 0.82, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.28, 1],
          outputRange: [0.54, 1, 0.28],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.x],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.y],
        });

        return (
          <Animated.Text
            key={`${particle.x}-${particle.y}`}
            style={[
              styles.particle,
              {
                fontSize: particle.size,
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate: particle.rotate },
                  { scale },
                ],
              },
            ]}
          >
            🔥
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  burst: {
    alignItems: 'center',
    height: 1,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: '50%',
    width: 1,
  },
  flame: {
    textShadowColor: 'rgba(255, 155, 60, 0.46)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  particle: {
    position: 'absolute',
    textShadowColor: 'rgba(255, 175, 74, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
