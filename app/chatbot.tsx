import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
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
import {
  analyzeSession,
  getSession,
  getSessions,
  sendMessage as sendChatMessage,
} from '../src/api/chatbot';
import type { ChatMessage, ChatSessionSummary } from '../src/types/chatbot';

const generateSessionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: '안녕하세요! 청소 관련 궁금한 점이 있으신가요? 무엇이든 물어보세요.',
  timestamp: Date.now(),
};

const suggestions = ['세제 추천', '기름때 제거', '냉장고 청소', '루틴 만들기'];

function formatSessionDate(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return `${diff}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function ChatbotScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [learnedFacts, setLearnedFacts] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  // stale closure 방지용 ref
  const messagesRef = useRef(messages);
  const sessionIdRef = useRef(sessionId);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // 화면 이탈 시 현재 세션 분석
  useFocusEffect(
    useCallback(() => {
      return () => {
        const history = messagesRef.current
          .filter(m => m.timestamp !== INITIAL_MESSAGE.timestamp)
          .map(({ role, content }) => ({ role, content }));
        if (!history.some(m => m.role === 'user')) return;
        analyzeSession(history, sessionIdRef.current).catch(() => null);
      };
    }, [])
  );

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const handleNewSession = () => {
    const history = messagesRef.current
      .filter(m => m.timestamp !== INITIAL_MESSAGE.timestamp)
      .map(({ role, content }) => ({ role, content }));
    if (history.some(m => m.role === 'user')) {
      analyzeSession(history, sessionIdRef.current).catch(() => null);
    }
    const newId = generateSessionId();
    setSessionId(newId);
    setMessages([INITIAL_MESSAGE]);
    setLearnedFacts([]);
  };

  const handleOpenHistory = async () => {
    setHistoryVisible(true);
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const { sessions: list } = await getSessions();
      setSessions(list);
    } catch {
      setHistoryError(true);
      setSessions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadSession = async (sid: string) => {
    setHistoryVisible(false);
    try {
      const detail = await getSession(sid);
      const loaded: ChatMessage[] = detail.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).getTime(),
      }));
      setSessionId(sid);
      setMessages(loaded.length > 0 ? loaded : [INITIAL_MESSAGE]);
      setLearnedFacts([]);
      setTimeout(scrollToBottom, 150);
    } catch {
      // 로드 실패 시 현재 세션 유지
    }
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSending(true);
    scrollToBottom();

    try {
      const history = messagesRef.current.slice(-20).map(({ role, content }) => ({ role, content }));
      const res = await sendChatMessage(text, history, sessionIdRef.current);
      if (res.correctedKnowledge?.length > 0) {
        setLearnedFacts(prev => [
          ...prev,
          ...res.correctedKnowledge.filter(f => !prev.includes(f)),
        ]);
      }
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.reply, timestamp: Date.now() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '죄송해요, 오류가 발생했어요. 다시 시도해주세요.', timestamp: Date.now() },
      ]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Ionicons color="#FFFFFF" name="sparkles" size={20} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>청소 도우미 AI</Text>
          <Text style={styles.subtitle}>청소 고민을 바로 물어보세요</Text>
        </View>
        <TouchableOpacity activeOpacity={0.72} onPress={handleOpenHistory} style={styles.iconButton}>
          <Ionicons color={colors.text} name="time-outline" size={22} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.72} onPress={handleNewSession} style={styles.iconButton}>
          <Ionicons color={colors.text} name="add-circle-outline" size={22} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dayDivider}>
            <Text style={styles.dayText}>오늘</Text>
          </View>

          {messages.map((message, index) => {
            const isMine = message.role === 'user';
            return (
              <View
                key={`${message.timestamp}-${index}`}
                style={[styles.messageRow, isMine && styles.messageRowMine]}
              >
                {!isMine && (
                  <View style={styles.smallBotAvatar}>
                    <Ionicons color="#FFFFFF" name="leaf" size={14} />
                  </View>
                )}
                <View style={[styles.bubble, isMine ? styles.myBubble : styles.botBubble]}>
                  <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                    {message.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {sending && (
            <View style={styles.messageRow}>
              <View style={styles.smallBotAvatar}>
                <Ionicons color="#FFFFFF" name="leaf" size={14} />
              </View>
              <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
                <ActivityIndicator color={colors.muted} size="small" />
              </View>
            </View>
          )}
        </ScrollView>

        {learnedFacts.length > 0 && (
          <View style={styles.learnedBanner}>
            <View style={styles.learnedBannerTop}>
              <Ionicons name="bulb-outline" size={16} color={colors.greenDark} />
              <Text style={styles.learnedBannerTitle}>AI가 당신에 대해 새로 알게 됐어요</Text>
              <TouchableOpacity onPress={() => setLearnedFacts([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={14} color={colors.muted} />
              </TouchableOpacity>
            </View>
            {learnedFacts.map((fact, i) => (
              <Text key={i} style={styles.learnedFact}>• {fact}</Text>
            ))}
            <TouchableOpacity
              style={styles.regenButton}
              activeOpacity={0.78}
              onPress={() => router.push('/routine-loading')}
            >
              <Ionicons name="refresh-circle-outline" size={16} color="#fff" />
              <Text style={styles.regenButtonText}>이 내용으로 루틴 재조정하기</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPanel}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.suggestionRow}
            showsHorizontalScrollIndicator={false}
          >
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                activeOpacity={0.76}
                key={suggestion}
                onPress={() => handleSend(suggestion)}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.inputBar}>
            <TextInput
              editable={!sending}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              placeholder="무엇을 도와드릴까요?"
              placeholderTextColor="#8A948C"
              returnKeyType="send"
              style={styles.input}
              value={inputText}
            />
            <TouchableOpacity
              activeOpacity={0.82}
              disabled={!inputText.trim() || sending}
              onPress={() => handleSend()}
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            >
              <Ionicons color="#FFFFFF" name="arrow-up" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <RoutineBottomNav active="chatbot" />

      {/* 대화 기록 모달 */}
      <Modal
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
        transparent
        visible={historyVisible}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity onPress={() => setHistoryVisible(false)} style={styles.modalDismiss} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>대화 기록</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)} style={styles.iconButton}>
                <Ionicons color={colors.text} name="close" size={22} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => { setHistoryVisible(false); handleNewSession(); }}
              style={styles.newChatButton}
            >
              <Ionicons color={colors.green} name="add-circle-outline" size={18} />
              <Text style={styles.newChatButtonText}>새 대화 시작</Text>
            </TouchableOpacity>

            {historyLoading ? (
              <ActivityIndicator color={colors.green} size="large" style={styles.historyLoader} />
            ) : historyError ? (
              <View style={styles.emptyHistory}>
                <Ionicons color={colors.muted} name="alert-circle-outline" size={40} />
                <Text style={styles.emptyHistoryText}>기록을 불러오지 못했어요</Text>
              </View>
            ) : sessions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons color={colors.muted} name="chatbubbles-outline" size={40} />
                <Text style={styles.emptyHistoryText}>아직 대화 기록이 없어요</Text>
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={item => item.sessionId}
                contentContainerStyle={styles.sessionList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={() => handleLoadSession(item.sessionId)}
                    style={[
                      styles.sessionItem,
                      item.sessionId === sessionId && styles.sessionItemActive,
                    ]}
                  >
                    <View style={styles.sessionItemContent}>
                      <Text numberOfLines={1} style={styles.sessionTitle}>{item.title}</Text>
                      {item.summary ? (
                        <Text numberOfLines={2} style={styles.sessionSummary}>{item.summary}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.sessionDate}>{formatSessionDate(item.updatedAt)}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
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
  botAvatar: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  botBubble: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
  },
  bottomPanel: {
    backgroundColor: colors.background,
    borderTopColor: '#EEF0EC',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 10,
  },
  bubble: {
    borderRadius: 16,
    maxWidth: '76%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chatContent: {
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  dayDivider: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dayText: {
    backgroundColor: '#EEF5EC',
    borderRadius: 12,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  emptyHistory: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 60,
  },
  emptyHistoryText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: '#EEF0EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  headerText: {
    flex: 1,
  },
  historyLoader: {
    paddingTop: 60,
  },
  iconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    paddingLeft: 16,
  },
  inputBar: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    paddingRight: 5,
    width: '88%',
  },
  learnedBanner: {
    backgroundColor: '#EAF5EC',
    borderBottomColor: '#C3DFC9',
    borderBottomWidth: 1,
    borderTopColor: '#C3DFC9',
    borderTopWidth: 1,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  learnedBannerTitle: {
    color: colors.greenDark,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  learnedBannerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  learnedFact: {
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    paddingLeft: 4,
  },
  messageRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 21,
  },
  modalDismiss: {
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#EEF0EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  myBubble: {
    backgroundColor: colors.greenDark,
  },
  myMessageText: {
    color: colors.white,
  },
  newChatButton: {
    alignItems: 'center',
    borderBottomColor: '#EEF0EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  newChatButtonText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '800',
  },
  regenButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 4,
    paddingVertical: 10,
  },
  regenButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sessionDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    minWidth: 40,
    textAlign: 'right',
  },
  sessionItem: {
    borderBottomColor: '#EEF0EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sessionItemActive: {
    backgroundColor: '#EEF5EC',
  },
  sessionItemContent: {
    flex: 1,
    gap: 4,
  },
  sessionList: {
    paddingBottom: 40,
  },
  sessionSummary: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  sessionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  smallBotAvatar: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 4,
  },
  suggestionChip: {
    backgroundColor: '#EEF5EC',
    borderColor: '#D9E6D6',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  suggestionRow: {
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 18,
  },
  suggestionText: {
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  typingBubble: {
    paddingVertical: 14,
    width: 60,
  },
});
