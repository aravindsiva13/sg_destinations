import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stepper from './Stepper';
import Button from './Button';
import Icon from './Icon';
import { inr } from '../data/site';

interface BookingWidgetProps {
  stayId: string;
  pricePerNight: number;
  stayName: string;
  capacity?: number;
  sticky?: boolean;
}

/** Booking card with date pickers + guest stepper that routes into the booking flow. */
export default function BookingWidget({
  stayId,
  pricePerNight,
  stayName,
  capacity = 10,
  sticky = true,
}: BookingWidgetProps) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return ms > 0 ? Math.round(ms / 86_400_000) : 0;
  }, [checkIn, checkOut]);

  const total = nights * pricePerNight;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ stay: stayId, checkIn, checkOut, guests: String(guests) });
    navigate(`/book?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-card border border-line bg-paper p-5 shadow-sm ${
        sticky ? 'lg:sticky lg:top-24' : ''
      }`}
    >
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-2xl text-ink">{inr(pricePerNight)}</p>
        <span className="text-sm text-muted">/ night</span>
      </div>

      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border border-line">
        <label className="group relative flex flex-col gap-1 border-r border-line p-3 transition-colors hover:bg-forest/5">
          <span className="tag-label !text-[0.6rem]">Check-in</span>
          <div className="relative flex items-center">
            <Icon name="calendar" className="pointer-events-none absolute left-0 h-3.5 w-3.5 text-muted transition-colors group-hover:text-forest" />
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="w-full cursor-pointer bg-transparent pl-6 text-sm text-ink outline-none"
            />
          </div>
        </label>
        <label className="group relative flex flex-col gap-1 p-3 transition-colors hover:bg-forest/5">
          <span className="tag-label !text-[0.6rem]">Check-out</span>
          <div className="relative flex items-center">
            <Icon name="calendar" className="pointer-events-none absolute left-0 h-3.5 w-3.5 text-muted transition-colors group-hover:text-forest" />
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="w-full cursor-pointer bg-transparent pl-6 text-sm text-ink outline-none"
            />
          </div>
        </label>
      </div>

      <div className="mt-3 rounded-lg border border-line p-3">
        <Stepper value={guests} onChange={setGuests} max={capacity} />
      </div>

      {nights > 0 && (
        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>
              {inr(pricePerNight)} × {nights} night{nights > 1 ? 's' : ''}
            </span>
            <span>{inr(total)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-1.5 font-medium text-ink">
            <span>From</span>
            <span>{inr(total)}</span>
          </div>
          <p className="text-[0.7rem] text-muted">Final price shown next, incl. taxes & any offers.</p>
        </div>
      )}

      <Button type="submit" variant="forest" className="mt-4 w-full">
        Check availability
      </Button>

      <p className="mt-3 text-center text-xs text-muted">
        Real-time availability for {stayName} · No charge to check
      </p>
    </form>
  );
}
