import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import FindBooking from '../FindBooking';

const mockGet = vi.fn();

vi.mock('../../lib/publicApi', () => ({
  publicApi: { get: (...args: unknown[]) => mockGet(...args) },
  apiErrorMessage: (e: unknown) => (e as { message?: string })?.message ?? 'Something went wrong',
}));

vi.mock('../../hooks/usePublic', () => ({
  usePaymentConfig: () => ({ data: { provider: 'mock' }, isLoading: false }),
  createPaymentOrder: vi.fn(),
  verifyPayment: vi.fn(),
}));

function wrapper(initialEntries: string[] = ['/find-booking']) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('FindBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pre-fills code and email from the query string', () => {
    render(<FindBooking />, { wrapper: wrapper(['/find-booking?code=SG-ABC123&email=test%40x.com']) });
    expect(screen.getByDisplayValue('SG-ABC123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@x.com')).toBeInTheDocument();
  });

  it('shows an error message when no booking matches', async () => {
    const user = userEvent.setup();
    mockGet.mockRejectedValue({ message: 'No booking found for that code and email' });
    render(<FindBooking />, { wrapper: wrapper() });

    await user.type(screen.getByPlaceholderText(/e.g. SG/i), 'SG-ABC123');
    await user.type(screen.getByLabelText(/booking email/i), 'test@x.com');
    await user.click(screen.getByRole('button', { name: /find booking/i }));

    expect(await screen.findByText(/no booking found/i)).toBeInTheDocument();
  });

  it('shows the booking and a pay-balance button when found', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 'b1',
        code: 'SG-ABC123',
        checkIn: '2026-12-01T00:00:00.000Z',
        checkOut: '2026-12-03T00:00:00.000Z',
        nights: 2,
        guests: 2,
        amount: 9000,
        amountPaid: 4500,
        balanceDue: 4500,
        status: 'RESERVED',
        paymentStatus: 'PARTIAL',
        stay: { name: 'Garden Villa', slug: 'garden-villa', heroImage: 'https://example.com/h.jpg' },
      },
    });
    const user = userEvent.setup();
    render(<FindBooking />, { wrapper: wrapper() });

    await user.type(screen.getByPlaceholderText(/e.g. SG/i), 'SG-ABC123');
    await user.type(screen.getByLabelText(/booking email/i), 'test@x.com');
    await user.click(screen.getByRole('button', { name: /find booking/i }));

    expect(await screen.findByText('Garden Villa')).toBeInTheDocument();
    expect(screen.getByText('₹9,000')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /pay balance/i })).toBeInTheDocument();
  });
});