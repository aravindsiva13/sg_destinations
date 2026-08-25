import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SectionEyebrow from '../components/SectionEyebrow';
import Button from '../components/Button';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { apiErrorMessage } from '../lib/publicApi';
import Seo from '../components/Seo';

const field =
  'w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { resetPassword } = useCustomerAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      setError(apiErrorMessage(err, 'This reset link is invalid or has expired.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container-pad grid min-h-[70vh] place-items-center pt-28 pb-20">
  <Seo title="Reset Password" path="/reset-password" />
      <div className="w-full max-w-sm">
        <SectionEyebrow align="left">Account recovery</SectionEyebrow>
        <h1 className="mt-2 font-serif text-3xl text-ink">Choose a new password</h1>

        {!token ? (
          <p className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            This link is missing its reset token. Please use the link from your email, or{' '}
            <Link to="/signin" className="underline">
              request a new one
            </Link>
            .
          </p>
        ) : done ? (
          <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Password updated — redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="tag-label">New password</span>
              <input
                type="password"
                className={`mt-1.5 ${field}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            <label className="block">
              <span className="tag-label">Confirm password</span>
              <input
                type="password"
                className={`mt-1.5 ${field}`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </label>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <Button type="submit" variant="forest" className="w-full" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
