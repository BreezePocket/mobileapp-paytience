/** Live offer boards from the backend, cached briefly and shared between screens. */
import { useEffect, useState } from 'react';

import type { Goal } from '@/domain/pricing';
import { api } from '@/store/app-store';

import type { Board } from './api';

type Entry = { board: Board | null; error: string | null; at: number; pending: Promise<void> | null };
const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
const key = (symbol: string, goal: Goal) => `${symbol}:${goal}`;

function load(symbol: string, goal: Goal, maxAgeMs: number): void {
  const k = key(symbol, goal);
  const e = cache.get(k) ?? { board: null, error: null, at: 0, pending: null };
  cache.set(k, e);
  if (e.pending || Date.now() - e.at < maxAgeMs) return;
  e.pending = api
    .board({ asset: symbol, product: goal === 'sell' ? 'sell_sol' : 'buy_sol', amount: goal === 'sell' ? 1 : 100 })
    .then((board) => {
      e.board = board;
      e.error = null;
    })
    .catch((err: unknown) => {
      e.error = err instanceof Error ? err.message : String(err);
    })
    .finally(() => {
      e.at = Date.now();
      e.pending = null;
      listeners.forEach((l) => l());
    });
}

function useCacheVersion(): void {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((v) => v + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
}

/** One asset's board, refreshed every `refreshMs` while the screen is mounted. */
export function useBoard(symbol: string | undefined, goal: Goal, refreshMs = 30_000) {
  useCacheVersion();
  useEffect(() => {
    if (!symbol) return;
    load(symbol, goal, refreshMs);
    const id = setInterval(() => load(symbol, goal, refreshMs), refreshMs);
    return () => clearInterval(id);
  }, [symbol, goal, refreshMs]);
  const e = symbol ? cache.get(key(symbol, goal)) : undefined;
  return { board: e?.board ?? null, error: e?.error ?? null, loading: !e || (e.at === 0 && !e.error) };
}

/** Boards for a list of assets (the Earn tab), loaded a few at a time and refreshed every minute. */
export function useBoards(symbols: string[], goal: Goal): Record<string, Board | null | undefined> {
  useCacheVersion();
  const joined = symbols.join(',');
  useEffect(() => {
    let stop = false;
    const run = async () => {
      const list = joined ? joined.split(',') : [];
      for (let i = 0; i < list.length && !stop; i += 4) {
        const batch = list.slice(i, i + 4);
        batch.forEach((s) => load(s, goal, 60_000));
        await Promise.all(batch.map((s) => cache.get(key(s, goal))?.pending));
      }
    };
    run();
    const id = setInterval(run, 60_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [joined, goal]);
  const out: Record<string, Board | null | undefined> = {};
  for (const s of symbols) {
    const e = cache.get(key(s, goal));
    out[s] = !e || (e.at === 0 && !e.error) ? undefined : e.board;
  }
  return out;
}
