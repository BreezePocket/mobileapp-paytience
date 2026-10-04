import { getAsset } from '@/data/assets';
import type { Goal } from '@/domain/pricing';

export const SAFETY_CHECK_MS = 30 * 60_000;

/**
 * App-side view of an on-chain position (PositionRow + DealMeta in the brief).
 * When the backend is connected, this is derived from `fetchPositions` + settlement prices.
 */
export type Deal = {
  id: string; // position address
  symbol: string;
  goal: Goal;
  target: number; // USD per whole token
  lockUnits: number; // Sell High: tokens · Buy Low: USDC
  ifSwapGet: number; // Sell High: USDC · Buy Low: tokens
  pay: number; // upfront pay in USD (USDC)
  pct: number; // % of what you lock
  apr: number;
  priceAtOpen: number;
  openedAt: number; // ms
  endsAt: number; // ms
  finalPrice?: number;
  postedAt?: number; // ms, when the final price was published
  settled: boolean;
  cancelled?: boolean; // closed early by the safety council
  seenOutcome?: boolean; // one-time reveal shown
  partner: string;
  offers: number;
};

export type DealStatus =
  | 'active'
  | 'awaiting_price'
  | 'safety_check'
  | 'ready'
  | 'kept'
  | 'sold'
  | 'bought'
  | 'returned';

export function swapHappens(goal: Goal, final: number, target: number): boolean {
  // landing exactly on the target counts as a swap
  return goal === 'sell' ? final >= target : final <= target;
}

export function dealStatus(d: Deal, now: number): DealStatus {
  if (d.settled) {
    if (d.cancelled || d.finalPrice == null) return 'returned';
    if (!swapHappens(d.goal, d.finalPrice, d.target)) return 'kept';
    return d.goal === 'sell' ? 'sold' : 'bought';
  }
  if (now < d.endsAt) return 'active';
  if (d.finalPrice == null || d.postedAt == null) return 'awaiting_price';
  if (now < d.postedAt + SAFETY_CHECK_MS) return 'safety_check';
  return 'ready';
}

export function isEnded(s: DealStatus): boolean {
  return s === 'kept' || s === 'sold' || s === 'bought' || s === 'returned';
}

export const STATUS_LABEL: Record<DealStatus, string> = {
  active: 'Growing',
  awaiting_price: 'Waiting for final price',
  safety_check: 'Safety check',
  ready: 'Ready',
  kept: 'Kept',
  sold: 'Sold',
  bought: 'Bought',
  returned: 'Returned',
};

export function lockedLabel(d: Deal): string {
  const a = getAsset(d.symbol);
  if (d.goal === 'buy') return `$${d.lockUnits.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `${d.lockUnits.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${a?.ticker ?? d.symbol}`;
}

export function progress(d: Deal, now: number): number {
  const total = d.endsAt - d.openedAt;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - d.openedAt) / total));
}

/** 0..4 growth stage for the garden pot. */
export function growthStage(d: Deal, now: number): number {
  const s = dealStatus(d, now);
  if (s !== 'active') return 4;
  return Math.min(3, Math.floor(progress(d, now) * 4));
}

export function totalEarned(deals: Deal[]): number {
  return deals.reduce((s, d) => s + d.pay, 0);
}
