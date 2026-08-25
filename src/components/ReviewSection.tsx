import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReviews, submitReview } from '../hooks/usePublic';
import { apiErrorMessage } from '../lib/publicApi';
import Button from './Button';
import { PublicLoading } from './PublicState';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function Stars({ n }: { n: number }) {
  return (
    <span className="text-terracotta">
      {'★'.repeat(n)}
      <span className="text-line">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

const inputCls =
  'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-forest';

export default function ReviewSection({ stayId }: { stayId: string }) {
  const { data, isLoading, isError, refetch } = useReviews(stayId);
  const queryClient = useQueryClient();

  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [done, setDone] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => submitReview({ author, email: email || undefined, stayId, rating, title: title || undefined, body }),
    onSuccess: () => {
      setDone(true);
      setAuthor('');
      setEmail('');
      setRating(5);
      setTitle('');
      setBody('');
      void queryClient.invalidateQueries({ queryKey: ['public', 'reviews'] });
    },
    onError: (e) => setLocalError(apiErrorMessage(e, 'Could not submit your review')),
  });

  const canSubmit = author.trim() && body.trim() && /^\S+@\S+\.\S+$/.test(email);

  return (
    <section className="mt-12">
      <h3 className="tag-label">Guest reviews</h3>

      {isLoading ? (
        <div className="mt-4">
          <PublicLoading label="Loading reviews…" />
        </div>
      ) : isError ? (
        <div className="mt-4 rounded-card border border-line bg-paper p-6">
          <p className="text-sm text-muted">Couldn’t load reviews.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : !data || data.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No reviews yet — be the first to share your experience.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {data.map((r) => (
            <div key={r.id} className="rounded-card border border-line bg-paper p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Stars n={r.rating} />
                  <span className="text-sm font-medium text-ink">{r.author}</span>
                </div>
                <span className="text-xs text-muted">{fmt(r.createdAt)}</span>
              </div>
              {r.title && <p className="mt-2 font-serif text-ink">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-muted">{r.body}</p>
              {r.reply && (
                <div className="mt-3 rounded-md bg-cream p-3 text-sm text-muted">
                  <span className="font-medium text-forest">Response: </span>
                  {r.reply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <div className="mt-8 rounded-card border border-line bg-paper p-5">
        <h4 className="font-serif text-lg text-ink">Leave a review</h4>
        {done ? (
          <>
            <p className="mt-2 text-sm text-forest">
              Thank you! Your review has been submitted and will appear once approved.
            </p>
            <Button className="mt-3" variant="outline" size="sm" onClick={() => setDone(false)}>
              Write another
            </Button>
          </>
        ) : (
          <form
            className="mt-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setLocalError(null);
              submit.mutate();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={inputCls}
                placeholder="Your name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
              <input
                className={inputCls}
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">Rating</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRating(n)}
                    className={`text-2xl transition-colors ${n <= rating ? 'text-terracotta' : 'text-line'}`}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <input
              className={inputCls}
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className={`${inputCls} min-h-24 resize-y`}
              placeholder="Share your experience…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            {localError && <p className="text-sm text-terracotta">{localError}</p>}
            <div>
              <Button size="sm" disabled={!canSubmit || submit.isPending}>
                {submit.isPending ? 'Submitting…' : 'Submit review'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}