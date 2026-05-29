import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutineBottomNav } from '../components/RoutineBottomNav';
import { getPosts, toggleLike as apiToggleLike, deletePost as apiDeletePost } from '../src/api/community';
import { useAuthStore } from '../src/store/authStore';
import type { CommunityPost } from '../src/types/community';

const TYPE_LABELS: Record<string, string> = {
  cleaning_cert: '청소 인증',
  info_share: '정보 공유',
};

const FILTERS: Array<{ label: string; value: 'all' | 'cleaning_cert' | 'info_share' }> = [
  { label: '전체', value: 'all' },
  { label: '청소 인증', value: 'cleaning_cert' },
  { label: '정보 공유', value: 'info_share' },
];

const AVATAR_COLORS = ['#6EA86F', '#E1A851', '#7C9BD0', '#C87BAA', '#78B7AD'];

function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function CommunityScreen() {
  const router = useRouter();
  const { uid } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'cleaning_cert' | 'info_share'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setNextCursor(null);
      getPosts()
        .then((data) => {
          if (active) {
            setPosts(data.posts);
            setNextCursor(data.nextCursor);
          }
        })
        .catch(() => {})
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await getPosts('all', nextCursor);
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } catch {
      // keep existing posts on error
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    const doDelete = async () => {
      try {
        await apiDeletePost(postId);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } catch {
        if (Platform.OS === 'web') {
          window.alert('삭제 실패\n\n다시 시도해주세요.');
        } else {
          Alert.alert('삭제 실패', '다시 시도해주세요.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('게시글 삭제\n\n이 게시글을 삭제할까요?')) doDelete();
    } else {
      Alert.alert('게시글 삭제', '이 게시글을 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleEditPost = (post: CommunityPost) => {
    const urls = post.imageUrls?.length ? post.imageUrls
      : post.imageUrl ? [post.imageUrl] : [];
    router.push({
      pathname: '/PostCompose',
      params: {
        postId: post.id,
        editType: post.type,
        editTitle: post.title ?? '',
        editContent: post.content,
        editImageUrls: JSON.stringify(urls),
      },
    });
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const byType = activeFilter === 'all' ? posts : posts.filter((p) => p.type === activeFilter);
    if (!q) return byType;
    return byType.filter(
      (p) =>
        (p.title ?? '').toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [activeFilter, searchQuery, posts]);

  const handleToggleLike = async (post: CommunityPost) => {
    const current = likedPosts[post.id];
    const wasLiked = current?.liked ?? false;
    const currentCount = current?.count ?? post.likes;
    setLikedPosts((prev) => ({
      ...prev,
      [post.id]: { liked: !wasLiked, count: wasLiked ? currentCount - 1 : currentCount + 1 },
    }));
    try {
      const res = await apiToggleLike(post.id);
      setLikedPosts((prev) => ({ ...prev, [post.id]: { liked: res.liked, count: res.likes } }));
    } catch {
      setLikedPosts((prev) => ({ ...prev, [post.id]: { liked: wasLiked, count: currentCount } }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>커뮤니티</Text>
            <Text style={styles.subtitle}>함께하면 청소도 가벼워져요</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons color="#8C978E" name="search" size={18} />
          <TextInput
            onChangeText={setSearchQuery}
            placeholder="제목 또는 내용 검색"
            placeholderTextColor="#8C978E"
            returnKeyType="search"
            style={styles.searchInput}
            value={searchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearchQuery('')}
              style={styles.searchClearButton}
            >
              <Ionicons color="#8C978E" name="close-circle" size={18} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map(({ label, value }) => {
            const selected = activeFilter === value;
            return (
              <TouchableOpacity
                activeOpacity={0.76}
                key={value}
                onPress={() => setActiveFilter(value)}
                style={[styles.filterChip, selected && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.composerCard}>
          <View style={styles.composerAvatar}>
            <Text style={styles.composerEmoji}>🌱</Text>
          </View>
          <Text style={styles.composerText}>청소 팁이나 인증을 나눠보세요</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/PostCompose')}
            style={styles.composerButton}
          >
            <Text style={styles.composerButtonText}>작성</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.green} style={styles.loader} />
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons color="#9AA39B" name="search" size={26} />
            <Text style={styles.emptyText}>게시글이 없어요</Text>
          </View>
        ) : (
          filteredPosts.map((post) => {
            const likeState = likedPosts[post.id];
            const liked = likeState?.liked ?? false;
            const likeCount = likeState?.count ?? post.likes;
            const badge = TYPE_LABELS[post.type] ?? post.type;
            const color = avatarColor(post.id);

            return (
              <View key={post.id} style={styles.postCard}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => router.push({ pathname: '/PostDetail', params: { postId: post.id } })}
                  style={styles.postContentButton}
                >
                  <View style={styles.postHeader}>
                    <View style={styles.postProfileRow}>
                      <View style={[styles.postAvatar, { backgroundColor: color }]}>
                        <Ionicons color="#FFFFFF" name="leaf" size={16} />
                      </View>
                      <View style={styles.postTitleColumn}>
                        <Text numberOfLines={1} style={styles.postTitle}>
                          {post.title ?? post.content.slice(0, 40)}
                        </Text>
                        <Text style={styles.author}>
                          {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  </View>
                  <Text numberOfLines={3} style={styles.postBody}>
                    {post.content}
                  </Text>
                  {post.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {post.tags.slice(0, 3).map((tag) => (
                        <Text key={tag} style={styles.tag}>#{tag}</Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
                {(post.imageUrls?.[0] ?? post.imageUrl ?? null) ? (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => setExpandedImage(post.imageUrls?.[0] ?? post.imageUrl ?? null)}
                    style={styles.postThumbnailWrapper}
                  >
                    <Image
                      contentFit="cover"
                      source={{ uri: post.imageUrls?.[0] ?? post.imageUrl ?? undefined }}
                      style={styles.postThumbnail}
                    />
                  </TouchableOpacity>
                ) : null}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.74}
                    onPress={() => handleToggleLike(post)}
                    style={styles.actionItem}
                  >
                    <Ionicons
                      color={liked ? '#E45B4F' : '#9AA39B'}
                      name={liked ? 'heart' : 'heart-outline'}
                      size={15}
                    />
                    <Text style={styles.actionText}>{likeCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.74}
                    onPress={() => router.push({ pathname: '/PostDetail', params: { postId: post.id } })}
                    style={styles.actionItem}
                  >
                    <Ionicons color="#9AA39B" name="chatbubble-outline" size={15} />
                    <Text style={styles.actionText}>{post.commentCount ?? 0}</Text>
                  </TouchableOpacity>
                  {post.uid === uid && (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.74}
                        onPress={() => handleEditPost(post)}
                        style={styles.actionItem}
                      >
                        <Ionicons color="#7B9EC8" name="pencil-outline" size={15} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.74}
                        onPress={() => handleDeletePost(post.id)}
                        style={styles.actionItem}
                      >
                        <Ionicons color="#C87B7B" name="trash-outline" size={15} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
        {nextCursor && !loading && (
          <TouchableOpacity
            activeOpacity={0.76}
            disabled={loadingMore}
            onPress={handleLoadMore}
            style={styles.loadMoreButton}
          >
            {loadingMore ? (
              <ActivityIndicator color={colors.green} size="small" />
            ) : (
              <Text style={styles.loadMoreText}>게시글 더보기</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
      <RoutineBottomNav active="community" />

      <Modal
        animationType="fade"
        onRequestClose={() => setExpandedImage(null)}
        transparent
        visible={!!expandedImage}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setExpandedImage(null)}
          style={styles.modalOverlay}
        >
          {expandedImage ? (
            <Image
              contentFit="contain"
              source={{ uri: expandedImage }}
              style={styles.modalImage}
            />
          ) : null}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const colors = {
  background: '#FBFCFA',
  border: '#E2E6E0',
  green: '#287A40',
  greenDark: '#143B22',
  muted: '#607066',
  text: '#102117',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  actionItem: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 4,
    minHeight: 28,
    paddingHorizontal: 4,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
  },
  actionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  author: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#FFF2D7',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#A36B13',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
  },
  composerAvatar: {
    alignItems: 'center',
    backgroundColor: '#F2F7EF',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  composerButton: {
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  composerButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  composerCard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    padding: 14,
    width: '88%',
  },
  composerEmoji: {
    fontSize: 17,
  },
  composerText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 120,
    width: '88%',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  filterChip: {
    backgroundColor: '#F2F5F0',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.green,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 22,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  filterTextActive: {
    color: colors.white,
  },
  header: {
    marginBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  loader: {
    marginTop: 40,
  },
  loadMoreButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginBottom: 16,
    width: '88%',
  },
  loadMoreText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  postAvatar: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  postBody: {
    color: '#3E4D43',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
    marginTop: 14,
  },
  postThumbnailWrapper: {
    borderColor: '#E2E6E0',
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 14,
    marginTop: 10,
    overflow: 'hidden',
    width: 72,
  },
  postThumbnail: {
    height: 72,
    width: 72,
  },
  postCard: {
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
    width: '88%',
  },
  postContentButton: {
    width: '100%',
  },
  postHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  postProfileRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 11,
  },
  postTitle: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 21,
  },
  postTitleColumn: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 104,
  },
  searchBox: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    marginBottom: 14,
    paddingHorizontal: 14,
    width: '88%',
  },
  searchClearButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    height: '100%',
    letterSpacing: 0,
    padding: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 6,
  },
  tag: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.88)',
    flex: 1,
    justifyContent: 'center',
  },
  modalImage: {
    height: '80%',
    width: '100%',
  },
});
