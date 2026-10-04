import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';

import { applyLiveAssets, getAsset, symbolForMint } from '@/data/assets';
import { Deal } from '@/domain/deals';
import type { Goal } from '@/domain/pricing';
import { DeskClient, DeskHealth, FaucetResult, Quote } from '@/live/api';
import {
  broadcast,
  buildOpenPositionTx,
  confirmSignature,
  fetchBalances,
  fetchPosition,
  fetchPositions,
  fetchSettlementPrices,
  fromBase,
  openedPositionPda,
  PositionRow,
  priceKey,
  randomNonce,
  settlePosition,
  SettlementPriceRow,
  signPartial,
  toBase,
  DISPUTE_WINDOW_SECS,
} from '@/live/chain';
import { API_URL } from '@/live/config';
import { createWallet, deleteWallet, loadWallet } from '@/live/wallet';

export const api = new DeskClient(API_URL);

export type Intent = Goal | 'learn';
export type Wallet = { label: string; address: string };
export type MarketStatus = 'connecting' | 'online' | 'offline';

export type Rewards = {
  points: number;
  streak: number;
  lastCheckIn: string | null; // YYYY-MM-DD local
  lessonsDone: string[];
  quizBest: number | null;
  badges: string[];
};

/** What the chain does not store about a deal opened on this device. */
export type DealMeta = { openedAt: number; pct: number; apr: number; priceAtOpen: number; partner: string; offers: number; signature: string };

export type AppState = {
  hydrated: boolean;
  // saved on this device
  onboarded: boolean;
  intent: Intent | null;
  primerDone: boolean;
  rewards: Rewards;
  notifyMe: string[];
  faucetAt: Record<string, number>; // token → last successful claim (ms)
  dealMeta: Record<string, DealMeta>; // by deal address
  seenOutcomes: string[]; // settled deals whose ending was shown
  // live
  wallet: Wallet | null;
  market: { status: MarketStatus; health: DeskHealth | null; updatedAt: number };
  balances: { loaded: boolean; usdc: number; tokens: Record<string, number> };
  deals: Deal[];
  dealsLoaded: boolean;
  syncError: string | null;
};

export const LEVELS = [
  { name: 'Seed', at: 0 },
  { name: 'Seedling', at: 100 },
  { name: 'Sapling', at: 300 },
  { name: 'Bloom', at: 700 },
  { name: 'Grove', at: 1500 },
] as const;

export const BADGES: { id: string; name: string; how: string; emoji: string }[] = [
  { id: 'first-deal', name: 'First Seed', how: 'Start your first deal', emoji: '🌱' },
  { id: 'first-harvest', name: 'First Harvest', how: 'Hold a deal to its end date', emoji: '🌼' },
  { id: 'scholar', name: 'Little Scholar', how: 'Finish 3 Learn lessons', emoji: '📘' },
  { id: 'quiz', name: 'Quiz Whiz', how: 'Score 3/3 on the quiz', emoji: '🧠' },
  { id: 'streak-7', name: 'Steady Sprout', how: 'Check in 7 days in a row', emoji: '🔥' },
  { id: 'both-ways', name: 'Both Ways', how: 'Try Sell High and Buy Low', emoji: '🔁' },
];

const initial: AppState = {
  hydrated: false,
  onboarded: false,
  intent: null,
  primerDone: false,
  rewards: { points: 0, streak: 0, lastCheckIn: null, lessonsDone: [], quizBest: null, badges: [] },
  notifyMe: [],
  faucetAt: {},
  dealMeta: {},
  seenOutcomes: [],
  wallet: null,
  market: { status: 'connecting', health: null, updatedAt: 0 },
  balances: { loaded: false, usdc: 0, tokens: {} },
  deals: [],
  dealsLoaded: false,
  syncError: null,
};

const KEY = 'paytience/app-state/v2';
const PERSISTED = ['onboarded', 'intent', 'primerDone', 'rewards', 'notifyMe', 'faucetAt', 'dealMeta', 'seenOutcomes'] as const;

