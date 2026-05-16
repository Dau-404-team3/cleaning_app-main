import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function RoutineDetail() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/routine-tip');
  }, [router]);

  return <SafeAreaView style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FBFCFA',
    flex: 1,
  },
});
