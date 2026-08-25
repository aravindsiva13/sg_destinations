import type { Booking, DateBlock, RateRule, Stay } from '@prisma/client';

/** Statuses that occupy inventory (i.e. block a unit for those nights). */
export const OCCUPYING_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'];

const MS_PER_DAY = 86_400_000;

/** Midnight (local) for a date, so night comparisons ignore time-of-day. */
function dayStart(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** List of night-start timestamps in [checkIn, checkOut). */
export function nightsBetween(checkIn: Date, checkOut: Date): number[] {
  const out: number[] = [];
  for (let t = dayStart(checkIn); t < dayStart(checkOut); t += MS_PER_DAY) out.push(t);
  return out;
}

/** Does [aStart,aEnd) overlap the single night starting at `night`? */
function rangeCoversNight(start: Date, end: Date, night: number): boolean {
  return dayStart(start) <= night && dayStart(end) > night;
}

/** The most specific, highest-priority active rule covering a given night. */
function ruleForNight(rules: RateRule[], stayId: string, night: number): RateRule | null {
  const matches = rules.filter(
    (r) =>
      r.active &&
      (r.stayId === stayId || r.stayId === null) &&
      dayStart(r.startDate) <= night &&
      dayStart(r.endDate) > night,
  );
  if (matches.length === 0) return null;
  // Prefer stay-specific over global, then higher priority.
  matches.sort((a, b) => {
    const spec = Number(b.stayId !== null) - Number(a.stayId !== null);
    return spec !== 0 ? spec : b.priority - a.priority;
  });
  return matches[0];
}

/** Apply a rule to a base price. */
export function applyRule(base: number, rule: RateRule | null): number {
  if (!rule) return base;
  if (rule.kind === 'FIXED') return rule.amount;
  if (rule.kind === 'DELTA') return Math.max(0, base + rule.amount);
  // PERCENT — amount is a percentage of base (e.g. 120 => +20%)
  return Math.round((base * rule.amount) / 100);
}

export interface NightQuote {
  date: string; // YYYY-MM-DD
  price: number;
  ruleName: string | null;
}

export interface StayQuote {
  stayId: string;
  nights: number;
  perNight: NightQuote[];
  subtotal: number;
  available: boolean;
  unavailableReason: string | null;
  minStay: number;
  unitsLeft: number;
}

/**
 * Build a per-night price + availability quote for one stay over [checkIn,checkOut).
 * Pure function: all data is passed in so routes can batch the DB reads.
 */
export function quoteStay(
  stay: Stay,
  checkIn: Date,
  checkOut: Date,
  bookings: Pick<Booking, 'checkIn' | 'checkOut' | 'status'>[],
  blocks: DateBlock[],
  rules: RateRule[],
): StayQuote {
  const nights = nightsBetween(checkIn, checkOut);
  const perNight: NightQuote[] = [];
  let minStay = 1;
  let unitsLeft = stay.inventory;
  let blocked = false;

  for (const night of nights) {
    const rule = ruleForNight(rules, stay.id, night);
    if (rule) minStay = Math.max(minStay, rule.minStay);
    perNight.push({
      date: new Date(night).toISOString().slice(0, 10),
      price: applyRule(stay.pricePerNight, rule),
      ruleName: rule?.name ?? null,
    });

    // Inventory used this night by occupying bookings.
    const used = bookings.filter(
      (b) => OCCUPYING_STATUSES.includes(b.status) && rangeCoversNight(b.checkIn, b.checkOut, night),
    ).length;
    unitsLeft = Math.min(unitsLeft, stay.inventory - used);

    if (blocks.some((bl) => rangeCoversNight(bl.startDate, bl.endDate, night))) blocked = true;
  }

  const subtotal = perNight.reduce((s, n) => s + n.price, 0);

  let available = true;
  let reason: string | null = null;
  if (blocked) {
    available = false;
    reason = 'Dates are blocked';
  } else if (unitsLeft <= 0) {
    available = false;
    reason = 'Fully booked for these dates';
  } else if (nights.length < minStay) {
    available = false;
    reason = `Minimum stay is ${minStay} night${minStay === 1 ? '' : 's'}`;
  }

  return {
    stayId: stay.id,
    nights: nights.length,
    perNight,
    subtotal,
    available,
    unavailableReason: reason,
    minStay,
    unitsLeft: Math.max(0, unitsLeft),
  };
}
