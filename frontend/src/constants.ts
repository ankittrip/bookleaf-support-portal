import type { TicketFilters } from './types';

export const categories = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

export const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
export const priorities = ['Critical', 'High', 'Medium', 'Low'];

export const initialFilters: TicketFilters = {
  status: '',
  category: '',
  priority: '',
  dateFrom: '',
  dateTo: '',
};