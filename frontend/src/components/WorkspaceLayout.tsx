import type { ReactNode } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  CheckCircle2,
  Inbox,
  LogOut,
  MessageSquare,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { Session } from '../types';

interface WorkspaceLayoutProps {
  session: Session;
  ticketCount: number;
  notice: string;
  errorMessage: string;
  onLogout: () => void;
  onDismissNotice: () => void;
  children: ReactNode;
}

export default function WorkspaceLayout({
  session,
  ticketCount,
  notice,
  errorMessage,
  onLogout,
  onDismissNotice,
  children,
}: WorkspaceLayoutProps) {
  const isAdmin = session.user.role === 'admin';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup sidebar-brand">
          <div className="brand-symbol">B</div>
          <div>
            <div className="brand-name">BookLeaf</div>
            <div className="brand-caption">PUBLISHING SUPPORT</div>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <div className="nav-item nav-item-active">
          {isAdmin ? <Inbox size={18} /> : <BookOpen size={18} />}
          <span>{isAdmin ? 'Ticket queue' : 'My workspace'}</span>
          <span className="nav-count">{ticketCount}</span>
        </div>
        <div className="nav-item">
          <MessageSquare size={18} />
          <span>{isAdmin ? 'Author support' : 'My conversations'}</span>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">
              {isAdmin ? <Bot size={20} /> : <AlertCircle size={20} />}
            </div>
            <strong>{isAdmin ? 'AI-assisted support' : 'Need help?'}</strong>
            <p>
              {isAdmin
                ? 'Review every AI draft before sending.'
                : 'Create a ticket and follow its progress.'}
            </p>
          </div>

          <button className="logout-button" onClick={onLogout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            Support workspace <span>/</span>{' '}
            {isAdmin ? 'Ticket queue' : 'My workspace'}
          </div>
          <div className="user-chip">
            <div className="avatar">
              {isAdmin ? <ShieldCheck size={18} /> : <UserRound size={18} />}
            </div>
            <div className="user-chip-text">
              <strong>{session.user.email}</strong>
              <span>{isAdmin ? 'Administrator' : 'Author account'}</span>
            </div>
          </div>
        </header>

        <div className="page-content">
          {(notice || errorMessage) && (
            <div className={`alert ${errorMessage ? 'alert-error' : 'alert-success'}`} role="status">
              {errorMessage ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{errorMessage || notice}</span>
              <button
                className="alert-dismiss"
                onClick={onDismissNotice}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
