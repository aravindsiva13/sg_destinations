import { describe, it, expect } from 'vitest';
import { serializeStay, serializeContent, generateBookingCode } from '../serialize.js';
import type { Stay, ContentItem } from '@prisma/client';

describe('serializeStay', () => {
  it('parses JSON-string columns into arrays', () => {
    const raw = {
      id: 's1',
      description: JSON.stringify(['Spacious', 'Quiet']),
      gallery: JSON.stringify(['/a.jpg', '/b.jpg']),
      amenities: JSON.stringify([{ label: 'Pool', icon: 'pool' }]),
    } as Stay;
    const out = serializeStay(raw);
    expect(out.description).toEqual(['Spacious', 'Quiet']);
    expect(out.gallery).toHaveLength(2);
    expect(out.amenities).toEqual([{ label: 'Pool', icon: 'pool' }]);
    expect(out.id).toBe('s1');
  });

  it('falls back to empty arrays for invalid JSON', () => {
    const raw = {
      id: 's2',
      description: 'not-json{{',
      gallery: 'nope',
      amenities: 'oops',
    } as Stay;
    const out = serializeStay(raw);
    expect(out.description).toEqual([]);
    expect(out.gallery).toEqual([]);
    expect(out.amenities).toEqual([]);
  });

  it('falls back to empty arrays for empty string columns', () => {
    const out = serializeStay({ id: 's3', description: '', gallery: '', amenities: '' } as Stay);
    expect(out.description).toEqual([]);
    expect(out.gallery).toEqual([]);
    expect(out.amenities).toEqual([]);
  });
});

describe('serializeContent', () => {
  it('parses body, gallery and tags into arrays', () => {
    const raw = {
      id: 'c1',
      body: JSON.stringify(['para1']),
      gallery: JSON.stringify(['/x.jpg']),
      tags: JSON.stringify(['featured']),
      meta: JSON.stringify({ weight: 3 }),
    } as ContentItem;
    const out = serializeContent(raw);
    expect(out.body).toEqual(['para1']);
    expect(out.gallery).toEqual(['/x.jpg']);
    expect(out.tags).toEqual(['featured']);
    expect(out.meta).toEqual({ weight: 3 });
  });

  it('falls back to defaults on parse failures', () => {
    const raw = {
      id: 'c2',
      body: '{{bad',
      gallery: 'xx',
      tags: '',
      meta: 'zz',
    } as ContentItem;
    const out = serializeContent(raw);
    expect(out.body).toEqual([]);
    expect(out.gallery).toEqual([]);
    expect(out.tags).toEqual([]);
    expect(out.meta).toEqual({});
  });
});

describe('generateBookingCode', () => {
  it('produces a code with the SG- prefix and six characters', () => {
    const code = generateBookingCode();
    expect(code).toMatch(/^SG-[A-Z0-9]{6}$/);
  });

  it('generates varied codes across calls', () => {
    const seen = new Set(Array.from({ length: 50 }, generateBookingCode));
    expect(seen.size).toBeGreaterThan(1);
  });
});