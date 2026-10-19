import type { Dispatch, SetStateAction } from 'react';
import {
  Activity,
  BookOpen,
  Bot,
  Clock3,
  Inbox,
  LockKeyhole,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  UserRound,
} from 'lucide-react';
import { categories, priorities, statuses } from '../constants';
import MetricCard from '../components/MetricCard';
import { formatDate, idOf, statusClass } from '../utils/formatters';
import type { InternalNote, Ticket, TicketFilters } from '../types';

interface AdminDashboardProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  filters: TicketFilters;
  setFilters: Dispatch<SetStateAction<TicketFilters>>;
  loading: boolean;
  loadVisibleData: (showSpinner?: boolean) => Promise<void>;
  openTicket: (ticket: Ticket) => Promise<void>;
  draft: string;
  setDraft: (value: string) => void;
  draftSource: 'ai' | 'template' | null;
  draftWarning: string | null;
  generatingDraft: boolean;
  generateDraft: () => Promise<void>;
  sendingReply: boolean;
  sendReply: () => Promise<void>;
  updatingTicket: boolean;
  updateStatus: (status: string) => Promise<void>;
  updateCategory: (category: string) => Promise<void>;
  updatePriority: (priority: string) => Promise<void>;
  internalNotes: InternalNote[];
  internalNoteDraft: string;
  setInternalNoteDraft: (value: string) => void;
  loadingInternalNotes: boolean;
  savingInternalNote: boolean;
  loadInternalNotes: () => Promise<void>;
  addInternalNote: () => Promise<void>;
  assignToMe: () => Promise<void>;
}

