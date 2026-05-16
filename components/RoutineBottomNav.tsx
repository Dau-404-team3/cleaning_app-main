import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ActiveTab = 'home' | 'community' | 'chatbot' | 'my';

type RoutineBottomNavProps = {
  active: ActiveTab;
};

const tabs: {
  key: ActiveTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: '/home' | '/community' | '/chatbot' | '/stats';
}[] = [
  { key: 'home', label: '홈', icon: 'home-outline', activeIcon: 'home', route: '/home' },
  {
    key: 'community',
    label: '커뮤니티',
    icon: 'people-outline',
    activeIcon: 'people',
    route: '/community',
  },
  {
    key: 'chatbot',
    label: '챗봇',
    icon: 'chatbubble-ellipses-outline',
    activeIcon: 'chatbubble-ellipses',
    route: '/chatbot',
  },
  { key: 'my', label: '마이페이지', icon: 'person-outline', activeIcon: 'person', route: '/stats' },
];

export function RoutineBottomNav({ active }: RoutineBottomNavProps) {
  const router = useRouter();

  return (
    <View style={styles.nav}>
      {tabs.map((tab) => {
        const selected = tab.key === active;

        return (
          <TouchableOpacity
            activeOpacity={0.76}
            key={tab.key}
            onPress={() => router.replace(tab.route)}
            style={styles.navItem}
          >
            <Ionicons
              color={selected ? '#28733E' : '#B9BDB7'}
              name={selected ? tab.activeIcon : tab.icon}
              size={24}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.label, selected && styles.labelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#7C837A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 3,
    maxWidth: 62,
    minWidth: 44,
    textAlign: 'center',
  },
  labelActive: {
    color: '#28733E',
    fontWeight: '900',
  },
  nav: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E6E8E4',
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 78,
    paddingBottom: 10,
    paddingTop: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
