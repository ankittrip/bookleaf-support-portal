import type { Session, Ticket } from '../types';

export function getStoredSession(): Session | null {
  try {
    const token = localStorage.getItem('bookleaf_token');
    const user = localStorage.getItem('bookleaf_user');
    if (!token || !user) return null;

    return {
      accessToken: token,
      user: JSON.parse(user) as Session['user'],
    };
  } catch {
    return null;
  }
}

export function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== 'object') return [];

  const object = value as Record<string, unknown>;
  for (const key of ['items', 'tickets', 'books', 'results', 'data']) {
    const candidate = object[key];
    if (Array.isArray(candidate)) return candidate as T[];
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items as T[];
      if (Array.isArray(nested.tickets)) return nested.tickets as T[];
    }
  }
  return [];
}

export function idOf(ticket: Ticket): string {
  return ticket._id || ticket.id || ticket.ticketId || '';
}

export function formatDate(value?: string): string {
  if (!value) return 'Recently created';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently created';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatBookDate(value?: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatINR(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function friendlyError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (
      error as { response?: { data?: { message?: string | string[] } } }
    ).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export function statusClass(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
