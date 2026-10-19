import { useEffect, useState, type FormEvent } from 'react';
import api from './lib/api.js';
import './App.css';
import AdminDashboard from './pages/AdminDashboard';
import AuthorDashboard from './pages/AuthorDashboard';
import LoginPage from './pages/LoginPage';
import WorkspaceLayout from './components/WorkspaceLayout';
import { initialFilters } from './constants';
import { friendlyError, getStoredSession, idOf, toArray } from './utils/formatters';
import type { AuthUser, Book, InternalNote, Session, Ticket, TicketFilters } from './types';

function App() {
  const [session, setSession] = useState<Session | null>(getStoredSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [books, setBooks] = useState<Book[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [notesTicketId, setNotesTicketId] = useState('');
  const [internalNoteDraft, setInternalNoteDraft] = useState('');
  const [loadingInternalNotes, setLoadingInternalNotes] = useState(false);
  const [savingInternalNote, setSavingInternalNote] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>(initialFilters);
  const [draft, setDraft] = useState('');
  const [draftSource, setDraftSource] = useState<'ai' | 'template' | null>(null);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);
  const [newBookId, setNewBookId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(false);

  const isAdmin = session?.user.role === 'admin';

  async function loadVisibleData(showSpinner = false): Promise<void> {
    if (!session) return;
    if (showSpinner) setLoading(true);
    setErrorMessage('');

    try {
      if (session.user.role === 'admin') {
        const response = await api.get('/admin/tickets', {
          params: {
            status: filters.status || undefined,
            category: filters.category || undefined,
            priority: filters.priority || undefined,
            dateFrom: filters.dateFrom
              ? new Date(`${filters.dateFrom}T00:00:00`).toISOString()
              : undefined,
            dateTo: filters.dateTo
              ? new Date(`${filters.dateTo}T23:59:59.999`).toISOString()
              : undefined,
          },
        });
        const nextTickets = toArray<Ticket>(response.data);
        setTickets(nextTickets);
        setSelectedTicket((current) => {
          if (!current) return current;
          const latest = nextTickets.find((ticket) => idOf(ticket) === idOf(current));
          return latest
            ? {
                ...current,
                ...latest,
                aiDraftResponse: current.aiDraftResponse ?? latest.aiDraftResponse,
                aiDraftSource: current.aiDraftSource ?? latest.aiDraftSource,
                aiDraftWarning: current.aiDraftWarning ?? latest.aiDraftWarning,
              }
            : current;
        });
      } else {
        const [booksResponse, ticketsResponse] = await Promise.all([
          api.get('/author/books'),
          api.get('/author/tickets'),
        ]);
        setBooks(toArray<Book>(booksResponse.data));
        setTickets(toArray<Ticket>(ticketsResponse.data));
      }
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }


  async function loadInternalNotes(ticketId: string): Promise<void> {
    if (!ticketId || session?.user.role !== 'admin') return;
    setLoadingInternalNotes(true);
    setErrorMessage('');
    try {
      const response = await api.get(`/admin/tickets/${ticketId}/notes`);
      setInternalNotes(toArray<InternalNote>(response.data));
      setNotesTicketId(ticketId);
    } catch (error: unknown) {
      setInternalNotes([]);
      setNotesTicketId(ticketId);
      setErrorMessage(friendlyError(error));
    } finally {
      setLoadingInternalNotes(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    let active = true;
    const refresh = async (showSpinner: boolean) => {
      if (!active) return;
      await loadVisibleData(showSpinner);
    };
    void refresh(true);
    const interval = window.setInterval(() => void refresh(false), 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
    // Reload when session or any server-side filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, filters.status, filters.category, filters.priority, filters.dateFrom, filters.dateTo]);

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoginLoading(true);
    setErrorMessage('');
    setNotice('');
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });
      const nextSession: Session = {
        accessToken: response.data.accessToken,
        user: response.data.user as AuthUser,
      };
      localStorage.setItem('bookleaf_token', nextSession.accessToken);
      localStorage.setItem('bookleaf_user', JSON.stringify(nextSession.user));
      setSession(nextSession);
      setPassword('');
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout(): void {
    localStorage.removeItem('bookleaf_token');
    localStorage.removeItem('bookleaf_user');
    setSession(null);
    setTickets([]);
    setBooks([]);
    setSelectedTicket(null);
    setInternalNotes([]);
    setNotesTicketId('');
    setInternalNoteDraft('');
    setDraft('');
    setDraftSource(null);
    setDraftWarning(null);
    setNotice('');
    setErrorMessage('');
  }

  async function openTicket(ticket: Ticket): Promise<void> {
    setSelectedTicket(ticket);
    setDraft(ticket.aiDraftResponse ?? '');
    setDraftSource(ticket.aiDraftSource ?? null);
    setDraftWarning(ticket.aiDraftWarning ?? null);
    setNotice('');
    setErrorMessage('');
    if (session?.user.role === 'admin') {
      const ticketId = idOf(ticket);
      setInternalNotes([]);
      setNotesTicketId(ticketId);
      setInternalNoteDraft('');
      await loadInternalNotes(ticketId);
      return;
    }
    if (session?.user.role !== 'author') return;
    try {
      const response = await api.get(`/author/tickets/${idOf(ticket)}`);
      setSelectedTicket(response.data as Ticket);
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    }
  }

  async function createTicket(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setCreatingTicket(true);
    setNotice('');
    setErrorMessage('');
    try {
      await api.post('/author/tickets', {
        ...(newBookId ? { bookId: newBookId } : {}),
        subject: newSubject.trim(),
        description: newDescription.trim(),
      });
      setNewBookId('');
      setNewSubject('');
      setNewDescription('');
      setNotice('Your ticket was created successfully.');
      await loadVisibleData();
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      setCreatingTicket(false);
    }
  }

  async function generateDraft(): Promise<void> {
    if (!selectedTicket) return;
    setGeneratingDraft(true);
    setNotice('');
    setErrorMessage('');
    try {
      const response = await api.post(`/admin/tickets/${idOf(selectedTicket)}/ai-draft`);
      const generated = response.data.aiDraftResponse as string;
      const source: 'ai' | 'template' =
        response.data.draftSource === 'template' ? 'template' : 'ai';
      const warning =
        typeof response.data.warning === 'string' ? response.data.warning : null;

      setDraft(generated);
      setDraftSource(source);
      setDraftWarning(warning);
      setSelectedTicket((current) => current ? {
        ...current,
        aiDraftResponse: generated,
        aiDraftSource: source,
        aiDraftWarning: warning,
      } : current);
      setNotice(
        source === 'template'
          ? 'A policy-based template was loaded. Review and edit it before sending.'
          : 'AI draft generated. Review and edit it before sending.',
      );
    } catch (error: unknown) {
      setErrorMessage(`${friendlyError(error)} You can still write a reply manually.`);
    } finally {
      setGeneratingDraft(false);
    }
  }

  async function sendReply(): Promise<void> {
    if (!selectedTicket || !draft.trim()) return;
    setSendingReply(true);
    setNotice('');
    setErrorMessage('');
    try {
      await api.post(`/admin/tickets/${idOf(selectedTicket)}/messages`, { body: draft.trim() });
      setNotice('Reply sent to the author.');
      setDraft('');
      setDraftSource(null);
      setDraftWarning(null);
      setSelectedTicket((current) => current ? { ...current, aiDraftResponse: undefined, aiDraftSource: null, aiDraftWarning: null } : current);
      await loadVisibleData();
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      setSendingReply(false);
    }
  }


  async function addInternalNote(): Promise<void> {
    if (!selectedTicket || !internalNoteDraft.trim() || session?.user.role !== 'admin') return;
    setSavingInternalNote(true);
    setNotice('');
    setErrorMessage('');
    try {
      const response = await api.post(
        `/admin/tickets/${idOf(selectedTicket)}/notes`,
        { body: internalNoteDraft.trim() },
      );
      const createdNote = response.data as InternalNote;
      setInternalNotes((current) =>
        notesTicketId === idOf(selectedTicket) ? [...current, createdNote] : [createdNote],
      );
      setNotesTicketId(idOf(selectedTicket));
      setInternalNoteDraft('');
      setNotice('Internal note saved. It is visible only to administrators.');
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      setSavingInternalNote(false);
    }
  }

  async function updateStatus(status: string): Promise<void> {
    if (!selectedTicket) return;
    setUpdatingTicket(true);
    setNotice('');
    setErrorMessage('');
    try {
      await api.patch(`/admin/tickets/${idOf(selectedTicket)}`, { status });
      setSelectedTicket((current) => current ? { ...current, status } : current);
      setNotice(`Ticket status updated to ${status}.`);
      await loadVisibleData();
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      setUpdatingTicket(false);
    }
  }

  async function updateCategory(category: string): Promise<void> {
    if (!selectedTicket || selectedTicket.category === category) return;

    setUpdatingTicket(true);
    setNotice('');
    setErrorMessage('');

    try {
      await api.patch(`/admin/tickets/${idOf(selectedTicket)}`, { category });
      setSelectedTicket((current) =>
        current ? { ...current, category } : current,
      );
      setNotice(`Ticket category updated to ${category}.`);
      await loadVisibleData();
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      setUpdatingTicket(false);
    }
  }

  async function updatePriority(priority: string): Promise<void> {
    if (!selectedTicket || selectedTicket.priority === priority) return;

    setUpdatingTicket(true);
    setNotice('');
    setErrorMessage('');

    try {
      await api.patch(`/admin/tickets/${idOf(selectedTicket)}`, { priority });
      setSelectedTicket((current) =>
        current ? { ...current, priority } : current,
      );
      setNotice(`Ticket priority updated to ${priority}.`);
      await loadVisibleData();
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      setUpdatingTicket(false);
    }
  }

  async function assignToMe(): Promise<void> {
    if (!selectedTicket) return;
    setUpdatingTicket(true);
    setNotice('');
    setErrorMessage('');
    try {
      await api.post(`/admin/tickets/${idOf(selectedTicket)}/assign-to-me`);
      setNotice('Ticket assigned to you.');
      await loadVisibleData();
    } catch (error: unknown) {
      setErrorMessage(friendlyError(error));
    } finally {
      setUpdatingTicket(false);
    }
  }

  if (!session) {
    return (
      <LoginPage
        email={email}
        password={password}
        loginLoading={loginLoading}
        errorMessage={errorMessage}
        setEmail={setEmail}
        setPassword={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <WorkspaceLayout
      session={session}
      ticketCount={tickets.length}
      notice={notice}
      errorMessage={errorMessage}
      onLogout={handleLogout}
      onDismissNotice={() => {
        setNotice('');
        setErrorMessage('');
      }}
    >
      {isAdmin ? (
        <AdminDashboard
          tickets={tickets}
          selectedTicket={selectedTicket}
          filters={filters}
          setFilters={setFilters}
          loading={loading}
          loadVisibleData={loadVisibleData}
          openTicket={openTicket}
          draft={draft}
          setDraft={setDraft}
          draftSource={draftSource}
          draftWarning={draftWarning}
          generatingDraft={generatingDraft}
          generateDraft={generateDraft}
          sendingReply={sendingReply}
          sendReply={sendReply}
          updatingTicket={updatingTicket}
          updateStatus={updateStatus}
          updateCategory={updateCategory}
          updatePriority={updatePriority}
          internalNotes={selectedTicket && notesTicketId === idOf(selectedTicket) ? internalNotes : []}
          internalNoteDraft={internalNoteDraft}
          setInternalNoteDraft={setInternalNoteDraft}
          loadingInternalNotes={loadingInternalNotes}
          savingInternalNote={savingInternalNote}
          loadInternalNotes={() => selectedTicket ? loadInternalNotes(idOf(selectedTicket)) : Promise.resolve()}
          addInternalNote={addInternalNote}
          assignToMe={assignToMe}
        />
      ) : (
        <AuthorDashboard
          books={books}
          tickets={tickets}
          selectedTicket={selectedTicket}
          loading={loading}
          loadVisibleData={loadVisibleData}
          openTicket={openTicket}
          newBookId={newBookId}
          setNewBookId={setNewBookId}
          newSubject={newSubject}
          setNewSubject={setNewSubject}
          newDescription={newDescription}
          setNewDescription={setNewDescription}
          creatingTicket={creatingTicket}
          createTicket={createTicket}
        />
      )}
    </WorkspaceLayout>
  );
}

export default App;
