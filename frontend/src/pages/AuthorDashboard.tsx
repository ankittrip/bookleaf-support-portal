import { useEffect, type FormEvent } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Ticket as TicketIcon,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { formatBookDate, formatDate, formatINR, idOf, statusClass } from '../utils/formatters';
import type { Book, Ticket } from '../types';

/**
 * AI-generated replies may contain Markdown that was escaped before saving,
 * such as \\*\\*heading\\*\\*. The conversation is plain text, so clean up
 * those markers before showing the message to authors.
 */
function formatSupportMessage(body: string): string {
  return body
    .replace(/\\([^\w\s])/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*-\s+/gm, '• ')
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n')
    .trim();
}

interface AuthorDashboardProps {
  books: Book[];
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  loading: boolean;
  loadVisibleData: (showSpinner?: boolean) => Promise<void>;
  openTicket: (ticket: Ticket) => Promise<void>;
  newBookId: string;
  setNewBookId: (value: string) => void;
  newSubject: string;
  setNewSubject: (value: string) => void;
  newDescription: string;
  setNewDescription: (value: string) => void;
  creatingTicket: boolean;
  createTicket: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export default function AuthorDashboard({
  books,
  tickets,
  selectedTicket,
  loading,
  loadVisibleData,
  openTicket,
  newBookId,
  setNewBookId,
  newSubject,
  setNewSubject,
  newDescription,
  setNewDescription,
  creatingTicket,
  createTicket,
}: AuthorDashboardProps) {
  // Automatically open the first ticket when the author's ticket list loads.
  useEffect(() => {
    const firstTicket = tickets[0];
    if (selectedTicket || !firstTicket) return;

    void openTicket(firstTicket);
  }, [openTicket, selectedTicket, tickets]);

  return (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">AUTHOR PORTAL</span>
                  <h1>Your publishing workspace</h1>
                  <p>
                    View your books, raise a query, and stay informed
                    about its progress.
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

              <div className="metric-grid author-metrics">
                <MetricCard
                  icon={<BookOpen size={19} />}
                  label="Your books"
                  value={books.length}
                  detail="Linked to your account"
                />
                <MetricCard
                  icon={<TicketIcon size={19} />}
                  label="Your tickets"
                  value={tickets.length}
                  detail="Support conversations"
                />
                <MetricCard
                  icon={<Clock3 size={19} />}
                  label="In progress"
                  value={
                    tickets.filter(
                      (ticket) => ticket.status === 'In Progress',
                    ).length
                  }
                  detail="Being handled"
                />
                <MetricCard
                  icon={<CheckCircle2 size={19} />}
                  label="Resolved"
                  value={
                    tickets.filter(
                      (ticket) =>
                        ticket.status === 'Resolved' ||
                        ticket.status === 'Closed',
                    ).length
                  }
                  detail="Completed conversations"
                />
              </div>

              <div className="author-top-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your books</h2>
                      <p>Books linked to your author account.</p>
                    </div>
                    <BookOpen size={20} className="muted-icon" />
                  </div>

                  {books.length === 0 ? (
                    <div className="empty-state">
                      <BookOpen size={24} />
                      <p>No books were found for this account.</p>
                    </div>
                  ) : (
                    <div className="book-list">
                      {books.map((book) => (
                        <article className="book-card" key={book.bookId}>
                          <div className="book-card-top">
                            <div className="book-cover">
                              <BookOpen size={22} />
                            </div>

                            <div className="book-info">
                              <strong>{book.title}</strong>
                              <span>{book.genre || 'Genre not available'}</span>
                              <span>ISBN: {book.isbn || 'Not available'}</span>
                            </div>

                            <span
                              className={`status-pill status-${statusClass(
                                book.status || '',
                              )}`}
                            >
                              {book.status || 'Status unavailable'}
                            </span>
                          </div>

                          <div className="book-meta">
                            <div>
                              <span>Publication date</span>
                              <strong>{formatBookDate(book.publicationDate)}</strong>
                            </div>

                            <div>
                              <span>MRP</span>
                              <strong>{formatINR(book.mrp)}</strong>
                            </div>
                          </div>

                          <div className="book-stats">
                            <div className="book-stat">
                              <span>Copies sold</span>
                              <strong>
                                {(book.totalCopiesSold ?? 0).toLocaleString('en-IN')}
                              </strong>
                            </div>

                            <div className="book-stat">
                              <span>Royalty earned</span>
                              <strong>{formatINR(book.totalRoyaltyEarned)}</strong>
                            </div>

                            <div className="book-stat">
                              <span>Royalty paid</span>
                              <strong>{formatINR(book.royaltyPaid)}</strong>
                            </div>

                            <div className="book-stat book-stat-pending">
                              <span>Royalty pending</span>
                              <strong>{formatINR(book.royaltyPending)}</strong>
                            </div>
                          </div>

                          {book.lastRoyaltyPayoutDate && (
                            <div className="book-last-payout">
                              Last royalty payout: {formatBookDate(book.lastRoyaltyPayoutDate)}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="panel create-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Raise a ticket</h2>
                      <p>Tell our team how we can help.</p>
                    </div>
                    <div className="panel-heading-icon">
                      <Plus size={19} />
                    </div>
                  </div>

                  <form
                    className="ticket-form"
                    onSubmit={createTicket}
                  >
                    <label htmlFor="book-select">Related book</label>
                    <select
                      id="book-select"
                      value={newBookId}
                      onChange={(event) =>
                        setNewBookId(event.target.value)
                      }
                    >
                      <option value="">General / Account-level query</option>
                      {books.map((book) => (
                        <option
                          value={book.bookId}
                          key={book.bookId}
                        >
                          {book.title}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="ticket-subject">Subject</label>
                    <input
                      id="ticket-subject"
                      value={newSubject}
                      onChange={(event) =>
                        setNewSubject(event.target.value)
                      }
                      placeholder="What do you need help with?"
                      required
                      maxLength={150}
                    />

                    <label htmlFor="ticket-description">
                      Describe your query
                    </label>
                    <textarea
                      id="ticket-description"
                      value={newDescription}
                      onChange={(event) =>
                        setNewDescription(event.target.value)
                      }
                      placeholder="Share the details our team needs to help…"
                      rows={4}
                      required
                      maxLength={5000}
                    />

                    <label htmlFor="ticket-attachment">
                      Attachment (optional)
                    </label>
                    <input
                      id="ticket-attachment"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      aria-describedby="ticket-attachment-help"
                    />
                    <p
                      id="ticket-attachment-help"
                      style={{
                        margin: '-2px 0 4px',
                        color: '#64748b',
                        fontSize: '12px',
                        lineHeight: 1.5,
                      }}
                    >
                      You can select a supporting document or image. File uploads
                      are not enabled in this demo.
                    </p>

                    <button
                      className="button button-primary button-full"
                      type="submit"
                      disabled={creatingTicket}
                    >
                      <Plus size={17} />
                      {creatingTicket ? 'Creating ticket…' : 'Create ticket'}
                    </button>
                  </form>
                </section>
              </div>

              <section className="panel author-tickets-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Your support tickets</h2>
                    <p>
                      Select a ticket to read its status and conversation.
                    </p>
                  </div>
                  <span className="subtle-count">{tickets.length}</span>
                </div>

                <div className="author-ticket-layout">
                  <div className="author-ticket-list">
                    {tickets.length === 0 ? (
                      <div className="empty-state">
                        <TicketIcon size={25} />
                        <strong>No tickets yet</strong>
                        <p>Use the form above to create your first ticket.</p>
                      </div>
                    ) : (
                      tickets.map((ticket) => (
                        <button
                          className={`ticket-row ${
                            selectedTicket &&
                            idOf(selectedTicket) === idOf(ticket)
                              ? 'ticket-row-active'
                              : ''
                          }`}
                          key={idOf(ticket)}
                          onClick={() => void openTicket(ticket)}
                        >
                          <div className="ticket-row-top">
                            <span className="ticket-ref">
                              #{idOf(ticket).slice(-6)}
                            </span>
                            <span
                              className={`status-pill status-${statusClass(
                                ticket.status,
                              )}`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          <strong className="ticket-subject">
                            {ticket.subject}
                          </strong>
                          <span className="ticket-date">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="author-ticket-detail">
                    {!selectedTicket ? (
                      <div className="empty-detail">
                        <div className="empty-icon">
                          <MessageSquare size={24} />
                        </div>
                        <h2>Your conversation</h2>
                        <p>Select a ticket to view the original message
                          and support replies.</p>
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
                              Opened {formatDate(selectedTicket.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`status-pill status-${statusClass(
                              selectedTicket.status,
                            )}`}
                          >
                            {selectedTicket.status}
                          </span>
                        </div>

                        <div className="message-thread">
                          <article className="thread-message author-message">
                            <div className="thread-message-meta">
                              <strong>Your query</strong>
                              <span>
                                {formatDate(selectedTicket.createdAt)}
                              </span>
                            </div>
                            <p>{selectedTicket.description}</p>
                          </article>

                          {(selectedTicket.messages || []).map(
                            (message, index) => (
                              <article
                                className={`thread-message ${
                                  message.senderRole === 'admin'
                                    ? 'support-message'
                                    : 'author-message'
                                }`}
                                key={message._id || message.id || index}
                              >
                                <div className="thread-message-meta">
                                  <strong>
                                    {message.senderRole === 'admin'
                                      ? 'BookLeaf Support'
                                      : 'You'}
                                  </strong>
                                  <span>{formatDate(message.createdAt)}</span>
                                </div>
                                <p>{formatSupportMessage(message.body)}</p>
                              </article>
                            ),
                          )}
                        </div>

                        <div className="read-only-note">
                          <ShieldCheck size={16} />
                          Replies are handled by the BookLeaf support team.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </>
  );
}