export type OfferRequest = { symbol: string; goal: Goal; target: number; endsAt: number; amount: number };
export type Offer = { quote: Quote; nonce: bigint; fixedPrice: bigint; amountBase: bigint; req: OfferRequest };
export type OfferResult = { ok: true; offer: Offer } | { ok: false; reason: string };
export type SubmitStep = 'signing' | 'cosigning' | 'confirming';

type Actions = {
  now: () => number;
  completeOnboarding: (intent: Intent) => void;
  completePrimer: () => void;
  /** Makes the practice wallet on this device (or loads the one already here). */
  signIn: () => Promise<Wallet>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  faucetCooldown: (token: string) => number; // ms left
  claimPracticeMoney: (token: string) => Promise<FaucetResult>;
  requestOffer: (req: OfferRequest) => Promise<OfferResult>;
  submitDeal: (offer: Offer, onStep: (s: SubmitStep) => void) => Promise<string>;
  markOutcomeSeen: (id: string) => void;
  collect: (id: string) => Promise<void>;
  checkIn: () => boolean;
  completeLesson: (id: string) => void;
  finishQuiz: (score: number) => void;
  toggleNotify: (symbol: string) => void;
  reset: () => void;
};

type Ctx = { state: AppState; actions: Actions };
const StoreContext = createContext<Ctx | null>(null);

function todayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function addBadge(r: Rewards, id: string, points = 0): Rewards {
  if (r.badges.includes(id)) return points ? { ...r, points: r.points + points } : r;
  return { ...r, badges: [...r.badges, id], points: r.points + points + 25 };
}

const DAY = 86_400_000;

