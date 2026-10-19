
export type Role = 'author' | 'admin';

export type DraftSource = 'ai' | 'template';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  authorId?: string | null;
}

export interface Session {
  accessToken: string;
  user: AuthUser;
}

export interface Book {
  bookId: string;
  title: string;
  isbn?: string;
  genre?: string;
  publicationDate?: string | null;
  status?: string;
  mrp?: number | null;
  totalCopiesSold?: number;
  totalRoyaltyEarned?: number;
  royaltyPaid?: number;
  royaltyPending?: number;
  lastRoyaltyPayoutDate?: string | null;
  printPartner?: string | null;
  availableOn?: string[];
}

export interface InternalNote {
  id?: string;
  _id?: string;
  ticketId?: string;
  adminUserId?: string;
  body: string;
  createdAt?: string;
}

export interface TicketMessage {
  _id?: string;
  id?: string;
  body: string;
  senderRole: 'author' | 'admin';
  senderUserId?: string;
  createdAt?: string;
}

export interface Ticket {
  _id?: string;
  id?: string;
  ticketId?: string;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;

  author?: {
    name?: string;
    email?: string;
  };

  bookId?: string | null;
  bookTitle?: string;

  book?: {
    title?: string;
  };

  subject: string;
  description: string;
  status: string;
  category: string;
  priority: string;

  createdAt?: string;
  updatedAt?: string;

  // AI-generated or template-based response draft
  aiDraftResponse?: string;
  aiDraftSource?: DraftSource | null;
  aiDraftWarning?: string | null;

  // Ticket classification metadata
  aiProcessingStatus?: string | null;
  aiSuggestedCategory?: string | null;
  aiSuggestedPriority?: string | null;

  messages?: TicketMessage[];
}

export interface TicketFilters {
  status: string;
  category: string;
  priority: string;
  dateFrom: string;
  dateTo: string;
}
