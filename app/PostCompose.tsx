import { Ionicons } from '@expo/vector-icons';
import { useSafeBack } from '../src/utils/useSafeBack';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPost, updatePost } from '../src/api/community';

type PostType = 'cleaning_cert' | 'info_share';

const TYPE_OPTIONS: Array<{ label: string; value: PostType }> = [
  { label: '청소 인증', value: 'cleaning_cert' },
  { label: '정보 공유', value: 'info_share' },
];

function getFirstParam(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default function PostComposeScreen() {
  const safeBack = useSafeBack('/community');
  const params = useLocalSearchParams<{
    postId?: string;
    editType?: string;
    editTitle?: string;
    editContent?: string;
    editImageUrls?: string;
  }>();

  const postId = getFirstParam(params.postId);
  const isEdit = !!postId;

  const [postType, setPostType] = useState<PostType>(
    (getFirstParam(params.editType) as PostType) || 'cleaning_cert'
  );
  const [title, setTitle] = useState(getFirstParam(params.editTitle) ?? '');
  const [content, setContent] = useState(getFirstParam(params.editContent) ?? '');
  const [submitting, setSubmitting] = useState(false);

  // 새로 선택한 이미지 목록
  const [newImages, setNewImages] = useState<Array<{ uri: string; base64: string | null }>>([]);
  // 수정 시 기존 이미지 URL 목록 (유지 중인 것만)
  const [existingUrls, setExistingUrls] = useState<string[]>(() => {
    const raw = getFirstParam(params.editImageUrls);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return raw ? [raw] : []; }
  });
  // 원본 기존 URL (제거된 것 추적용)
  const originalUrls = useState<string[]>(() => {
    const raw = getFirstParam(params.editImageUrls);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return raw ? [raw] : []; }
  })[0];

  const totalCount = existingUrls.length + newImages.length;
  const canAddMore = totalCount < 5;

  const handlePickImage = async () => {
    if (!canAddMore) return;
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let base64: string | null = null;
      if (asset.base64) {
        const mime = (asset as any).mimeType || 'image/jpeg';
        base64 = `data:${mime};base64,${asset.base64}`;
      } else if (asset.uri.startsWith('data:')) {
        base64 = asset.uri;
      }
      setNewImages(prev => [...prev, { uri: asset.uri, base64 }]);
    }
  };

  const handleRemoveExisting = (url: string) => {
    setExistingUrls(prev => prev.filter(u => u !== url));
  };

  const handleRemoveNew = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const imageBase64Array = newImages.map(i => i.base64).filter(Boolean) as string[];
      if (isEdit && postId) {
        const removeImageUrls = originalUrls.filter(u => !existingUrls.includes(u));
        await updatePost(postId, postType, title.trim(), content.trim(),
          imageBase64Array.length ? imageBase64Array : undefined,
          removeImageUrls.length ? removeImageUrls : undefined);
      } else {
        await createPost(postType, title.trim(), content.trim(), undefined,
          imageBase64Array.length ? imageBase64Array : undefined);
      }
      safeBack();
    } catch {
      const msg = isEdit ? '게시글 수정에 실패했어요. 다시 시도해주세요.' : '게시글 작성에 실패했어요. 다시 시도해주세요.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('오류', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
            activeOpacity={0.72}
            onPress={() => safeBack()}
            style={styles.backButton}
          >
            <Ionicons color={colors.text} name="chevron-back" size={24} />
          </TouchableOpacity>

          <Text style={styles.title}>{isEdit ? '게시글 수정' : '게시글 작성'}</Text>
          <Text style={styles.subtitle}>
            {isEdit ? '내용을 수정하고 저장해보세요' : '청소 팁이나 인증을 편하게 남겨보세요'}
          </Text>

          <Text style={styles.sectionLabel}>카테고리</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map(({ label: optLabel, value }) => {
              const selected = postType === value;
              return (
                <TouchableOpacity
                  activeOpacity={0.78}
                  key={value}
                  onPress={() => setPostType(value)}
                  style={[styles.typeChip, selected && styles.typeChipSelected]}
                >
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                    {optLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>제목</Text>
          <TextInput
            onChangeText={setTitle}
            placeholder="제목을 입력해주세요"
            placeholderTextColor="#9AA39B"
            returnKeyType="next"
            style={styles.titleInput}
            value={title}
          />

          <Text style={styles.sectionLabel}>내용</Text>
          <TextInput
            multiline
            onChangeText={setContent}
            placeholder="청소 팁, 인증 사진 설명, 질문 등 자유롭게 작성해보세요"
            placeholderTextColor="#9AA39B"
            style={styles.contentInput}
            textAlignVertical="top"
            value={content}
          />

          <View style={styles.imageSectionHeader}>
            <Text style={styles.sectionLabel}>사진 (선택)</Text>
            <Text style={styles.imageHint}>최대 5개까지 올릴 수 있습니다.</Text>
          </View>
          <View style={styles.imageRow}>
            {existingUrls.map((url) => (
              <View key={url} style={styles.imageThumbWrapper}>
                <Image contentFit="cover" source={{ uri: url }} style={styles.imageThumb} />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleRemoveExisting(url)}
                  style={styles.imageRemoveButton}
                >
                  <Ionicons color={colors.white} name="close" size={13} />
                </TouchableOpacity>
              </View>
            ))}
            {newImages.map((img, index) => (
              <View key={`new-${index}`} style={styles.imageThumbWrapper}>
                <Image contentFit="cover" source={{ uri: img.uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleRemoveNew(index)}
                  style={styles.imageRemoveButton}
                >
                  <Ionicons color={colors.white} name="close" size={13} />
                </TouchableOpacity>
              </View>
            ))}
            {canAddMore && (
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={handlePickImage}
                style={styles.imageThumbPicker}
              >
                <Ionicons color={colors.muted} name="image-outline" size={22} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.84}
            disabled={!canSubmit || submitting}
            onPress={handleSubmit}
            style={[styles.submitButton, (!canSubmit || submitting) && styles.submitButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>{isEdit ? '수정 완료' : '작성 완료'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  titleInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contentInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 23,
    marginBottom: 20,
    minHeight: 220,
    padding: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 10,
    marginTop: 22,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 16,
    height: 58,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B9C5B9',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 8,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0,
  },
  typeChip: {
    backgroundColor: '#F2F5F0',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  typeChipSelected: {
    backgroundColor: colors.green,
  },
  typeChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  typeChipTextSelected: {
    color: colors.white,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageSectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  imageHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  imageThumbWrapper: {
    position: 'relative',
    width: 72,
  },
  imageThumb: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 72,
    width: 72,
  },
  imageRemoveButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
    width: 20,
  },
  imageThumbPicker: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 72,
    justifyContent: 'center',
    marginBottom: 20,
    width: 72,
  },
});
