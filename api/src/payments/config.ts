import { prisma } from '../prisma.js';
import type { PaymentProvider } from '../constants.js';

/**
 * Payment configuration, stored as a single JSON blob in SiteSetting under the
 * key `payments`. Secrets (keySecret, webhookSecret) live ONLY here on the
 * server and are never returned by the public settings endpoint.
 */
/** One band of the refund policy: "≥ N days before check-in → X% refund". */
export interface RefundTier {
  minDaysBefore: number;
  refundPercent: number;
}

/**
 * Admin-configurable refund policy. A booking cancelled within
 * `fullRefundWithinHours` of being made is always refunded 100%; otherwise the
 * refund % is taken from the highest tier whose `minDaysBefore` is still met.
 */
export interface RefundPolicy {
  fullRefundWithinHours: number;
  tiers: RefundTier[];
}

export interface PaymentConfig {
  provider: PaymentProvider;
  testMode: boolean;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  methods: string[]; // card | upi | netbanking | wallet | emi
  depositPercent: number; // 0 = full payment, else % collected now
  refundPolicy: RefundPolicy;
  // Legacy two-field policy, kept only to migrate older configs into refundPolicy.
  cancellation?: {
    freeUntilDays: number;
    penaltyPercent: number;
  };
}

const DEFAULT_REFUND_POLICY: RefundPolicy = {
  fullRefundWithinHours: 24,
  tiers: [
    { minDaysBefore: 7, refundPercent: 100 },
    { minDaysBefore: 2, refundPercent: 50 },
    { minDaysBefore: 0, refundPercent: 0 },
  ],
};

const DEFAULT_CONFIG: PaymentConfig = {
  provider: 'mock',
  testMode: true,
  keyId: '',
  keySecret: '',
  webhookSecret: '',
  methods: ['card', 'upi', 'netbanking', 'wallet'],
  depositPercent: 0,
  refundPolicy: DEFAULT_REFUND_POLICY,
};

/** Sort tiers most-generous-first so lookups can pick the first match. */
function normalizePolicy(p: RefundPolicy): RefundPolicy {
  return {
    fullRefundWithinHours: p.fullRefundWithinHours,
    tiers: [...p.tiers].sort((a, b) => b.minDaysBefore - a.minDaysBefore),
  };
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: 'payments' } });
  if (!row) return DEFAULT_CONFIG;
  try {
    const stored = JSON.parse(row.value) as Partial<PaymentConfig>;
    const merged = { ...DEFAULT_CONFIG, ...stored };
    // Migrate an old { freeUntilDays, penaltyPercent } policy into tiers.
    if (!stored.refundPolicy && stored.cancellation) {
      merged.refundPolicy = {
        fullRefundWithinHours: 24,
        tiers: [
          { minDaysBefore: stored.cancellation.freeUntilDays, refundPercent: 100 },
          { minDaysBefore: 0, refundPercent: Math.max(0, 100 - stored.cancellation.penaltyPercent) },
        ],
      };
    }
    merged.refundPolicy = normalizePolicy(merged.refundPolicy);
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function savePaymentConfig(patch: Partial<PaymentConfig>): Promise<PaymentConfig> {
  const current = await getPaymentConfig();
  const next: PaymentConfig = {
    ...current,
    ...patch,
    refundPolicy: normalizePolicy(patch.refundPolicy ?? current.refundPolicy),
  };
  delete next.cancellation; // fully migrated to refundPolicy
  await prisma.siteSetting.upsert({
    where: { key: 'payments' },
    create: { key: 'payments', value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

/** Public-safe view: provider/keyId/methods only — never the secrets. */
export function publicConfig(c: PaymentConfig) {
  return {
    provider: c.provider,
    testMode: c.testMode,
    keyId: c.keyId,
    methods: c.methods,
    depositPercent: c.depositPercent,
  };
}

/** Admin view: masks secrets to booleans so the UI shows "set / not set". */
export function adminConfig(c: PaymentConfig) {
  return {
    provider: c.provider,
    testMode: c.testMode,
    keyId: c.keyId,
    keySecretSet: Boolean(c.keySecret),
    webhookSecretSet: Boolean(c.webhookSecret),
    methods: c.methods,
    depositPercent: c.depositPercent,
    refundPolicy: c.refundPolicy,
  };
}
