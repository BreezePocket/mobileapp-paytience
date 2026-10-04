/**
 * Client for the PAYtience backend (backend-paytience). Ported from
 * dashboard-breezepocket/src/lib/mm.ts; the wire contract is backend-paytience/docs/protocol.md.
 */
export type Product = 'sell_sol' | 'buy_sol';

export type DeskAsset = {
  asset: string;
  underlying: string;
  venue: string;
  synthetic?: boolean;
  tradable: boolean;
  fresh: boolean;
  spot: number | null;
  atm_vol: number | null;
  expiries: number | null;
  mint?: string | null;
  decimals?: number | null;
  /** UTC second of day expiries land on: 28800 = 08:00, 72000 = 20:00. */
  expiry_time_of_day?: number | null;
};
export type DeskHealth = {
  ok: boolean;
  service?: string;
  version?: string;
  mm_pubkey: string;
  mm_count?: number;
  program_id: string;
  usdc_mint: string;
  dry_run: boolean;
  price: { source?: string; spot: number | null; spotAgeMs: number | null; vol: number | null; expiries?: number | null };
  assets?: DeskAsset[];
  exposure: {
    totalUsd: number;
    capTotalUsd: number;
    capPerExpiryUsd: number;
    perExpiry: Record<string, { onChainUsd: number; reservedUsd: number }>;
  };
};
export type BoardCell = {
  moneyness: number;
  /** Plain USD (unlike the RFQ's micro-USD string). */
  fixed_price: number;
  /** USDC base units for the board's `amount`. */
  yield_amount: string;
  yield_pct: number;
  apr_pct: number;
  option_mark_usdc: number;
  implied_vol: number;
  price_source: string;
  instrument: string | null;
  mm_pubkey?: string;
  fee_pct?: number;
};
export type BoardRow = { expiry_ts: number; days: number; forward_price: number; atm_vol: number | null; quotes: BoardCell[] };
export type Board = {
  asset: string;
  underlying: string;
  venue: string;
  tradable: boolean;
  mint?: string | null;
  decimals?: number;
  product: Product;
  token: string;
  amount: string;
  index_price: number;
  fee_pct: number;
  mm_pubkey: string;
  generated_at: number;
  expiries: BoardRow[];
};
export type Quote = {
  type: 'rfq_response';
  rfq_id: string;
  quote_id: string;
  yield_amount: string;
  yield_pct: number;
  apr_pct: number;
  mm_pubkey: string;
  /** Unix ms. */
  valid_until: number;
  price_source: string;
  instrument: string | null;
  index_price: number;
  forward_price: number;
  implied_vol: number;
  fee_pct: number | null;
  mm_name?: string;
  quotes_received?: number;
  mms_asked?: number;
};
export type Decline = { type: 'rfq_decline'; rfq_id: string; reason: string };
export type SignResponse = { type: 'sign_response'; request_id: string; tx_base64: string; signature?: string };
export type SignRejection = { type: 'sign_rejection'; request_id: string; reason: string };
export type FaucetInfo = { enabled: boolean; amount_usdc: number; asset_usd?: number; cooldown_ms: number; usdc_mint: string };
export type FaucetResult = {
  pubkey: string;
  asset?: string;
  amount?: number;
  usdc_amount: number;
  usdc_signature: string;
  signature?: string;
  sol_airdrop_signature: string | null;
};
export type RfqRequest = {
  /** Omitted or 'SOL' for SOL; otherwise a listed asset's symbol. */
  asset?: string;
  product: Product;
  /** USD × 1e6 per whole token. */
  fixedPrice: bigint;
  /** Unix seconds. */
  expiryTs: number;
  /** Collateral base units. */
  amount: bigint;
  userPubkey: string;
  nonce: bigint;
};

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init: RequestInit | undefined, timeoutMs: number, allowTyped: boolean): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal });
    const text = await r.text();
    let j: unknown = null;
    try {
      j = JSON.parse(text);
    } catch {
      /* a proxy error page or a plain-text body */
    }
    const typed = !!j && typeof j === 'object' && 'type' in (j as object);
    if (!r.ok && !(allowTyped && typed)) {
      const msg = j && typeof j === 'object' && 'error' in (j as object) ? String((j as { error: unknown }).error) : text.slice(0, 120) || r.statusText;
      throw new ApiError(msg, r.status);
    }
    if (j == null) throw new ApiError('unreadable response', r.status);
    return j as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(ctl.signal.aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
}

export class DeskClient {
  readonly baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  private get<T>(path: string, timeoutMs = 8000) {
    return request<T>(this.baseUrl + path, undefined, timeoutMs, false);
  }
  private post<T>(path: string, body: unknown, timeoutMs = 20000) {
    return request<T>(
      this.baseUrl + path,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
      timeoutMs,
      true,
    );
  }

