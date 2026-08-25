import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import BookingWidget from '../BookingWidget';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('BookingWidget', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the nightly price and stay name', () => {
    render(<BookingWidget stayId="villa-1" pricePerNight={4500} stayName="Garden Villa" />);
    expect(screen.getByText('₹4,500')).toBeInTheDocument();
    expect(screen.getByText('/ night')).toBeInTheDocument();
    expect(screen.getByText(/Garden Villa/i)).toBeInTheDocument();
  });

  it('renders date inputs and a submit button', () => {
    render(<BookingWidget stayId="villa-1" pricePerNight={4500} stayName="Garden Villa" />);
    expect(screen.getByLabelText(/check-in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-out/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check availability/i })).toBeInTheDocument();
  });

  it('starts with the default guest count of 2', () => {
    render(<BookingWidget stayId="villa-1" pricePerNight={4500} stayName="Garden Villa" />);
    expect(screen.getByText('Guests')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('navigates to the booking flow with query params on submit', async () => {
    const user = userEvent.setup();
    render(<BookingWidget stayId="villa-1" pricePerNight={4500} stayName="Garden Villa" />);

    fireEvent.change(screen.getByLabelText(/check-in/i), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText(/check-out/i), { target: { value: '2026-09-12' } });

    await user.click(screen.getByRole('button', { name: /check availability/i }));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/book?stay=villa-1&checkIn=2026-09-10&checkOut=2026-09-12&guests=2'
    );
  });

  it('uses the selected guest count when navigating', async () => {
    const user = userEvent.setup();
    render(<BookingWidget stayId="villa-1" pricePerNight={4500} stayName="Garden Villa" />);

    fireEvent.change(screen.getByLabelText(/check-in/i), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText(/check-out/i), { target: { value: '2026-09-11' } });

    await user.click(screen.getByRole('button', { name: 'Increase guests' }));
    await user.click(screen.getByRole('button', { name: /check availability/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/book?stay=villa-1&checkIn=2026-09-10&checkOut=2026-09-11&guests=3');
  });

  it('does not navigate when dates are missing', async () => {
    const user = userEvent.setup();
    render(<BookingWidget stayId="villa-1" pricePerNight={4500} stayName="Garden Villa" />);

    // Both date inputs are required; submitting without them should not navigate.
    await user.click(screen.getByRole('button', { name: /check availability/i }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows the total once valid dates are selected', () => {
    render(<BookingWidget stayId="villa-1" pricePerNight={4500} stayName="Garden Villa" />);

    expect(screen.queryByText('From')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/check-in/i), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText(/check-out/i), { target: { value: '2026-09-12' } });

    expect(screen.getByText('₹4,500 × 2 nights')).toBeInTheDocument();
    // Total appears twice: in the cost breakdown line and the "From" row.
    expect(screen.getAllByText('₹9,000')).toHaveLength(2);
    expect(screen.getByText('From')).toBeInTheDocument();
  });

  it('does not show a total when checkout is before checkin', () => {
    render(<BookingWidget stayId="villa-1" pricePerNight={4500} stayName="Garden Villa" />);

    fireEvent.change(screen.getByLabelText(/check-in/i), { target: { value: '2026-09-12' } });
    fireEvent.change(screen.getByLabelText(/check-out/i), { target: { value: '2026-09-10' } });

    expect(screen.queryByText('From')).not.toBeInTheDocument();
  });
});