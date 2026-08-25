import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { apiErrorMessage } from '../lib/apiClient';
import AdminButton from '../components/ui/AdminButton';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLogin() {
  const { user, ready, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (ready && user) {
    const from = (location.state as { from?: string })?.from ?? '/admin';
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: string })?.from ?? '/admin';
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Unable to sign in'));
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-forest-deep lg:block">
        <img
          src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"
          alt="Lush resort garden at dusk"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-cream">
          <span className="font-serif text-2xl">Shraddha Garden</span>
          <div>
            <p className="eyebrow mb-3 text-cream/80">Admin Portal</p>
            <h2 className="max-w-sm font-serif text-4xl leading-tight text-cream">
              A sanctuary of celebration and stays.
            </h2>
          </div>
          <p className="text-xs text-cream/50">© {new Date().getFullYear()} Shraddha Garden Resort</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid place-items-center bg-cream px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage the resort.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register('email')}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{serverError}</p>
            )}

            <AdminButton type="submit" loading={isSubmitting} className="w-full">
              Sign in
            </AdminButton>
          </form>
        </div>
      </div>
    </div>
  );
}