  health(timeoutMs = 5000) {
    return this.get<DeskHealth>('/health', timeoutMs);
  }
  /** Omitting `asset` means SOL. `amount` is in WHOLE units: tokens for sell_sol, USDC for buy_sol. */
  board(opts: { asset?: string; product: Product; amount?: number; maxDays?: number }) {
    const p = [`product=${opts.product}`];
    if (opts.asset && opts.asset !== 'SOL') p.push(`asset=${encodeURIComponent(opts.asset)}`);
    if (opts.amount !== undefined) p.push(`amount=${opts.amount}`);
    if (opts.maxDays !== undefined) p.push(`max_days=${opts.maxDays}`);
    return this.get<Board>(`/board?${p.join('&')}`);
  }
  rfq(req: RfqRequest) {
    return this.post<Quote | Decline>('/rfq', {
      type: 'rfq_request',
      rfq_id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...(req.asset && req.asset !== 'SOL' ? { asset: req.asset } : {}),
      product: req.product,
      fixed_price: req.fixedPrice.toString(),
      expiry_ts: req.expiryTs,
      amount: req.amount.toString(),
      user_pubkey: req.userPubkey,
      nonce: req.nonce.toString(),
    });
  }
  sign(txBase64: string) {
    return this.post<SignResponse | SignRejection>('/sign', { type: 'sign_request', request_id: `app-sign-${Date.now()}`, tx_base64: txBase64 });
  }
  async faucetInfo(): Promise<FaucetInfo | null> {
    try {
      return await this.get<FaucetInfo>('/faucet', 4000);
    } catch {
      return null;
    }
  }
  /** Test USDC, or the listed `asset`'s test token. Can take ~30 s. */
  faucet(pubkey: string, asset?: string) {
    return this.post<FaucetResult>('/faucet', asset ? { pubkey, asset } : { pubkey }, 40000);
  }
}

/** Raw backend, wallet and chain reasons → calm copy (docs/product-brief.md §5). */
export function friendly(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw.toLowerCase();
  if (m === 'network' || m === 'timeout' || m.includes('error code')) return 'Can’t reach PAYtience. Check your connection and try again.';
  if (m.includes('rate limited')) return 'Busy moment. Please try again in a few seconds.';
  if (m.includes('no market maker is online')) return 'Our partners are napping. Offers will be back soon.';
  if (m.includes('responded in time') || m.includes('respond in time') || m.includes('disconnected')) return 'Our partners took too long to answer. Nothing was taken. Please try again.';
  if (m.includes('stale')) return 'Prices are catching their breath. Try again in a moment.';
  if (m.includes('expiry too close')) return 'That date is too soon. Pick one at least 3 days away.';
  if (m.includes('expiry too far')) return 'That date is too far out. Pick one within 90 days.';
  if (m.includes('too far from market')) return 'That target is too far from today’s price. Pick a closer one.';
  if (m.includes('no option price') || m.includes('option price for that')) return 'No offer for that exact price and date. Try a neighbouring target.';
  if (m.includes('yield below minimum')) return 'The pay would be too tiny. Try a closer target, a later date or a bigger amount.';
  if (m.includes('per-position maximum')) return 'One deal can be up to $2,500 right now.';
  if (m.includes('cap for this expiry')) return 'This date is full right now. Try another date.';
  if (m.includes('aggregate cap')) return 'Our partners are fully booked. Please try again later.';
  if (m.includes('quote-only')) return 'This one is preview-only for now.';
  if (m.includes('quote expired') || m.includes('quote already used') || m.includes('no quote for this nonce')) return 'Your offer timed out. Here’s a fresh one.';
  if (m.includes('reference price moved')) return 'The price moved while you were approving. Here’s an updated offer.';
  if (m.includes('dry run')) return 'Preview mode: partners are showing prices but not taking deals right now.';
  if (m.includes('is not connected')) return 'That partner just stepped away. Getting you a new offer.';
  if (m.includes('insufficient')) return 'Not enough balance for this deal.';
  if (m.includes('faucet cooldown')) {
    const n = raw.match(/(\d+)\s*min/);
    return `You’ve had practice money recently.${n ? ` More in ${n[1]} min.` : ' Try again later.'}`;
  }
  if (m.includes('no price yet')) return 'That practice money isn’t ready yet. Try in a minute.';
  if (m.includes('outcome unknown')) return 'Not sure it arrived. Check your balance in a minute.';
  if (m.includes('faucet')) return 'That didn’t work. Please try again.';
  return 'Something went wrong on our side. Nothing was taken. Please try again.';
}
