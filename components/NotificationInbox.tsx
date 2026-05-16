import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NotificationItem } from '../src/api/notification';

type Props = {
  visible: boolean;
  notifications: NotificationItem[];
  loading: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSendTest: () => void;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  return `${d}일 전`;
}

export function NotificationInbox({
  visible, notifications, loading, onClose, onMarkRead, onMarkAllRead, onSendTest,
}: Props) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.72} onPress={onClose} style={styles.headerBtn}>
            <Ionicons color="#101A13" name="chevron-down" size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>알림</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            activeOpacity={0.72}
            onPress={onMarkAllRead}
            style={[styles.headerBtn, styles.headerBtnRight]}
            disabled={unreadCount === 0}
          >
            <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllTextDisabled]}>
              모두 읽음
            </Text>
          </TouchableOpacity>
        </View>

        {/* 본문 */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#26743E" size="large" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <Ionicons color="#C4CBCA" name="notifications-off-outline" size={52} />
            <Text style={styles.emptyTitle}>아직 알림이 없어요</Text>
            <Text style={styles.emptySub}>테스트 알림을 보내 확인해보세요</Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={() => { if (!item.read) onMarkRead(item.id); }}
                style={[styles.item, !item.read && styles.itemUnread]}
              >
                <View style={[styles.dot, item.read ? styles.dotRead : styles.dotUnread]} />
                <View style={styles.itemBody}>
                  <View style={styles.itemTop}>
                    <Text
                      style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.itemText}>{item.body}</Text>
                </View>
                {!item.read && (
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => onMarkRead(item.id)}
                    style={styles.readBtn}
                  >
                    <Ionicons color="#26743E" name="checkmark" size={15} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
          />
        )}

        {/* 테스트 알림 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity activeOpacity={0.82} onPress={onSendTest} style={styles.testBtn}>
            <Ionicons color="#26743E" name="send-outline" size={16} />
            <Text style={styles.testBtnText}>테스트 알림 보내기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const colors = {
  bg: '#FBFCFA',
  border: '#E2E6E0',
  green: '#26743E',
  greenSoft: '#E9F4E7',
  muted: '#627064',
  text: '#101A13',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  dotRead: {
    backgroundColor: '#D0D8D2',
  },
  dotUnread: {
    backgroundColor: colors.green,
  },
  emptySub: {
    color: '#9AA39B',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
  },
  emptyTitle: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
  },
  footer: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 16,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginLeft: 7,
    minWidth: 20,
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerBtnRight: {
    width: 72,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  item: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    padding: 15,
  },
  itemBody: {
    flex: 1,
  },
  itemText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 4,
  },
  itemTime: {
    color: '#9AA39B',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0,
  },
  itemTitle: {
    color: colors.muted,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
  },
  itemTitleUnread: {
    color: colors.text,
    fontWeight: '900',
  },
  itemTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  itemUnread: {
    backgroundColor: '#F1FAF3',
    borderColor: '#B9DEC4',
  },
  listContent: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  markAllText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'right',
  },
  markAllTextDisabled: {
    color: '#C4CBCA',
  },
  readBtn: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  testBtn: {
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderColor: '#B9DEC4',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  testBtnText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
