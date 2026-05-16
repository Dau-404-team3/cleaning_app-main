import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NotificationItem } from '../src/api/notification';

type Props = {
  notification: NotificationItem;
  onDismiss: () => void;
  onOpenInbox: () => void;
};

const AUTO_DISMISS_MS = 4500;

export function NotificationPopup({ notification, onDismiss, onOpenInbox }: Props) {
  const translateY = useRef(new Animated.Value(-130)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(1)).current;
  const dismissed = useRef(false);

  const dismiss = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    Animated.parallel([
      Animated.timing(translateY, { toValue: -130, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: false }),
    ]).start(() => onDismiss());
  };

  useEffect(() => {
    dismissed.current = false;
    translateY.setValue(-130);
    opacity.setValue(0);
    progressWidth.setValue(1);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 58, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: false }),
    ]).start();

    Animated.timing(progressWidth, {
      toValue: 0,
      duration: AUTO_DISMISS_MS,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notification.id]);

  const progressInterpolated = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY }], opacity }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => { dismiss(); onOpenInbox(); }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Ionicons color="#26743E" name="notifications" size={19} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        </View>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={dismiss}
          style={styles.closeBtn}
        >
          <Ionicons color="#9AA39B" name="close" size={17} />
        </TouchableOpacity>
      </TouchableOpacity>
      <Animated.View style={[styles.progressBar, { width: progressInterpolated }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    left: 16,
    position: 'absolute',
    right: 16,
    top: 12,
    zIndex: 999,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C0DEC8',
    borderRadius: 17,
    borderWidth: 1,
    elevation: 10,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: '#143B22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E9F4E7',
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#101A13',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  body: {
    color: '#627064',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 18,
    marginTop: 3,
  },
  closeBtn: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  progressBar: {
    backgroundColor: '#26743E',
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    height: 3,
    marginTop: -3,
  },
});
