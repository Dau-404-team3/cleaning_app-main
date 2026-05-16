//필요한 도구 가져오기 
//useEffect: 화면이 켜졌을 때 자동으로 실행할 일을 적는 곳
import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        navigation.navigate('Onboarding'); //Onboarding 화면으로 이동해라
      }, 1500);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.emoji}>🧹</Text>
        <Text style={styles.title}>쓱싹</Text>
        <Text style={styles.sub}>나만의 청소 루틴 파트너</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B4F3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
});