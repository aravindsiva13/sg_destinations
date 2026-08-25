import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import ReviewSection from '../ReviewSection';

const reviewsData = [
  {
    id: 'r1',
    author: 'Anaya Rao',
    rating: 5,
    title: 'Magical',
    body: 'A perfect weekend retreat.',
    reply: null,
    createdAt: '2026-05-01T10:00:00.000Z',
  },
];

const mockUseReviews = vi.fn();
const mockSubmitReview = vi.fn();

vi.mock('../../hooks/usePublic', () => ({
  useReviews: (...args: unknown[]) => mockUseReviews(...args),
  submitReview: (...args: unknown[]) => mockSubmitReview(...args),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

describe('ReviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries reviews for the given stay', () => {
    mockUseReviews.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    render(<ReviewSection stayId="villa-1" />, { wrapper });
    expect(mockUseReviews).toHaveBeenCalledWith('villa-1');
  });

  it('shows an empty message when there are no reviews', () => {
    mockUseReviews.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    render(<ReviewSection stayId="villa-1" />, { wrapper });
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
  });

  it('shows existing reviews with author, title and body', () => {
    mockUseReviews.mockReturnValue({ data: reviewsData, isLoading: false, isError: false, refetch: vi.fn() });
    render(<ReviewSection stayId="villa-1" />, { wrapper });
    expect(screen.getByText('Anaya Rao')).toBeInTheDocument();
    expect(screen.getByText('Magical')).toBeInTheDocument();
    expect(screen.getByText(/perfect weekend retreat/i)).toBeInTheDocument();
  });

  it('submits a review and shows a success message', async () => {
    const user = userEvent.setup();
    mockUseReviews.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    mockSubmitReview.mockResolvedValue({ id: 'r9', status: 'PENDING' });

    render(<ReviewSection stayId="villa-1" />, { wrapper });

    await user.type(screen.getByPlaceholderText('Your name'), 'Priya');
    await user.type(screen.getByPlaceholderText('Your email'), 'priya@example.com');
    await user.type(screen.getByPlaceholderText('Share your experience…'), 'Lovely gardens.');
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    expect(mockSubmitReview).toHaveBeenCalledWith(
      expect.objectContaining({
        author: 'Priya',
        email: 'priya@example.com',
        rating: 5,
        body: 'Lovely gardens.',
        stayId: 'villa-1',
      }),
    );
    expect(await screen.findByText(/has been submitted/i)).toBeInTheDocument();
  });
});