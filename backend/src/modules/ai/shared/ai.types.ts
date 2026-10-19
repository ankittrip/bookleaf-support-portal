import type {
  BookLeafTicketCategory,
} from '../prompts/bookleaf-knowledge-base.js';

export type TicketPriority =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low';

export interface TicketClassificationInput {
  subject: string;
  description: string;
  bookTitle?: string;
}

export interface TicketClassificationResult {
  category: BookLeafTicketCategory;
  priority: TicketPriority;
  reasoning: string;
}

export interface TicketDraftInput {
  subject: string;
  description: string;
  category: string;
  priority: string;
  authorName?: string;
  bookContext?: Record<string, unknown>;
}

export interface DraftResult {
  text: string;
  source: 'ai' | 'template';
  warning?: string;
}