/** An on-chain position plus its posted price, as the deal every screen renders. */
function toDeal(row: PositionRow, price: SettlementPriceRow | null | undefined, meta: DealMeta | undefined, seen: boolean): Deal {
  const symbol = symbolForMint(row.assetMint) ?? `${(row.assetMint ?? '').slice(0, 4)}…`;
  const asset = getAsset(symbol);
  const decimals = row.assetMint ? asset?.payoutDecimals ?? 9 : 9;
  const goal: Goal = row.product === 'sell_sol' ? 'sell' : 'buy';
  const target = fromBase(row.fixedPrice, 6);
  const lockUnits = goal === 'sell' ? fromBase(row.userCollateral, decimals) : fromBase(row.userCollateral, 6);
  const ifSwapGet = goal === 'sell' ? fromBase(row.mmCollateral, 6) : fromBase(row.mmCollateral, decimals);
  const pay = fromBase(row.yieldAmount, 6);
  const endsAt = row.expiryTs * 1000;
  const lockUsd = goal === 'sell' ? lockUnits * target : lockUnits;
  const pct = meta?.pct ?? (lockUsd > 0 ? (pay / lockUsd) * 100 : 0);
  // a governance price has no safety check, so treat it as posted a full window ago
  const postedAt = price ? (price.source === 'governance' ? price.postedTs - DISPUTE_WINDOW_SECS : price.postedTs) * 1000 : undefined;
  return {
    id: row.address,
    symbol,
    goal,
    target,
    lockUnits,
    ifSwapGet,
    pay,
    pct,
    apr: meta?.apr ?? 0,
    priceAtOpen: meta?.priceAtOpen ?? target,
    // the chain does not record when a deal opened; without local notes, assume a 30-day deal
    openedAt: meta?.openedAt ?? endsAt - 30 * DAY,
    endsAt,
    finalPrice: price ? fromBase(price.price, 6) : undefined,
    postedAt,
    settled: row.settled,
    cancelled: row.settled && !price,
    seenOutcome: seen || !meta,
    partner: meta?.partner ?? 'Partner',
    offers: meta?.offers ?? 1,
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const keypair = useRef<Keypair | null>(null);
  const rows = useRef<Map<string, PositionRow>>(new Map());
  /** The latest backend health, readable right after it arrives (state lags a render behind). */
  const healthRef = useRef<DeskHealth | null>(null);

  // hydrate saved state and the device wallet
  useEffect(() => {
    (async () => {
      let saved: Partial<AppState> = {};
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) saved = JSON.parse(raw) as Partial<AppState>;
      } catch {
        /* start fresh */
      }
      const kp = await loadWallet();
      keypair.current = kp;
      setState((s) => ({
        ...s,
        ...saved,
        wallet: kp ? { label: 'Practice wallet', address: kp.publicKey.toBase58() } : null,
        hydrated: true,
      }));
    })();
  }, []);

  // persist
  const persisted = JSON.stringify(PERSISTED.map((k) => state[k]));
  useEffect(() => {
    if (!stateRef.current.hydrated) return;
    const s = stateRef.current;
    const out: Record<string, unknown> = {};
    for (const k of PERSISTED) out[k] = s[k];
    AsyncStorage.setItem(KEY, JSON.stringify(out)).catch(() => {});
  }, [persisted, state.hydrated]);

  /** Assets, prices and partner status from the backend. */
  const refreshMarket = useCallback(async () => {
    try {
      const health = await api.health();
      applyLiveAssets(health.assets);
      healthRef.current = health;
      setState((s) => ({ ...s, market: { status: 'online', health, updatedAt: Date.now() } }));
    } catch {
      setState((s) => ({ ...s, market: { ...s.market, status: 'offline' } }));
    }
  }, []);

  /** Balances and deals from Solana. */
  const refreshChain = useCallback(async () => {
    const kp = keypair.current;
    const health = healthRef.current;
    if (!kp || !health) return;
    const owner = kp.publicKey.toBase58();
    try {
      const [bal, positions] = await Promise.all([fetchBalances(owner), fetchPositions(owner)]);
      const prices = await fetchSettlementPrices(positions);
      rows.current = new Map(positions.map((r) => [r.address, r]));
      setState((s) => {
        const tokens: Record<string, number> = { SOL: bal.sol };
        for (const [mint, amount] of Object.entries(bal.byMint)) {
          const sym = symbolForMint(mint);
          if (sym && mint !== health.usdc_mint) tokens[sym] = amount;
        }
        const deals = positions.map((r) => toDeal(r, prices[priceKey(r)], s.dealMeta[r.address], s.seenOutcomes.includes(r.address)));
        return { ...s, balances: { loaded: true, usdc: bal.byMint[health.usdc_mint] ?? 0, tokens }, deals, dealsLoaded: true, syncError: null };
      });
    } catch {
      setState((s) => ({ ...s, syncError: 'Couldn’t refresh from Solana. Showing the last known data.' }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await refreshMarket();
    await refreshChain();
  }, [refreshMarket, refreshChain]);

  // polling: market every 15 s, chain every 20 s, paused in the background
  useEffect(() => {
    if (!state.hydrated) return;
    let active = RNAppState.currentState !== 'background';
    const first = setTimeout(refresh, 0);
    const m = setInterval(() => active && refreshMarket(), 15_000);
    const c = setInterval(() => active && refreshChain(), 20_000);
    const sub = RNAppState.addEventListener('change', (st) => {
      const was = active;
      active = st === 'active';
      if (active && !was) refresh();
    });
    return () => {
      clearTimeout(first);
      clearInterval(m);
      clearInterval(c);
      sub.remove();
    };
  }, [state.hydrated, state.wallet?.address, refresh, refreshMarket, refreshChain]);

  const actions = useMemo<Actions>(
    () => ({
      now: () => Date.now(),
      completeOnboarding: (intent) => setState((s) => ({ ...s, onboarded: true, intent })),
      completePrimer: () => setState((s) => ({ ...s, primerDone: true })),
      signIn: async () => {
        const kp = keypair.current ?? (await loadWallet()) ?? (await createWallet());
        keypair.current = kp;
        const wallet = { label: 'Practice wallet', address: kp.publicKey.toBase58() };
        setState((s) => ({ ...s, wallet }));
        return wallet;
      },
      signOut: async () => {
        await deleteWallet();
        keypair.current = null;
        rows.current = new Map();
        setState((s) => ({ ...s, wallet: null, deals: [], dealsLoaded: false, balances: { loaded: false, usdc: 0, tokens: {} } }));
      },
      refresh,
      faucetCooldown: (token) => {
        const last = stateRef.current.faucetAt[token];
        const cooldown = 60 * 60_000;
        return last ? Math.max(0, last + cooldown - Date.now()) : 0;
      },
      claimPracticeMoney: async (token) => {
        const kp = keypair.current;
        if (!kp) throw new Error('not signed in');
        const res = await api.faucet(kp.publicKey.toBase58(), token === 'USDC' ? undefined : token);
        if (!res || typeof res !== 'object' || !('pubkey' in res)) throw new Error('faucet failed');
        setState((s) => ({ ...s, faucetAt: { ...s.faucetAt, [token]: Date.now() } }));
        setTimeout(() => refreshChain(), 2500);
        return res;
      },
      requestOffer: async (req) => {
        const kp = keypair.current;
        const asset = getAsset(req.symbol);
        if (!kp || !asset) return { ok: false, reason: 'not signed in' };
        const decimals = req.goal === 'sell' ? (asset.symbol === 'SOL' ? 9 : asset.payoutDecimals) : 6;
        const nonce = randomNonce();
        const fixedPrice = toBase(req.target, 6);
        const amountBase = toBase(req.amount, decimals);
        try {
          const res = await api.rfq({
            asset: req.symbol,
            product: req.goal === 'sell' ? 'sell_sol' : 'buy_sol',
            fixedPrice,
            expiryTs: Math.round(req.endsAt / 1000),
            amount: amountBase,
            userPubkey: kp.publicKey.toBase58(),
            nonce,
          });
          if (res.type === 'rfq_decline') return { ok: false, reason: res.reason };
          return { ok: true, offer: { quote: res, nonce, fixedPrice, amountBase, req } };
        } catch (e) {
          return { ok: false, reason: e instanceof Error ? e.message : String(e) };
        }
      },
      submitDeal: async (offer, onStep) => {
        const kp = keypair.current;
        const health = healthRef.current;
        const asset = getAsset(offer.req.symbol);
        if (!kp || !health || !asset) throw new Error('network');
        const expiryTs = Math.round(offer.req.endsAt / 1000);
        const mm = new PublicKey(offer.quote.mm_pubkey);
        const params = {
          user: kp.publicKey,
          mm,
          usdcMint: new PublicKey(health.usdc_mint),
          assetMint: asset.mint ? new PublicKey(asset.mint) : null,
          product: offer.req.goal === 'sell' ? ('sell_sol' as const) : ('buy_sol' as const),
          fixedPrice: offer.fixedPrice,
          expiryTs,
          amount: offer.amountBase,
          yieldAmount: BigInt(offer.quote.yield_amount),
          nonce: offer.nonce,
        };
        const address = openedPositionPda(params).toBase58();

        onStep('signing');
        const tx = await buildOpenPositionTx(params);
        const userSigned = signPartial(tx, kp);

        onStep('cosigning');
        let signature: string | undefined;
        try {
          const res = await api.sign(userSigned);
          if (res.type === 'sign_rejection') throw new Error(res.reason);
          signature = res.signature;
          if (!signature) {
            // the backend co-signed but did not broadcast
            const full = Transaction.from(Buffer.from(res.tx_base64, 'base64'));
            signature = await broadcast(Buffer.from(full.serialize()).toString('base64'));
          }
          onStep('confirming');
          await confirmSignature(signature);
        } catch (e) {
          // never claim "nothing was taken" without checking: the deal may have landed anyway
          const landed = await fetchPosition(address).catch(() => null);
          if (!landed) throw e;
        }

        const meta: DealMeta = {
          openedAt: Date.now(),
          pct: offer.quote.yield_pct,
          apr: offer.quote.apr_pct,
          priceAtOpen: offer.quote.index_price,
          partner: offer.quote.mm_name ?? 'Partner',
          offers: offer.quote.quotes_received ?? 1,
          signature: signature ?? '',
        };
        const row: PositionRow = {
          address,
          user: kp.publicKey.toBase58(),
          marketMaker: offer.quote.mm_pubkey,
          assetMint: asset.mint,
          product: params.product,
          fixedPrice: offer.fixedPrice,
          expiryTs,
          userCollateral: offer.amountBase,
          // what the partner locked: floor(amount × price / 10^decimals) USDC, or floor(amount × 10^decimals / price) tokens
          mmCollateral:
            offer.req.goal === 'sell'
              ? (offer.amountBase * offer.fixedPrice) / 10n ** BigInt(asset.symbol === 'SOL' ? 9 : asset.payoutDecimals)
              : (offer.amountBase * 10n ** BigInt(asset.symbol === 'SOL' ? 9 : asset.payoutDecimals)) / offer.fixedPrice,
          yieldAmount: params.yieldAmount,
          nonce: offer.nonce,
          settled: false,
        };
        rows.current.set(address, row);
        setState((s) => {
          let rewards = addBadge(s.rewards, 'first-deal', 0);
          if (Object.keys(s.dealMeta).length === 0) rewards = { ...rewards, points: rewards.points + 100 };
          const goals = new Set([...s.deals.map((d) => d.goal), offer.req.goal]);
          if (goals.size === 2) rewards = addBadge(rewards, 'both-ways');
          const deal = toDeal(row, null, meta, false);
          return { ...s, dealMeta: { ...s.dealMeta, [address]: meta }, deals: [deal, ...s.deals.filter((d) => d.id !== address)], rewards };
        });
        setTimeout(() => refreshChain(), 3000);
        return address;
      },
      markOutcomeSeen: (id) =>
        setState((s) => {
          if (s.seenOutcomes.includes(id)) return s;
          const rewards = addBadge({ ...s.rewards, points: s.rewards.points + 50 }, 'first-harvest');
          return { ...s, seenOutcomes: [...s.seenOutcomes, id], rewards, deals: s.deals.map((d) => (d.id === id ? { ...d, seenOutcome: true } : d)) };
        }),
      collect: async (id) => {
        const kp = keypair.current;
        const health = healthRef.current;
        const row = rows.current.get(id);
        if (!kp || !health || !row) throw new Error('network');
        try {
          await settlePosition(kp, health.usdc_mint, row);
        } catch (e) {
          // someone else may have collected it in the meantime, which is a success
          const latest = await fetchPosition(id).catch(() => null);
          if (!latest?.settled) throw e;
        }
        await refreshChain();
      },
      checkIn: () => {
        const today = todayKey(Date.now());
        const s = stateRef.current;
        if (s.rewards.lastCheckIn === today) return false;
        const yesterday = todayKey(Date.now() - DAY);
        const streak = s.rewards.lastCheckIn === yesterday ? s.rewards.streak + 1 : 1;
        setState((st) => {
          let rewards: Rewards = { ...st.rewards, streak, lastCheckIn: today, points: st.rewards.points + 10 };
          if (streak >= 7) rewards = addBadge(rewards, 'streak-7');
          return { ...st, rewards };
        });
        return true;
      },
      completeLesson: (id) =>
        setState((s) => {
          if (s.rewards.lessonsDone.includes(id)) return s;
          let rewards: Rewards = { ...s.rewards, lessonsDone: [...s.rewards.lessonsDone, id], points: s.rewards.points + 20 };
          if (rewards.lessonsDone.length >= 3) rewards = addBadge(rewards, 'scholar');
          return { ...s, rewards };
        }),
      finishQuiz: (score) =>
        setState((s) => {
          const first = s.rewards.quizBest == null;
          let rewards: Rewards = {
            ...s.rewards,
            quizBest: Math.max(score, s.rewards.quizBest ?? 0),
            points: s.rewards.points + (first ? score * 20 : 0),
          };
          if (score === 3) rewards = addBadge(rewards, 'quiz');
          return { ...s, rewards };
        }),
      toggleNotify: (symbol) =>
        setState((s) => ({
          ...s,
          notifyMe: s.notifyMe.includes(symbol) ? s.notifyMe.filter((x) => x !== symbol) : [...s.notifyMe, symbol],
        })),
      /** Clears what this device remembers. The wallet and everything on Solana stay. */
      reset: () =>
        setState((s) => ({ ...initial, hydrated: true, wallet: s.wallet, market: s.market, balances: s.balances, deals: s.deals, dealsLoaded: s.dealsLoaded })),
    }),
    [refresh, refreshChain],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside AppStoreProvider');
  return ctx;
}

/** The current time, re-rendering every `intervalMs`. */
export function useNow(intervalMs = 1000): number {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return t;
}

export function levelFor(points: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.at) idx = i;
  });
  const next = LEVELS[idx + 1];
  return { level: LEVELS[idx], next, idx };
}
