import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SectionEyebrow from '../components/SectionEyebrow';
import Button from '../components/Button';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { apiErrorMessage } from '../lib/publicApi';
import Seo from '../components/Seo';

const field =
  'w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest';

export default function SignIn() {
  const { signIn, register, forgotPassword } = useCustomerAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in' | 'up' | 'forgot'>('in');
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'forgot') {
        await forgotPassword(f.email);
        setNotice("If that email is registered, we've sent a password reset link.");
      } else if (mode === 'in') {
        await signIn(f.email, f.password);
        navigate('/account');
      } else {
        await register({ name: f.name, email: f.email, password: f.password, phone: f.phone || undefined });
        navigate('/account');
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not sign in'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container-pad grid min-h-[70vh] place-items-center pt-28 pb-20">
  <Seo title="Sign In" path="/signin" />
      <div className="w-full max-w-sm">
        <SectionEyebrow align="left">{mode === 'forgot' ? 'Account recovery' : mode === 'in' ? 'Welcome back' : 'Join us'}</SectionEyebrow>
        <h1 className="mt-2 font-serif text-3xl text-ink">
          {mode === 'forgot' ? 'Reset your password' : mode === 'in' ? 'Sign in to your account' : 'Create your account'}
        </h1>

        {mode !== 'forgot' && (
          <div className="mt-6 inline-flex rounded-full border border-line p-1 text-sm">
            {(['in', 'up'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setNotice(null);
                }}
                className={`rounded-full px-4 py-1.5 transition-colors ${mode === m ? 'bg-forest text-cream' : 'text-muted'}`}
              >
                {m === 'in' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'up' && (
            <label className="block">
              <span className="tag-label">Full name</span>
              <input className={`mt-1.5 ${field}`} value={f.name} onChange={(e) => set('name', e.target.value)} required />
            </label>
          )}
          <label className="block">
            <span className="tag-label">Email</span>
            <input type="email" className={`mt-1.5 ${field}`} value={f.email} onChange={(e) => set('email', e.target.value)} required />
          </label>
          {mode === 'up' && (
            <label className="block">
              <span className="tag-label">Phone</span>
              <input className={`mt-1.5 ${field}`} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" />
            </label>
          )}
          {mode !== 'forgot' && (
            <label className="block">
              <span className="tag-label">Password</span>
              <input type="password" className={`mt-1.5 ${field}`} value={f.password} onChange={(e) => set('password', e.target.value)} required minLength={6} />
            </label>
          )}

          {mode === 'in' && (
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError(null);
                setNotice(null);
              }}
              className="text-xs text-terracotta hover:underline"
            >
              Forgot password?
            </button>
          )}

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

          <Button type="submit" variant="forest" className="w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'forgot' ? 'Send reset link' : mode === 'in' ? 'Sign in' : 'Create account'}
          </Button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('in');
                setError(null);
                setNotice(null);
              }}
              className="w-full text-center text-xs text-muted hover:text-ink"
            >
              ← Back to sign in
            </button>
          )}
        </form>

        {mode !== 'forgot' && (
          <p className="mt-4 text-xs text-muted">
            Sign in to manage your bookings, view receipts and track your stays.
          </p>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          Booked as a guest?{' '}
          <Link to="/find-booking" className="text-terracotta underline underline-offset-2 hover:text-ink">
            Find your booking
          </Link>
        </p>
      </div>
    </section>
  );
}