export default function AdminDashboard({
  tickets,
  selectedTicket,
  filters,
  setFilters,
  loading,
  loadVisibleData,
  openTicket,
  draft,
  setDraft,
  draftSource,
  draftWarning,
  generatingDraft,
  generateDraft,
  sendingReply,
  sendReply,
  updatingTicket,
  updateStatus,
  updateCategory,
  updatePriority,
  internalNotes,
  internalNoteDraft,
  setInternalNoteDraft,
  loadingInternalNotes,
  savingInternalNote,
  loadInternalNotes,
  addInternalNote,
  assignToMe,
}: AdminDashboardProps) {
  // Date filtering is applied to the ticket list already returned by the API.
  // Among unresolved tickets, show highest priority first and older tickets before newer ones.
  const priorityOrder: Record<string, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };
  const resolvedStatuses = new Set(['resolved', 'closed']);

  const getLocalDateKey = (value?: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTimestamp = (ticket: Ticket): number => {
    if (!ticket.createdAt) return Number.MAX_SAFE_INTEGER;
    const timestamp = new Date(ticket.createdAt).getTime();
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  };

  const visibleTickets = [...tickets]
    .filter((ticket) => {
      const dateKey = getLocalDateKey(ticket.createdAt);
      if (filters.dateFrom && (!dateKey || dateKey < filters.dateFrom)) return false;
      if (filters.dateTo && (!dateKey || dateKey > filters.dateTo)) return false;
      return true;
    })
    .sort((a, b) => {
      const aUnresolved = !resolvedStatuses.has(a.status.toLowerCase());
      const bUnresolved = !resolvedStatuses.has(b.status.toLowerCase());

      if (aUnresolved !== bUnresolved) return aUnresolved ? -1 : 1;

      if (aUnresolved && bUnresolved) {
        const priorityDifference =
          (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
        if (priorityDifference !== 0) return priorityDifference;
        return getTimestamp(a) - getTimestamp(b);
      }

      // Keep completed tickets after unresolved ones; show the most recently completed first.
      return getTimestamp(b) - getTimestamp(a);
    });

  return (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">OPERATIONS</span>
                  <h1>Support ticket queue</h1>
                  <p>
                    Triage author questions, review AI suggestions, and
                    keep every response accurate.
                  </p>
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => void loadVisibleData(true)}
                  disabled={loading}
                >
                  <RefreshCw
                    size={16}
                    className={loading ? 'spin' : ''}
                  />
                  Refresh
                </button>
              </div>

              <div className="metric-grid">
                <MetricCard
                  icon={<Inbox size={19} />}
                  label="Total tickets"
                  value={visibleTickets.length}
                  detail="In current queue"
                />
                <MetricCard
                  icon={<Clock3 size={19} />}
                  label="Open"
                  value={
                    visibleTickets.filter((ticket) => ticket.status === 'Open')
                      .length
                  }
                  detail="Awaiting resolution"
                />
                <MetricCard
                  icon={<Activity size={19} />}
                  label="In progress"
                  value={
                    visibleTickets.filter(
                      (ticket) => ticket.status === 'In Progress',
                    ).length
                  }
                  detail="Being handled"
                />
                <MetricCard
                  icon={<Sparkles size={19} />}
                  label="AI-assisted"
                  value={
                    visibleTickets.filter(
                      (ticket) =>
                        ticket.aiProcessingStatus === 'completed',
                    ).length
                  }
                  detail="Classification complete"
                />
              </div>

              <div className="admin-layout">
                <section className="panel queue-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>All tickets</h2>
                      <p>Urgent, older unresolved tickets appear first.</p>
                    </div>
                    <span className="subtle-count">{visibleTickets.length}</span>
                  </div>

                  <div className="filter-grid">
                    <select
                      aria-label="Filter by status"
                      value={filters.status}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                    >
                      <option value="">All statuses</option>
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>

                    <select
                      aria-label="Filter by priority"
                      value={filters.priority}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          priority: event.target.value,
                        }))
                      }
                    >
                      <option value="">All priorities</option>
                      {priorities.map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>

                    <select
                      aria-label="Filter by category"
                      value={filters.category}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                    >
                      <option value="">All categories</option>
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>

                    <div className="filter-date-group">
                      <label htmlFor="ticket-date-from">Created from</label>
                      <input
                        id="ticket-date-from"
                        type="date"
                        aria-label="Filter tickets created from date"
                        value={filters.dateFrom}
                        max={filters.dateTo || undefined}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            dateFrom: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="filter-date-group">
                      <label htmlFor="ticket-date-to">Created to</label>
                      <input
                        id="ticket-date-to"
                        type="date"
                        aria-label="Filter tickets created to date"
                        value={filters.dateTo}
                        min={filters.dateFrom || undefined}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            dateTo: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="ticket-list">
                    {loading ? (
                      <div className="empty-state">
                        <RefreshCw className="spin" size={22} />
                        <p>Loading tickets…</p>
                      </div>
                    ) : visibleTickets.length === 0 ? (
                      <div className="empty-state">
                        <Inbox size={26} />
                        <strong>No tickets found</strong>
                        <p>Try adjusting the filters.</p>
                      </div>
                    ) : (
                      visibleTickets.map((ticket) => (
                        <button
                          key={idOf(ticket)}
                          className={`ticket-row ${
                            selectedTicket &&
                            idOf(selectedTicket) === idOf(ticket)
                              ? 'ticket-row-active'
                              : ''
                          }`}
                          onClick={() => void openTicket(ticket)}
                        >
                          <div className="ticket-row-top">
                            <span className="ticket-ref">
                              #{idOf(ticket).slice(-6)}
                            </span>
                            <span
                              className={`priority-pill priority-${statusClass(
                                ticket.priority,
                              )}`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                          <strong className="ticket-subject">
                            {ticket.subject}
                          </strong>
                          <span className="ticket-preview">
                            {ticket.author?.name ||
                              ticket.authorName ||
                              ticket.author?.email ||
                              'Author'}
                            {' · '}
                            {ticket.book?.title ||
                              ticket.bookTitle ||
                              (ticket.bookId ? ticket.bookId : 'Account level')}
                          </span>
                          <div className="ticket-row-bottom">
                            <span
                              className={`status-pill status-${statusClass(
                                ticket.status,
                              )}`}
                            >
                              {ticket.status}
                            </span>
                            <span className="ticket-date">
                              {formatDate(ticket.createdAt)}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>

                <section className="panel detail-panel">
                  {!selectedTicket ? (
                    <div className="empty-detail">
                      <div className="empty-icon">
                        <TicketIcon size={26} />
                      </div>
                      <h2>Select a ticket</h2>
                      <p>
                        Ticket details, AI drafting, and reply controls
                        will appear here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="detail-header">
                        <div>
                          <div className="ticket-ref">
                            Ticket #{idOf(selectedTicket).slice(-6)}
                          </div>
                          <h2>{selectedTicket.subject}</h2>
                          <p>
                            {selectedTicket.author?.name ||
                              selectedTicket.authorName ||
                              selectedTicket.author?.email ||
                              selectedTicket.authorEmail ||
                              'Author'}
                            {' · Created '}
                            {formatDate(selectedTicket.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`priority-pill priority-${statusClass(
                            selectedTicket.priority,
                          )}`}
                        >
                          {selectedTicket.priority}
                        </span>
                      </div>

                      <div className="detail-controls">
                        <div className="control-group">
                          <label htmlFor="ticket-status">Status</label>
                          <select
                            id="ticket-status"
                            value={selectedTicket.status}
                            disabled={updatingTicket}
                            onChange={(event) =>
                              void updateStatus(event.target.value)
                            }
                          >
                            {statuses.map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        <div className="control-group">
                          <label htmlFor="ticket-category">Category</label>
                          <select
                            id="ticket-category"
                            value={selectedTicket.category}
                            disabled={updatingTicket}
                            onChange={(event) =>
                              void updateCategory(event.target.value)
                            }
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="control-group">
                          <label htmlFor="ticket-priority">Priority</label>
                          <select
                            id="ticket-priority"
                            value={selectedTicket.priority}
                            disabled={updatingTicket}
                            onChange={(event) =>
                              void updatePriority(event.target.value)
                            }
                          >
                            {priorities.map((priority) => (
                              <option key={priority} value={priority}>
                                {priority}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="conversation-section">
                        <div className="section-title">
                          <MessageSquare size={17} />
                          <h3>Author's message</h3>
                        </div>
                        <div className="author-message">
                          {selectedTicket.description}
                        </div>
                        <div className="ticket-metadata">
                          <span>
                            <BookOpen size={15} />
                            {selectedTicket.book?.title ||
                              selectedTicket.bookTitle ||
                              (selectedTicket.bookId
                                ? selectedTicket.bookId
                                : 'General / Account')}
                          </span>
                          <span>
                            <Clock3 size={15} />
                            Updated {formatDate(selectedTicket.updatedAt)}
                          </span>
                        </div>
                      </div>


                      <section className="internal-notes-section" aria-labelledby="internal-notes-title">
                        <div className="internal-notes-heading">
                          <div className="section-title">
                            <LockKeyhole size={17} />
                            <h3 id="internal-notes-title">Internal notes</h3>
                          </div>
                          <div className="internal-notes-heading-actions">
                            <button
                              type="button"
                              className="internal-notes-refresh"
                              onClick={() => void loadInternalNotes()}
                              disabled={loadingInternalNotes}
                            >
                              <RefreshCw size={13} className={loadingInternalNotes ? 'spin' : ''} />
                              Refresh
                            </button>
                            <span className="internal-notes-private">Admin only</span>
                          </div>
                        </div>
                        <p className="internal-notes-description">
                          Private operational notes. These are not shown in the author's portal.
                        </p>

                        {loadingInternalNotes ? (
                          <div className="internal-notes-empty">
                            <RefreshCw size={15} className="spin" />
                            Loading internal notes…
                          </div>
                        ) : internalNotes.length === 0 ? (
                          <div className="internal-notes-empty">No internal notes yet.</div>
                        ) : (
                          <div className="internal-notes-list">
                            {internalNotes.map((note, index) => (
                              <article className="internal-note-card" key={note.id || note._id || `${note.createdAt || 'note'}-${index}`}>
                                <div className="internal-note-meta">
                                  <strong>Admin note</strong>
                                  <span>{formatDate(note.createdAt)}</span>
                                </div>
                                <p>{note.body}</p>
                              </article>
                            ))}
                          </div>
                        )}

                        <div className="internal-note-form">
                          <label htmlFor="internal-note-draft">Add an internal note</label>
                          <textarea
                            id="internal-note-draft"
                            className="internal-note-editor"
                            value={internalNoteDraft}
                            onChange={(event) => setInternalNoteDraft(event.target.value)}
                            placeholder="Record an internal update for the support team…"
                            rows={3}
                            maxLength={3000}
                          />
                          <div className="internal-note-footer">
                            <span><LockKeyhole size={14} /> Not visible to author</span>
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => void addInternalNote()}
                              disabled={savingInternalNote || !internalNoteDraft.trim()}
                            >
                              {savingInternalNote ? <RefreshCw size={15} className="spin" /> : <Plus size={15} />}
                              {savingInternalNote ? 'Saving note…' : 'Add note'}
                            </button>
                          </div>
                        </div>
                      </section>

                      <div className="response-section">
                        <div className="response-title">
                          <div>
                            <div className="section-title">
                              <Bot size={18} />
                              <h3>AI response assistant</h3>
                            </div>
                            <p>
                              Generate a policy-grounded draft, then
                              review it before sending.
                            </p>
                          </div>
                          <button
                            className="button button-ai"
                            onClick={() => void generateDraft()}
                            disabled={generatingDraft}
                          >
                            {generatingDraft ? (
                              <RefreshCw size={16} className="spin" />
                            ) : (
                              <Sparkles size={16} />
                            )}
                            {generatingDraft ? 'Generating…' : 'Generate draft'}
                          </button>
                        </div>

                        {draftSource === 'template' && (
                          <div className="draft-source-banner draft-source-template" role="status">
                            <strong>Template fallback loaded.</strong>
                            <span>Review and edit this response before sending.</span>
                          </div>
                        )}
                        {draftSource === 'ai' && (
                          <div className="draft-source-banner draft-source-ai" role="status">
                            AI-generated draft — review and edit before sending.
                          </div>
                        )}
                        {draftWarning && (
                          <p className="draft-warning" role="status">{draftWarning}</p>
                        )}

                        <label
                          htmlFor="reply-draft"
                          className="sr-only"
                        >
                          Edit reply draft
                        </label>
                        <textarea
                          id="reply-draft"
                          className="draft-editor"
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          placeholder="Generate an AI draft or write a response manually…"
                          rows={9}
                        />

                        <div className="draft-footer">
                          <span>
                            <ShieldCheck size={15} />
                            Admin review required
                          </span>
                          <button
                            className="button button-primary"
                            onClick={() => void sendReply()}
                            disabled={sendingReply || !draft.trim()}
                          >
                            <Send size={16} />
                            {sendingReply ? 'Sending…' : 'Send reply'}
                          </button>
                        </div>

                        <button
                          className="button button-secondary assign-button"
                          onClick={() => void assignToMe()}
                          disabled={updatingTicket}
                        >
                          <UserRound size={16} />
                          Assign to me
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </>
  );
}
