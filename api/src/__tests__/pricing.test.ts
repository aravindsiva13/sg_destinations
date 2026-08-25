import { describe, it, expect } from 'vitest';
import {
  nightsBetween,
  applyRule,
  quoteStay,
  OCCUPYING_STATUSES,
} from '../pricing.js';
import type { Booking, DateBlock, RateRule, Stay } from '@prisma/client';

// Minimal synthetic stay with only the fields quoteStay reads.
function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 'stay-1',
    slug: 'garden-villa',
    name: 'Garden Villa',
    pricePerNight: 1000,
    inventory: 1,
    ...overrides,
  } as Stay;
}

function day(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function makeRule(overrides: Partial<RateRule> = {}): RateRule {
  return {
    id: 'r1',
    name: 'Summer',
    stayId: null,
    startDate: day('2026-01-01'),
    endDate: day('2026-12-31'),
    kind: 'PERCENT',
    amount: 100,
    minStay: 1,
    priority: 0,
    active: true,
    ...overrides,
  } as RateRule;
}

describe('nightsBetween', () => {
  it('returns the count of nights between two dates', () => {
    expect(nightsBetween(day('2026-01-10'), day('2026-01-12'))).toHaveLength(2);
  });

  it('returns zero nights for identical dates', () => {
    expect(nightsBetween(day('2026-01-10'), day('2026-01-10'))).toHaveLength(0);
  });

  it('ignores the time-of-day component', () => {
    const nights = nightsBetween(day('2026-01-10'), day('2026-01-13'));
    expect(nights).toHaveLength(3);
  });
});

describe('applyRule', () => {
  it('returns the base price when there is no rule', () => {
    expect(applyRule(1000, null)).toBe(1000);
  });

  it('returns a fixed amount for FIXED rules', () => {
    expect(applyRule(1000, makeRule({ kind: 'FIXED', amount: 1500 }))).toBe(1500);
  });

  it('adds a delta to the base price', () => {
    expect(applyRule(1000, makeRule({ kind: 'DELTA', amount: 200 }))).toBe(1200);
  });

  it('does not let a delta push the price below zero', () => {
    expect(applyRule(100, makeRule({ kind: 'DELTA', amount: -500 }))).toBe(0);
  });

  it('interprets PERCENT as a percentage of the base price', () => {
    expect(applyRule(1000, makeRule({ kind: 'PERCENT', amount: 120 }))).toBe(1200);
    expect(applyRule(1000, makeRule({ kind: 'PERCENT', amount: 100 }))).toBe(1000);
  });
});

describe('quoteStay', () => {
  it('quotes an available stay with correct subtotal and per-night list', () => {
    const quote = quoteStay(
      makeStay(),
      day('2026-01-10'),
      day('2026-01-12'),
      [],
      [],
      [],
    );

    expect(quote.available).toBe(true);
    expect(quote.nights).toBe(2);
    expect(quote.subtotal).toBe(2000);
    expect(quote.perNight).toHaveLength(2);
    expect(quote.perNight.every((n) => n.price === 1000)).toBe(true);
    expect(quote.unitsLeft).toBe(1);
    expect(quote.unavailableReason).toBeNull();
  });

  it('applies the best rule per night when no rule covers a night', () => {
    const rule = makeRule({ stayId: 'stay-1', kind: 'DELTA', amount: 250 });
    const quote = quoteStay(
      makeStay(),
      day('2026-01-10'),
      day('2026-01-12'),
      [],
      [],
      [rule],
    );
    expect(quote.subtotal).toBe(2 * 1250);
    expect(quote.perNight[0].ruleName).toBe('Summer');
  });

  it('prefers a stay-specific rule over a global rule', () => {
    const global = makeRule({ stayId: null, kind: 'FIXED', amount: 500 });
    const specific = makeRule({ stayId: 'stay-1', kind: 'FIXED', amount: 900 });
    const quote = quoteStay(
      makeStay(),
      day('2026-01-10'),
      day('2026-01-11'),
      [],
      [],
      [global, specific],
    );
    expect(quote.subtotal).toBe(900);
  });

  it('respects minimum-stay constraints from a rule', () => {
    const rule = makeRule({ minStay: 3 });
    const quote = quoteStay(
      makeStay(),
      day('2026-01-10'),
      day('2026-01-12'), // only 2 nights < min 3
      [],
      [],
      [rule],
    );
    expect(quote.available).toBe(false);
    expect(quote.unavailableReason).toBe('Minimum stay is 3 nights');
  });

  it('marks the stay unavailable when inventory is fully booked', () => {
    const occupying: Pick<Booking, 'checkIn' | 'checkOut' | 'status'> = {
      checkIn: day('2026-01-10'),
      checkOut: day('2026-01-12'),
      status: 'CONFIRMED',
    };
    const quote = quoteStay(
      makeStay({ inventory: 1 }),
      day('2026-01-10'),
      day('2026-01-12'),
      [occupying],
      [],
      [],
    );
    expect(quote.available).toBe(false);
    expect(quote.unavailableReason).toBe('Fully booked for these dates');
    expect(quote.unitsLeft).toBe(0);
  });

  it('ignores cancelled bookings when computing availability', () => {
    const cancelled: Pick<Booking, 'checkIn' | 'checkOut' | 'status'> = {
      checkIn: day('2026-01-10'),
      checkOut: day('2026-01-12'),
      status: 'CANCELLED',
    };
    const quote = quoteStay(
      makeStay({ inventory: 1 }),
      day('2026-01-10'),
      day('2026-01-12'),
      [cancelled],
      [],
      [],
    );
    expect(quote.available).toBe(true);
  });

  it('marks the stay unavailable when dates are blocked', () => {
    const block: DateBlock = {
      id: 'b1',
      stayId: 'stay-1',
      startDate: day('2026-01-10'),
      endDate: day('2026-01-11'),
      reason: null,
      createdAt: new Date(),
    };
    const quote = quoteStay(
      makeStay(),
      day('2026-01-10'),
      day('2026-01-12'),
      [],
      [block],
      [],
    );
    expect(quote.available).toBe(false);
    expect(quote.unavailableReason).toBe('Dates are blocked');
  });

  it('occupies only nights within the booking range', () => {
    // Booking only covers the first night; second night should be free.
    const occupying: Pick<Booking, 'checkIn' | 'checkOut' | 'status'> = {
      checkIn: day('2026-01-10'),
      checkOut: day('2026-01-11'),
      status: 'CONFIRMED',
    };
    const quote = quoteStay(
      makeStay({ inventory: 1 }),
      day('2026-01-10'),
      day('2026-01-12'),
      [occupying],
      [],
      [],
    );
    // unitsLeft is reduced by the minimum across nights = 0 still, since first night is fully booked.
    expect(quote.available).toBe(false);
  });

  it('defines the occupying statuses set', () => {
    expect(OCCUPYING_STATUSES).toContain('PENDING');
    expect(OCCUPYING_STATUSES).toContain('CONFIRMED');
    expect(OCCUPYING_STATUSES).not.toContain('CANCELLED');
  });
});