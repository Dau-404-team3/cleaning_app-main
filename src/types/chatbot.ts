export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatbotResponse {
  reply: string;
  correctedKnowledge: string[];
}

export interface ChangedCategory {
  category: string;
  key: string;
  value: string | null;
  label: string;
}

export interface PendingRoutineUpdate {
  categories: ChangedCategory[];
  detectedAt: string;
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: ChatSessionMessage[];
}
