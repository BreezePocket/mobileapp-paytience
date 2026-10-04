import type { Asset } from '@/data/assets';
import type { Board, BoardCell, BoardRow } from '@/live/api';

/** 'sell' = Sell High (covered call, wire `sell_sol`) · 'buy' = Buy Low (cash-secured put, wire `buy_sol`). */
export type Goal = 'sell' | 'buy';
export const PRODUCT_WIRE: Record<Goal, 'sell_sol' | 'buy_sol'> = { sell: 'sell_sol', buy: 'buy_sol' };

/** Desk limits on devnet. The backend enforces them; these only give early, friendly errors. */
export const LIMITS = {
  maxDealUsd: 2500,
  minDealUsd: 10,
};

export type EndDate = { ts: number; days: number };

export type TargetOption = {
  target: number;
  moneyness: number; // target / today's price - 1
  payPerUnit: number; // USD per 1 whole token of the asset
  pct: number; // % of what you lock
  apr: number; // yearly rate %
  chance: number; // rough swap likelihood 0..1, from the market's implied volatility
};

// Standard normal CDF (Abramowitz–Stegun)
function ncdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/** Rough chance the swap happens (shown only under "How is this priced?"). */
export function swapChance(goal: Goal, forward: number, strike: number, vol: number, years: number): number {
  const sd = vol * Math.sqrt(Math.max(years, 1e-6));
  if (!(sd > 0) || !(forward > 0) || !(strike > 0)) return NaN;
  const d2 = (Math.log(forward / strike) - (sd * sd) / 2) / sd;
  return goal === 'sell' ? ncdf(d2) : ncdf(-d2);
}

export function endDatesOf(board: Board | null): EndDate[] {
  return (board?.expiries ?? []).filter((r) => r.quotes.length > 0).map((r) => ({ ts: r.expiry_ts * 1000, days: Math.max(1, Math.round(r.days)) }));
}

export function rowFor(board: Board | null, endTs: number | undefined): BoardRow | undefined {
  return board?.expiries.find((r) => r.expiry_ts * 1000 === endTs);
}

/** The date nearest to 30 days out. */
export function defaultEndDate(dates: EndDate[]): EndDate | undefined {
  return [...dates].sort((a, b) => Math.abs(a.days - 30) - Math.abs(b.days - 30))[0];
}

function toTarget(goal: Goal, board: Board, row: BoardRow, c: BoardCell): TargetOption {
  // the board prices `board.amount`: whole tokens for Sell High, USDC for Buy Low
  const yieldUsd = Number(c.yield_amount) / 1e6;
  const boardUnits = goal === 'sell' ? Number(board.amount) / 10 ** (board.decimals ?? 9) : Number(board.amount) / 1e6;
  const payPerUnit = goal === 'sell' ? yieldUsd / boardUnits : (yieldUsd / boardUnits) * c.fixed_price;
  return {
    target: c.fixed_price,
    moneyness: c.moneyness - 1,
    payPerUnit,
    pct: c.yield_pct,
    apr: c.apr_pct,
    chance: swapChance(goal, row.forward_price, c.fixed_price, c.implied_vol, row.days / 365),
  };
}

/** The backend's targets for one end date, nearest to today's price first. */
export function targetsOf(goal: Goal, board: Board | null, endTs: number | undefined): TargetOption[] {
  const row = rowFor(board, endTs);
  if (!board || !row) return [];
  return row.quotes.map((c) => toTarget(goal, board, row, c)).sort((a, b) => Math.abs(a.moneyness) - Math.abs(b.moneyness));
}

export type DealMath = {
  lockUnits: number; // Sell High: tokens · Buy Low: USDC
  lockUsd: number;
  pay: number;
  ifSwapGet: number; // Sell High: USDC received · Buy Low: tokens received
  dealSizeUsd: number; // size at target (limit check)
};

export function dealMath(goal: Goal, asset: Asset, t: Pick<TargetOption, 'target' | 'payPerUnit'>, amount: number): DealMath {
  if (goal === 'sell') {
    return { lockUnits: amount, lockUsd: amount * asset.price, pay: amount * t.payPerUnit, ifSwapGet: amount * t.target, dealSizeUsd: amount * t.target };
  }
  const units = Math.floor((amount / t.target) * 10 ** 9) / 10 ** 9;
  return { lockUnits: amount, lockUsd: amount, pay: units * t.payPerUnit, ifSwapGet: units, dealSizeUsd: amount };
}

/** "On $100 for ~1 month: get $X–$Y today", from the board row nearest 30 days. */
export function payRangePer100(board: Board | null): { min: number; max: number; days: number } | null {
  const end = defaultEndDate(endDatesOf(board));
  const row = rowFor(board, end?.ts);
  if (!row || !end) return null;
  const vals = row.quotes.map((c) => c.yield_pct);
  return { min: Math.min(...vals), max: Math.max(...vals), days: end.days };
}
