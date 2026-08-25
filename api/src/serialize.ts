import type { ContentItem, Stay } from '@prisma/client';

/** Parse the JSON-string columns on a Stay into real arrays for API output. */
export function serializeStay(stay: Stay) {
  return {
    ...stay,
    description: safeParse<string[]>(stay.description, []),
    gallery: safeParse<string[]>(stay.gallery, []),
    amenities: safeParse<{ label: string; icon: string }[]>(stay.amenities, []),
  };
}

/** Parse the JSON-string columns on a ContentItem for API output. */
export function serializeContent(item: ContentItem) {
  return {
    ...item,
    body: safeParse<string[]>(item.body, []),
    gallery: safeParse<string[]>(item.gallery, []),
    tags: safeParse<string[]>(item.tags, []),
    meta: safeParse<Record<string, unknown>>(item.meta, {}),
  };
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Booking reference like "SG-7F3K9Q". */
export function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SG-${s}`;
}
