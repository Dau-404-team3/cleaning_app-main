import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeBack } from '../src/utils/useSafeBack';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPost, getComments, toggleLike, createComment } from '../src/api/community';
import type { CommunityPost, PostComment } from '../src/types/community';

const TYPE_LABELS: Record<string, string> = {
  cleaning_cert: '청소 인증',
  info_share: '정보 공유',
};

export default function PostDetailScreen() {
  const safeBack = useSafeBack('/community');
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    getPost(postId)
      .then((postData) => {
        setPost(postData);
        setLikeCount(postData.likes);
        return getComments(postId).then((commentData) => {
          setComments(commentData.comments);
        }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleToggleLike = async () => {
    if (!postId) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    try {
      const res = await toggleLike(postId);
      setLiked(res.liked);
      setLikeCount(res.likes);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    }
  };

  const handleSubmitComment = async () => {
    const text = commentDraft.trim();
    if (!text || submitting || !postId) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(postId, text);
      setComments((prev) => [...prev, newComment]);
      setCommentDraft('');
    } catch {
      // keep draft on failure
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          activeOpacity={0.72}
          onPress={safeBack}
          style={styles.backButton}
        >
          <Ionicons color={colors.text} name="chevron-back" size={24} />
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color={colors.green} style={styles.loader} />
        ) : post ? (
          <View style={styles.card}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{TYPE_LABELS[post.type] ?? post.type}</Text>
            </View>

            <Text style={styles.postTitle}>{post.title || post.content?.slice(0, 40)}</Text>
            <Text style={styles.body}>{post.content}</Text>

            {(() => {
              const imgs = post.imageUrls?.length
                ? post.imageUrls
                : post.imageUrl
                ? [post.imageUrl]
                : [];
              if (!imgs.length) return null;
              return (
                <View style={styles.imageRowDetail}>
                  {imgs.map((url, i) => (
                    <TouchableOpacity
                      activeOpacity={0.88}
                      key={i}
                      onPress={() => setExpandedImage(url)}
                      style={styles.postImageWrapper}
                    >
                      <Image
                        contentFit="cover"
                        source={{ uri: url }}
                        style={styles.postImage}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}

            {post.tags.length > 0 && (
              <View style={styles.tagRow}>
                {post.tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>#{tag}</Text>
                ))}
              </View>
            )}

            <Text style={styles.dateText}>
              {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                accessibilityLabel="좋아요"
                accessibilityRole="button"
                activeOpacity={0.74}
                onPress={handleToggleLike}
                style={styles.actionItem}
              >
                <Ionicons
                  color={liked ? '#E45B4F' : '#9AA39B'}
                  name={liked ? 'heart' : 'heart-outline'}
                  size={16}
                />
                <Text style={styles.actionText}>{likeCount}</Text>
              </TouchableOpacity>
              <View style={styles.actionItem}>
                <Ionicons color="#9AA39B" name="chatbubble-outline" size={16} />
                <Text style={styles.actionText}>{comments.length}</Text>
              </View>
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentSectionTitle}>댓글</Text>

              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Ionicons color={colors.white} name="person" size={12} />
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentText}>{comment.content}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.commentComposer}>
                <TextInput
                  multiline
                  onChangeText={setCommentDraft}
                  placeholder="댓글을 입력하세요"
                  placeholderTextColor="#9AA39B"
                  style={styles.commentInput}
                  textAlignVertical="top"
                  value={commentDraft}
                />
                <View style={styles.commentComposerBottom}>
                  <Text style={styles.commentHint}>
                    {commentDraft.trim().length > 0 ? '' : '따뜻한 댓글을 남겨보세요'}
                  </Text>
                  <TouchableOpacity
                    accessibilityLabel="댓글 등록"
                    accessibilityRole="button"
                    activeOpacity={0.8}
                    disabled={commentDraft.trim().length === 0 || submitting}
                    onPress={handleSubmitComment}
                    style={[
                      styles.commentSubmitButton,
                      (commentDraft.trim().length === 0 || submitting) &&
                        styles.commentSubmitButtonDisabled,
                    ]}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.commentSubmitText}>등록</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>게시글 정보를 불러오지 못했어요.</Text>
          </View>
        )}
      </ScrollView>

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
  muted: '#607066',
  text: '#102117',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  actionItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  actionRow: {
    borderTopColor: '#EEF0EC',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 15,
    marginTop: 22,
    paddingTop: 16,
  },
  actionText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#F7F6F0',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginBottom: 18,
    width: 40,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF2D7',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#A36B13',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  postTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 28,
    marginBottom: 12,
  },
  body: {
    color: '#3E4D43',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 26,
  },
  imageRowDetail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  postImageWrapper: {
    borderColor: '#E2E6E0',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  postImage: {
    height: 120,
    width: 120,
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
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  commentAvatar: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  commentBody: {
    flex: 1,
    gap: 4,
  },
  commentComposer: {
    backgroundColor: '#F7FAF6',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 12,
  },
  commentComposerBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  commentDate: {
    color: '#9AA39B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
  },
  commentHint: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  commentInput: {
    backgroundColor: colors.white,
    borderColor: '#DDE4DA',
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 20,
    minHeight: 82,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  commentSection: {
    marginTop: 24,
  },
  commentSectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 16,
  },
  commentSubmitButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#B9C5B9',
  },
  commentSubmitText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  commentText: {
    color: '#3E4D43',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 19,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  dateText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 16,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 160,
    padding: 20,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  loader: {
    marginTop: 60,
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 40,
  },
  tag: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
});
