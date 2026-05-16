import client from './client';
import type {
  ChatbotResponse,
  ChangedCategory,
  PendingRoutineUpdate,
  ChatSessionSummary,
  ChatSessionDetail,
} from '../types/chatbot';

export async function sendMessage(
  message: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  sessionId: string
): Promise<ChatbotResponse> {
  const { data } = await client.post<ChatbotResponse>('/chatbot/message', {
    message,
    conversationHistory,
    sessionId,
  });
  return data;
}

export async function analyzeSession(
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  sessionId: string
): Promise<{ changedCategories: ChangedCategory[] }> {
  const { data } = await client.post<{ changedCategories: ChangedCategory[] }>(
    '/chatbot/analyze-session',
    { conversationHistory, sessionId }
  );
  return data;
}

export async function getPendingRoutineUpdate(): Promise<{ pending: PendingRoutineUpdate | null }> {
  const { data } = await client.get<{ pending: PendingRoutineUpdate | null }>('/chatbot/pending-update');
  return data;
}

export async function clearPendingRoutineUpdate(): Promise<void> {
  await client.delete('/chatbot/pending-update');
}

export async function getSessions(): Promise<{ sessions: ChatSessionSummary[] }> {
  const { data } = await client.get<{ sessions: ChatSessionSummary[] }>('/chatbot/sessions');
  return data;
}

export async function getSession(sessionId: string): Promise<ChatSessionDetail> {
  const { data } = await client.get<ChatSessionDetail>(`/chatbot/sessions/${sessionId}`);
  return data;
}
