import type { FormEvent } from 'react';
import { AlertCircle, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  email: string;
  password: string;
  loginLoading: boolean;
  errorMessage: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export default function LoginPage({
  email,
  password,
  loginLoading,
  errorMessage,
  setEmail,
  setPassword,
  onSubmit,
}: LoginPageProps) {
  return (
      <div className="login-page">
        <div className="login-panel">
          <div className="brand-lockup">
            <div className="brand-symbol">B</div>
            <div>
              <div className="brand-name">BookLeaf</div>
              <div className="brand-caption">PUBLISHING SUPPORT</div>
            </div>
          </div>

          <div className="login-intro">
            <span className="eyebrow">AUTHOR & OPERATIONS PORTAL</span>
            <h1>Welcome back.</h1>
            <p>
              Manage publishing questions, book updates, and author
              support in one place.
            </p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {errorMessage && (
              <div className="alert alert-error">
                <AlertCircle size={17} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              className="button button-primary button-full"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? 'Signing in…' : 'Sign in'}
              {!loginLoading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="login-footnote">
            <ShieldCheck size={17} />
            Secure sign-in with role-based access
          </div>
        </div>

        <div className="login-aside">
          <div className="aside-mark">
            <BookOpen size={30} />
          </div>
          <span className="eyebrow">MADE FOR AUTHORS</span>
          <h2>Your publishing journey, supported at every step.</h2>
          <p>
            From production progress to royalty queries, keep your
            conversations and publishing support organised.
          </p>
          <div className="aside-stat-row">
            <div>
              <strong>One place</strong>
              <span>For every query</span>
            </div>
            <div>
              <strong>Human review</strong>
              <span>AI-assisted support</span>
            </div>
          </div>
        </div>
      </div>
  );
}
