> **Note (2026-09-28):** the mascot is named **Sprout** (user decision). Read every "Pip" below as "Sprout". Rewards levels become Seed → Seedling → Sapling → Bloom → Grove so they do not clash with the name.

# PAYtience Mobile: Product Brief

**Frontend first, mock data only · React Native · written 2026-09-28**

This brief is for a React Native app aimed at people who have never used crypto. In this phase every screen runs on a mock layer. That layer copies the real backend REST contract and the on-chain account shapes field for field, so connecting the real API later means swapping one module, not rewriting screens.

---

## 0. Read this first

### 0.1 The product in one breath

You lock something you already have (a coin, a stock token, or digital dollars) until a date you choose. You name a price you'd be happy to trade at, and you get paid today. On that date, one of two things happens: you get back what you locked, or the trade happens at your price. **The money you were paid today is yours either way.**

- **Sell High** (a covered call; on-chain `product` is `sell_sol`, used for every asset): lock the asset, with a target *above* today's price.
- **Buy Low** (a cash-secured put; `buy_sol`, used for every asset): lock digital dollars (USDC), with a target *below* today's price.

There is no liquidation, no margin, no early exit, no top-up, no rollover and no claim step.

### 0.2 Source of truth: decisions on the contradictions

The research sources disagree in several places. These decisions are final for the app, so builders don't have to work them out again.

| # | Topic | Conflict | Decision |
|---|---|---|---|
| 1 | Token the upfront pay is in | README and IDL say "collateral token"; the current code says USDC | **Always USDC**, in both modes. Keep `yield_token`. Don't reproduce the 4 legacy SOL-paid devnet positions. |
| 2 | Cancelling early | Marketing says "Cancel anytime before the date" | **Users can't cancel.** Funds stay locked until the end date. Only the 3-of-5 safety council (governance) can emergency-cancel. |
| 3 | Price exactly at the target | Web says ABOVE/BELOW; README says "crosses" | **Equal counts as a swap.** Sell High swaps if final ≥ target; Buy Low if final ≤ target. Copy says "at or above" / "at or below". |
| 4 | Settle | The web's manual Settle button charges whoever presses it a fee, which contradicts "gasless" | **Payout is designed to be automatic** ("No action needed"). A **Collect** fallback appears only in `ready` and is free in the mock. The backend must automate or sponsor settling (§8). |
| 5 | End time | Web shows "Sep_26" in UTC | **08:00 UTC** for crypto and pre-IPO; **20:00 UTC** for US stocks, ETFs, gold and silver. **Always show local time.** 20:00 UTC is 4 pm New York only in US summer time (3 pm after 1 Nov 2026). |
| 6 | When the safety check starts | — | 30 min from when the price is **posted** (`postedTs`), not from the end date. A price posted by governance has no wait. |
| 7 | Where the outcome is stored | The program stores only `settled` | **Derive Kept, Sold or Bought** by comparing the settlement price with `fixedPrice`, and keep it on history cards. The web shows only "Settled". |
| 8 | Emergency cancel | Looks the same as a normal settle on chain | Show **Returned** when a deal is settled with no price posted (a safe inference), or when the backend flags it. |
| 9 | What's tradable | README says 24 listed; markets.ts has 29; web notes say only SOL is certain; one real ANTHROPIC trade exists | **Never hardcode.** `health.assets[]` decides: `tradable && mint` → **Live**; priced → **Preview**; missing → **Coming soon**. SOL is always Live. JUP, PYTH, RAY and HYNIXon have no price feed → Coming soon. |
| 10 | Fee | Desk `FEE_PCT` is 0; vault mock says 0.5%/yr | "PAYtience fee: 0%", read live from `fee_pct`. |
| 11 | Yield % | Earn APR, Dashboard (÷ size at target) and quote `yield_pct` all differ | **Use only the quote's `yield_pct`** ("% of what you lock"), saved at open in `DealMeta`. |
| 12 | Limits (devnet, will change) | — | $2,500 per deal · $5,000 per end date · $20,000 total per partner · 3–90 days · target within 0.25×–4× today's price · minimum pay 0.05% · offer held 30 s · refused if the price moves >1% before the partner confirms. These live in config and are never hardcoded in copy. |
| 13 | Wording | Mixed casing and synonyms | One vocabulary (§4): **Sell High, Buy Low, deal, upfront pay, target price, end date, partner, Kept / Sold / Bought.** |
| 14 | Mascot and promo video | Neither exists in any repo | Art comes from the user's promo video. Use placeholders until then (§0.5). |
| 15 | Auto-Accumulate, Earn While Holding, Vaults | Marketing ideas or static mocks only | Not built. "Holding" is a Sell High preset with the farthest target. **Autopilot is preview only** ("Notify me"). |

### 0.3 Scope of this phase

- **In scope:** every screen, navigation, mascot states, a mock layer that matches the wire contract exactly, every loading, empty, error and edge state, and a mock scenario switcher.
- **Out of scope:** a real wallet, real HTTP, a push-notification server, a points backend, vault contracts, and mainnet.

### 0.4 Experience concept: the Cloud Garden (inspired by Sanctum, owned by PAYtience)

The core loop is **plant a deal → get paid right away → wait while it grows → harvest → plant again.**

- **Mascot buddy:** Pip (working name) narrates, gives tips and celebrates.
- **Deposit → earn → grow:** opening a deal **drops smiley gold coins into your Coin Jar straight away**. Those coins are the real upfront pay. A sprout then grows until the end date. **Growth shows time passing, not money growing.**
- **Celebrations:** a coin shower when a deal opens (`Flow.done`), and a bloom plus an outcome reveal when it settles.
- **Growing garden (Cloud Garden):** one cloud pot per deal, marked with the asset icon. Each pot has 5 growth stages based on time elapsed and blooms on the end date. Tap a pot to open its deal.
- **Seasons, collectibles and daily rewards (mock only):**
  - 8-week themed seasons (Dawn / Breeze / Rainbow / Starry), each with a points leaderboard
  - Badges, pot skins and Pip accessories
  - A daily check-in streak and a daily tip

**Guardrails:** points are never money, and there is no token or airdrop promise. Nothing rewards trading volume or bigger deals. Points reward learning, check-ins, completed deals and referrals.

### 0.5 Mascot spec (Pip)

- **Look (from the promo video):** a glossy blue bean body with a green two-leaf sprout on top, pink cheeks, white-gloved hands and kawaii proportions. Pip lives in a sky-and-cloud world with smiley gold coins.
- **Personality:** calm, patient, warm, a little playful, and always honest. Pip never hypes and never says "guaranteed".
- **Name:** "Pip" is a placeholder. Alternatives are "Bean" and "Pati". The user decides.
- **Formats:** Rive is preferred (one file, driven by state-machine inputs); Lottie also works. Add static PNGs at @1x/@2x/@3x for fallbacks and thumbnails. Three sizes: hero (160–200 pt), inline (64 pt) and tooltip avatar (32 pt).

**Poses needed:**

| Pose | Used for |
|---|---|
| Wave | Welcome, Home |
| Explaining with a sign | Tooltips, Learn, Review |
| Thinking | Getting an offer |
| Stopwatch | Locked offer |
| Glove handshake | Partner confirming |
| Carrying coins | Locking, collecting |
| Coin-shower jump | Deal opened, money arrived |
| Watering a sprout | Active deal, empty garden |
| Tea on a cloud | Waiting for the final price |
| Magnifier | Safety check |
| Bloom / harvest | Deal ended |
| Sleeping "Zzz" | Offline |
| Shrug | Declined |
| Sweat drop | Errors |
| "Soon" sign | Preview, Coming soon |
| Gift box | Daily reward |
| Trophy | Badge earned |
| Practice hat | Practice ribbon, faucet |

### 0.6 Navigation

**Bottom tabs:**
1. **Home**: Cloud Garden, summary, daily reward
2. **Earn**: start a deal, plus an Autopilot preview row
3. **Deals**: Active and Ended
4. **Rewards**: points, streak, season, badges, leaderboard, referral
5. **Me**: wallet, practice money, Learn, settings

**Modal stacks:** the Deal wizard (Goal → Asset → Date → Target → Amount → Review → Approve → Success), Connect, Practice money, Learn hub, Deal detail, Receipt, and a hidden dev menu.

**Always-on chrome:** a yellow practice-mode ribbon ("Practice mode · test money, no real value") and a status banner that appears only when something is wrong.

### 0.7 Design tokens (replacing the web app's beige "terminal" look)

The web app's beige grid, `~/path` titles and ribbon tabs are dropped in favour of the marketing palette.

| Token | Value | Use |
|---|---|---|
| primary | `#0B5CFF` | Main brand blue |
| gradient | `#075ACE → #027BF6 → #13EAFB` | Hero and brand gradients |
| navy | `#06173F` (CTA navy `#043273`) | Headings, CTAs |
| text | `#0B2350` | Body text |
| muted | `#4A6A8F` | Secondary text |
| sky | `#EAF3F9` / `#D9E8F1` | Backgrounds |
| bg | `#FCFCFC` | Base background |
| border | `#D0E1EB` | Borders |
| **keep** | teal `#2FD6C9` | The "you get it back" outcome |
| **swap** | coral `#FF4D67` | The "trade happens" outcome. **Not an error colour.** |
| earn | `#2AAB63` | Upfront pay amounts |
| coin | `#FFC83D` (proposed) | Coins |
| leaf | `#3CC76A` (proposed) | Growth |
| warn | `#B87F00` on `#FFEAC8` | Warnings only |
| danger | `#A60B00` on `#FFD9D5` | Real errors only |

- **Type:** one family, **Nunito** (rounded, to match the kawaii mascot), in weights 400, 600 and 800, with tabular numerals for money. The wordmark stays the brand PNG (`frontend-breezepocket/public/brand/`). Nunito replaces the web's DM Sans/DM Mono/Poppins and the site's Roboto; the brand owner should confirm.
- **Shape:** pill buttons, 16 pt cards, 10 pt tiles, soft cloud shadows.
- **Motion:** gentle springs. Celebrations last at most 2.5 s and can be skipped. Respect the system Reduce Motion setting.
- **Target-price colours:** no red/amber/green, because it reads as good or bad. Use one blue intensity scale with the legend "More pay · more likely to swap ↔ Less pay · less likely to swap".

---

## 1. Canonical domain model

### 1.1 Layering (what makes the backend swap a one-module change)

```
src/api/        types.ts (1.3) · desk.ts (DeskClient) · desk.mock.ts · desk.http.ts (later)
src/chain/      types.ts (1.4) · chain.mock.ts (local positions store)
src/wallet/     WalletAdapter: mock | mwa | embedded
src/domain/     pure derivations: market state, deal status, outcome, formatting (1.6)
src/mock/       fixtures: health, boards, expiries, quotes, seeded positions, scenarios (1.8)
src/services.ts createServices({ mode: 'mock' | 'live', baseUrl })  ← the only switch
```

Screens import only `domain/*` view models and the service interfaces, never the fixtures.

**Casing rule:** wire types keep the backend's snake_case. `PositionRow` and the client-side `RfqRequest` keep the camelCase used in program.ts and mm.ts.

### 1.2 Unit rules (the most common source of bugs)

| Value | Unit | Type |
|---|---|---|
| `expiry_ts`, `expiryTs`, `postedTs` | Unix **seconds** | number |
| `valid_until`, `generated_at` | Unix **milliseconds** | number |
| Board `fixed_price`, `/expiries` `strikes`, `index_price`, `spot`, `forward_price` | Plain USD **float** | number |
| RFQ `fixed_price`, on-chain `fixedPrice`, settlement `price` | USD × 1e6 per whole token, **for every asset** | u64 decimal string on the wire / bigint |
| RFQ `amount` | Collateral base units. Sell High: asset × 10^decimals (SOL 1e9). Buy Low: USDC × 1e6 | u64 string |
| Board **query** `amount` | **Whole** units. Sell High: tokens (default 1). Buy Low: USDC (default 100) | number |
| Board **response** `amount` | Base units (`"1000000000"` / `"100000000"`) | u64 string |
| `yield_amount`, `yieldAmount` | USDC base units (6 dp), in both modes | u64 string / bigint |
| `yield_pct`, `apr_pct`, `fee_pct` | Percent (2.1051 means 2.1051%) | number |
| `vol`, `atm_vol`, `implied_vol` | Fraction (0.557 means 55.7%) | number |
| `nonce` | Random u64 from 8 little-endian bytes, new for every RFQ | u64 string / bigint |

- Parse every u64 with `BigInt` (Hermes supports it on RN ≥ 0.70). Convert to `Number` only for display.
- When the mock store saves bigints (AsyncStorage/MMKV), store them as strings.
- Port these helpers verbatim from program.ts: `priceToBase`, `usdcToBase`, `solToLamports`, `fromUnits`, `baseToUsdc`, `lamportsToSol`, `randomNonce`.

### 1.3 Wire types (REST: `GET /health`, `/expiries`, `/board`, `/assets`; `POST /rfq`, `/sign`; `GET|POST /faucet`)

These are ported from `dashboard-breezepocket/src/lib/mm.ts`. `[fix]` marks a field where the web type lags the backend.

```ts
export type U64String = string;      // decimal u64 → BigInt()
export type Base58 = string;
export type UnixSeconds = number;
export type UnixMillis = number;
export type Product = 'sell_sol' | 'buy_sol';          // Sell High | Buy Low, for EVERY asset
export type Venue = 'deribit' | 'alpaca' | 'prestocks' | (string & {});
export type PriceSource = 'deribit_mark' | 'deribit_surface' | 'alpaca_mark' | 'alpaca_surface'
  | 'prestocks_synthetic' | 'model' | (string & {});   // UI strips '_synthetic'

// GET /health: always HTTP 200 when reachable
export interface DeskHealth {
  ok: boolean;
  service?: 'paytience-backend';
  version?: string;
  mm_pubkey: string;                  // '' when no partner online
  mm_count?: number;                  // 0 → "partners napping"
  program_id: Base58;                 // devnet BeytdpJYSGP1oFRxEiBLkSRGuW6HW3Pk9dqSZCuSteQ9
  usdc_mint: Base58;                  // devnet GxSfF7CfT3C2Sr7RYFwXoRHmhFeH4DpUVQCDNiktxEFD
  dry_run: boolean;                   // offers work, partner confirmation refused
  price: { source?: string; spot: number | null; spotAgeMs: number | null; vol: number | null; expiries?: number | null }; // [fix] nullable
  assets?: DeskAsset[];               // [] when offline
  exposure: {
    totalUsd: number; capTotalUsd: number; capPerExpiryUsd: number;          // caps 0 when offline
    perExpiry: Record<string /* String(expiry_ts) */, { onChainUsd: number; reservedUsd: number }>;
  };
  stats?: Record<string, number>;
}

// health.assets[] and GET /assets → { assets }
export interface DeskAsset {
  asset: string;                      // catalog symbol 'SOL' | 'TSLAon' | 'ANTHROPIC'
  underlying: string;                 // 'SOL' | 'TSLA' | 'BTC' | 'SLV'
  venue: Venue;
  synthetic?: boolean;                // [fix] sent on the wire; pre-IPO model pricing
  tradable: boolean;                  // SOL always true
  fresh: boolean;                     // false → "prices warming up"
  spot: number | null;
  atm_vol: number | null;
  expiries: number | null;            // COUNT of dates
  mint?: Base58 | null;               // SOL → null
  decimals?: number | null;           // SOL → null (use 9)
  expiry_time_of_day?: number | null; // UTC seconds: 28800 = 08:00, 72000 = 20:00
  mm_count?: number;
}

// GET /expiries?asset= → { expiries } (asset omitted for SOL); only 3–90 days out
export interface DeskExpiry { expiry_ts: UnixSeconds; days: number; forward_price: number; atm_vol: number | null; strikes: number[] }

// GET /board?asset=&product=&amount=&max_days=&moneyness=&exact=
export interface BoardQuery { asset?: string; product: Product; amount?: number /* WHOLE units */; maxDays?: number /* 90 */; moneyness?: number[]; exact?: boolean }
export interface Board {
  asset: string; underlying: string; venue: Venue; tradable: boolean;
  mint?: Base58 | null; decimals?: number;
  product: Product;
  token: string;                      // collateral: 'sol' | asset symbol (sell) | 'usdc' (buy)
  yield_token: 'usdc';                // [fix]
  amount: U64String;                  // base units the board is priced for
  index_price: number; fee_pct: number; mm_pubkey: Base58; generated_at: UnixMillis; mm_count?: number;
  expiries: BoardRow[];               // rows without cells omitted → may be []
}
export interface BoardRow {
  expiry_ts: UnixSeconds; days: number; forward_price: number; atm_vol: number | null;
  quotes: BoardCell[];                // ≤4 (pre-IPO 2 per side), nearest-to-spot first
}
export interface BoardCell {
  moneyness: number;                  // target/spot → "+8.1% above today"
  fixed_price: number;                // USD FLOAT (≠ RFQ micro-USD string)
  yield_amount: U64String;            // USDC base units for board.amount
  yield_pct: number; apr_pct: number; option_mark_usdc: number; implied_vol: number;
  price_source: PriceSource;
  instrument: string | null;          // 'SOL_USDC-30OCT26-128-C'
  mm_pubkey?: Base58; fee_pct?: number;  // backend only
}

// POST /rfq
export interface RfqRequest {         // client side (camelCase, as mm.ts)
  asset?: string;                     // omit for SOL
  product: Product;
  fixedPrice: bigint;                 // USD × 1e6: $128 → 128_000_000n
  expiryTs: UnixSeconds;              // on the asset's time of day
  amount: bigint;                     // collateral base units
  userPubkey: Base58;
  nonce: bigint;                      // NEW random u64 per request; seeds the position address
}
// Wire body: { type: 'rfq_request', rfq_id: `app-${Date.now()}-${rand6}`, asset?, product, fixed_price, expiry_ts, amount, user_pubkey, nonce } (u64s as strings)
export interface Quote {
  type: 'rfq_response'; rfq_id: string; quote_id: string;
  yield_amount: U64String;            // "4190000" = $4.19
  yield_token?: 'usdc';               // [fix]
  yield_pct: number;                  // Sell: ÷ (qty × spot) · Buy: ÷ USDC locked
  apr_pct: number;
  mm_pubkey: Base58;                  // winning partner = fee payer of the tx
  valid_until: UnixMillis;            // partner clock + 30 000
  price_source: PriceSource; instrument: string | null;
  index_price: number; forward_price: number; implied_vol: number;
  fee_pct: number | null;             // [fix] nullable
  mm_name?: string; quotes_received?: number; mms_asked?: number;
}
export interface Decline { type: 'rfq_decline'; rfq_id: string; reason: string }
// HTTP 200 all declined · 400 validation · 503 no partner · 504 no response · 429 PLAIN { error: 'rate limited' }

// POST /sign
// Request body: { type: 'sign_request', request_id: 'app-sign-<ms>', tx_base64 } (user-signed legacy tx)
export interface SignResponse {
  type: 'sign_response'; request_id: string; tx_base64: string;
  signature?: Base58;                 // present → backend broadcast; absent → client broadcasts
}
export interface SignRejection { type: 'sign_rejection'; request_id: string; reason: string }
// HTTP 400 invalid tx · 422 partner/desk reasons · 504 timeout/disconnected · 429 plain

// GET|POST /faucet (practice money)
export interface FaucetInfo {         // 404 { error: 'faucet disabled' } → null → hide
  enabled: boolean; amount_usdc: number /* 1000 */; asset_usd?: number /* 1000 */;
  cooldown_ms: number;                // 3 600 000 per wallet AND token
  usdc_mint: Base58;
}
export interface FaucetResult {       // POST { pubkey, asset? }; up to ~30 s
  pubkey: Base58; asset?: string;     // 'USDC' | symbol
  amount?: number;                    // HUMAN units
  usdc_amount: number; usdc_signature: Base58;   // legacy
  signature?: Base58;                 // [fix]
  sol_airdrop_signature: Base58 | null;          // best-effort 0.5 SOL
}
export interface ApiErrorBody { error: string; signature?: Base58 }  // every other failure
```

### 1.4 On-chain types (read through Anchor today; mocked as a local store)

```ts
export interface PositionRow {        // mirrors program.ts, with base58 strings instead of PublicKey
  address: Base58;
  user: Base58;
  marketMaker: Base58;
  assetMint: Base58 | null;           // null = SOL (PositionAccount) · else AssetPosition
  symbol: string;                     // 'SOL' or listed symbol; fallback 'XXXX…'
  decimals: number;                   // 9 for SOL
  product: Product;
  fixedPrice: bigint;                 // target, USD × 1e6 per WHOLE token
  expiryTs: UnixSeconds;
  userCollateral: bigint;             // what the user locked: Sell = asset base units · Buy = USDC base units
  mmCollateral: bigint;               // what the user gets IF the swap happens (already locked by partner):
                                      //   Sell = floor(amount × fixedPrice / 10^decimals) USDC base
                                      //   Buy  = floor(amount × 10^decimals / fixedPrice) asset base
  yieldAmount: bigint;                // upfront pay, USDC base units
  nonce: bigint;
  settled: boolean;                   // the ONLY closure flag; the account is never deleted
}
export interface SettlementPriceRow {
  price: bigint;                      // USD × 1e6
  postedTs: UnixSeconds;              // the safety check starts here, NOT at expiry
  source: 'poster' | 'governance';    // governance → no 30-min wait
}
export type PriceKey = string;        // `${assetMint ?? 'SOL'}:${expiryTs}`, one price settles every deal on that asset+date
export interface Balances {           // UI units; null = not loaded / no wallet; missing token account = 0
  sol: number | null; usdc: number | null; asset: number | null; usdcMint: Base58 | null;
}
export interface OpenParams {
  user: Base58;
  mm: Base58;                         // quote.mm_pubkey → fee payer (user pays no gas)
  usdcMint: Base58;                   // health.usdc_mint
  assetMint?: Base58 | null;          // null/undefined → open_position (SOL); else open_asset_position
  product: Product;
  fixedPrice: bigint; expiryTs: UnixSeconds; amount: bigint;
  yieldAmount: bigint;                // quote.yield_amount
  nonce: bigint;                      // the RFQ's nonce
}
export const DISPUTE_WINDOW_SECS = 1800;
export const USDC_DECIMALS = 6, SOL_DECIMALS = 9;
```

### 1.5 Service interfaces (the mock implements these exactly)

```ts
export type DeskErrorKind = 'network' | 'timeout' | 'rate_limited' | 'http' | 'bad_body';
export interface DeskError extends Error {
  kind: DeskErrorKind;                // 'bad_body' covers Cloudflare 530 "error code: 1033" plain text
  status?: number;
  body?: ApiErrorBody | string;
}

export interface DeskClient {
  readonly baseUrl: string;           // https://api.paytience.app | http://localhost:8080 | 'mock://'
  health(timeoutMs?: number): Promise<DeskHealth>;               // probe 3.5 s
  expiries(asset?: string): Promise<DeskExpiry[]>;                // GET 8 s
  board(q: BoardQuery): Promise<Board>;
  rfq(req: RfqRequest): Promise<Quote | Decline>;                 // POST 20 s; a typed body wins over HTTP status
  sign(txBase64: string): Promise<SignResponse | SignRejection>;  // partner has up to 10 s
  faucetInfo(): Promise<FaucetInfo | null>;                       // any failure → null → hide
  faucet(pubkey: Base58, asset?: string): Promise<FaucetResult>;  // allow 35 s
  assets?(): Promise<DeskAsset[]>;                                // optional backend-only route (GET /assets)
}

export type DeskStatus = 'connecting' | 'online' | 'offline';
export interface DeskContextValue { client: DeskClient | null; health: DeskHealth | null; status: DeskStatus; url: string | null; refresh(): void }

export interface ChainClient {
  fetchPositions(owner: Base58): Promise<PositionRow[]>;                       // sorted by expiryTs asc
  fetchSettlementPrice(assetMint: Base58 | null, expiryTs: UnixSeconds): Promise<SettlementPriceRow | null>;
  getBalances(owner: Base58, assetMint?: Base58 | null): Promise<Balances>;
  buildOpenPositionTx(p: OpenParams): Promise<string>;   // unsigned LEGACY tx, base64, feePayer = p.mm
  openedPositionAddress(p: OpenParams): Base58;          // = program.ts openedPositionPda(...)
  sendRawTransaction(txBase64: string): Promise<Base58>;
  confirmTransaction(signature: Base58): Promise<void>;  // 'confirmed'; throws with the on-chain error
  buildSettleTx(caller: Base58, pos: PositionRow): Promise<string>;  // Collect fallback only
}

export type WalletErrorKind = 'rejected' | 'cannot_sign' | 'not_connected' | 'app_switch_failed';
export interface WalletAdapter {
  readonly kind: 'mock' | 'mwa' | 'embedded';
  readonly publicKey: Base58 | null;
  readonly displayName?: string;       // 'Phantom', 'Seeker wallet', 'you@email.com'
  connect(): Promise<Base58>;          // MWA = app switch and return; embedded = email / Apple / Google
  disconnect(): Promise<void>;         // only from Me → confirm dialog
  signTransaction(txBase64: string): Promise<string>;  // partial sign of a LEGACY tx (backend rejects versioned)
}
```

**Polling on mobile:**
- Health: every 15 s (the same interval for the offline retry)
- Earn boards: 60 s. Wizard boards and expiries: 30 s
- Positions: 20 s. Balances: 15 s
- A 1 s tick drives countdowns

Pause polling in the background (`AppState`). On return to the foreground, refresh everything and re-quote. Every list supports pull to refresh. Back off on 429: many mobile users share one carrier IP, and GETs are capped at 600/min per IP.

### 1.6 Presentation layer (pure functions of wire data; reused unchanged after the swap)

```ts
export type AssetCategory = 'crypto' | 'stocks' | 'metals' | 'preipo';
export type MarketState = 'live' | 'quote' | 'soon';  // UI badge: Live · Preview · Coming soon

export interface AssetCatalogEntry {  // static, bundled (see §2)
  symbol: string;                     // = DeskAsset.asset
  name: string;                       // friendly, shown FIRST: 'Tesla', 'Bitcoin'
  subtitle: string;                   // 'TSLAon · Tesla stock token'
  category: AssetCategory;
  sellHigh: boolean;                  // all 29
  buyLow: boolean;                    // all except PYTH
  expiryUtc: '08:00' | '20:00';
  icon: number | { uri: string };     // require() bundle; pre-IPO remote + monogram fallback
  badges: Array<'wrapped' | 'delayed_15m' | 'model_estimate' | 'via_etf'>;
}
export interface MarketRow extends AssetCatalogEntry {
  state: MarketState;                 // no desk entry → soon · tradable && mint (or SOL) → live · else quote
  desk: DeskAsset | null;
  spot: number | null;
  fresh: boolean;
  payPer100?: { product: Product; expiryTs: UnixSeconds; days: number; minUsd: number; maxUsd: number };
                                      // board row nearest 30 days → "On $100 for ~1 month: get $0.92–$4.70 today" (NOT Max/Min APR)
}

// Trade flow: exact copy of EarnDetail.tsx
export type Flow =
  | { step: 'idle' }
  | { step: 'quoting' }
  | { step: 'quoted'; quote: Quote; nonce: bigint; fixedPrice: bigint; amount: bigint; expiryTs: UnixSeconds; product: Product }
  | { step: 'declined'; reason: string }
  | { step: 'signing' }
  | { step: 'cosigning' }
  | { step: 'broadcasting' }            // skipped when /sign returns a signature
  | { step: 'confirming'; signature: Base58 }
  | { step: 'done'; signature: Base58; position: Base58 }
  | { step: 'error'; message: string; code?: FriendlyErrorCode };
// busy = signing | cosigning | broadcasting | confirming | done → inputs locked, Approve debounced
export type FriendlyErrorCode =        // every raw reason string maps to one of these (table in §5)
  | 'offline' | 'no_partners' | 'dry_run' | 'rate_limited' | 'stale_price' | 'date_too_close' | 'date_too_far'
  | 'target_too_far' | 'no_offer_for_target' | 'pay_too_small' | 'over_deal_max' | 'date_full' | 'partners_full'
  | 'preview_only' | 'offer_expired' | 'price_moved' | 'partner_gone' | 'partner_timeout_unknown'
  | 'wallet_rejected' | 'wallet_cannot_sign' | 'insufficient_balance' | 'broadcast_failed' | 'chain_failed' | 'internal';

export interface DealDraft { product?: Product; symbol?: string; expiryTs?: UnixSeconds; cell?: BoardCell; amountInput: string }
export type DealStatus =
  | 'active' | 'awaiting_price' | 'safety_check' | 'ready' | 'collecting'
  | 'kept' | 'sold' | 'bought' | 'returned';

export interface DealMeta {            // app-local, keyed by position address (the chain doesn't store these)
  address: Base58; openedAt: UnixMillis; signature: Base58;
  quote: Pick<Quote, 'yield_pct' | 'apr_pct' | 'index_price' | 'price_source' | 'instrument' | 'mm_name' | 'quotes_received' | 'fee_pct'>;
}
export interface DealView {            // what every deal card renders
  row: PositionRow; meta?: DealMeta; status: DealStatus;
  hint?: 'kept' | 'swap';              // active: vs today's price ("if it ended now") · safety_check: vs posted price
  finalPriceUsd?: number; payUsd: number; targetUsd: number; endsAt: Date;
  lockedLabel: string; ifSwapLabel: string;   // '1 SOL' / '$128.00' (from mmCollateral)
  progress: number;                    // 0..1 time elapsed (meta.openedAt; else by days left)
}

export function exchangeHappens(product: Product, settlement: bigint, fixed: bigint): boolean {
  return product === 'sell_sol' ? settlement >= fixed : settlement <= fixed;   // equality = swap
}
export function dealStatusOf(p: PositionRow, price: SettlementPriceRow | null, nowSec: number,
                             flags?: { collecting?: boolean; cancelled?: boolean }): DealStatus {
  if (p.settled) {
    if (flags?.cancelled || !price) return 'returned';        // settled with no price ⇒ emergency cancel
    if (!exchangeHappens(p.product, price.price, p.fixedPrice)) return 'kept';
    return p.product === 'sell_sol' ? 'sold' : 'bought';
  }
  if (flags?.collecting) return 'collecting';
  if (nowSec < p.expiryTs) return 'active';
  if (!price) return 'awaiting_price';
  if (price.source === 'poster' && nowSec < price.postedTs + DISPUTE_WINDOW_SECS) return 'safety_check';
  return 'ready';
}
```

**Formatting.**
- Prices follow the web's `fmtPrice` rule: $1,000 or more shows 0 decimals, $1 or more shows 2, and below $1 shows 4.
- Amounts: SOL to 4 dp; other assets to 4 significant figures plus "about $X" (the exact value shows on tap); USDC to 2 dp, displayed as "$".
- Percentages to 2 dp.
- Dates in local time, e.g. "Fri 30 Oct · 4:00 PM", with a relative label: "in 32 days", "in 1 day" (singular), or "in 5 hours" within the last 24 h.

### 1.7 Mock-only types (no backend yet; keep them in `features/*/mock`)

```ts
export interface RewardsSummary { points: number; level: 'Seed' | 'Sprout' | 'Sapling' | 'Bloom' | 'Grove'; nextLevelAt: number;
  streakDays: number; lastCheckIn: string | null; referralCode: string | null /* after first deal */; referredCount: number;
  season: { id: string; name: string; theme: 'dawn' | 'breeze' | 'rainbow' | 'starry'; endsAt: string };
  badges: { id: string; name: string; howToEarn: string; earnedAt: string | null }[] }
export interface PointsHistoryRow { period: string; rank: number | null; tier: string; total: number; activity: number; referral: number } // web columns
export interface LeaderboardRow { rank: number; nickname: string; avatar: string; points: number; isMe?: boolean }       // points, never volume
export interface NotifyMe { symbol: string; product?: Product; createdAt: UnixMillis }
// Autopilot: reuse the web Vault, VaultDetailData, ThesisItem and EpochRow types (dashboard src/data/vaults.ts); recompute the stale nextEpoch.
```

### 1.8 Mock fixtures (real magnitudes)

**SOL board, captured live 2026-09-28.**
- Index $118.45; ~30-day implied vol 53.8%.
- Expiry `1793347200` = Fri 30 Oct 2026, 08:00 UTC (32 days).
- Board size: 1 SOL for Sell High, 100 USDC for Buy Low.

| Sell High target | vs today | Pay per 1 SOL | % | Yearly rate | | Buy Low target | vs today | Pay per $100 | % | Yearly rate |
|---|---|---|---|---|---|---|---|---|---|---|
| $123 | +3.8% | $5.75 | 4.85 | 55.4% | | $114 | −3.8% | $4.70 | 4.70 | 53.6% |
| $128 | +8.1% | $4.19 | 3.53 | 40.3% | | $109 | −8.0% | $3.27 | 3.27 | 37.3% |
| $138 | +16.5% | $2.24 | 1.89 | 21.6% | | $101 | −14.7% | $1.74 | 1.74 | 19.8% |
| $150 | +26.6% | $1.14 | 0.97 | 11.0% | | $93 | −21.5% | $0.92 | 0.92 | 10.5% |

**Other dates and assets.** Generate them with the desk ladder: σ steps [0.25, 0.5, 1, 1.5] × vol × √(days/365), placed above spot for Sell High and below it for Buy Low, with at most 4 targets per date. Pre-IPO uses 2 per side (0.5σ and 1σ), vol 0.6, and 3 Friday dates at about 7, 14 and 30 days.

**Quote fixture (deal B).**
- **Request:** `fixed_price` "109000000", `amount` "100000000", `expiry_ts` 1793347200, `product` "buy_sol" (asset omitted).
- **Response:** `yield_amount` "3270000", `yield_pct` 3.27, `apr_pct` 37.3, `valid_until` now + 30 000, `price_source` "deribit_mark", `instrument` "SOL_USDC-30OCT26-109-P", `index_price` 118.45, `implied_vol` 0.538, `fee_pct` 0, `mm_name` "desk-1", `quotes_received` 2, `mms_asked` 3.

**Mock scenarios** (switched from the dev menu):
- `showcase` (default): SOL, TSLAon and ANTHROPIC are Live, which exercises the listed-asset, 20:00 UTC and pre-IPO paths. Other priced assets are Preview; JUP, PYTH, RAY and HYNIXon are Coming soon.
- `devnet_strict`: only SOL is Live.
- Failure scenarios: `offline`, `no_partners`, `dry_run`, `stale_asset`, `decline_cap_expiry`, `decline_min_yield`, `reject_price_moved`, `reject_quote_expired`, `wallet_rejects`, `broadcast_failed`, `faucet_cooldown`, `faucet_no_airdrop`, `slow_network`.
- **Time travel**, to walk a deal through its whole lifecycle.

**Staged delays:** RFQ 400–900 ms; wallet approval 1 s; partner confirmation 2 s; on-chain confirmation 3 s; faucet 6–12 s.

**Seeded positions** (relative to "now" = T; together they cover every status):

| # | Deal | Target | Ends | Pay | Price state | Status shown |
|---|---|---|---|---|---|---|
| 1 | Sell High 1 SOL | $128 | Fri 30 Oct 08:00 UTC | $4.19 | — | Active |
| 2 | Buy Low $100 → SOL | $109 | Fri 30 Oct 08:00 UTC | $3.27 | — | Active |
| 3 | Buy Low $100 → ANTHROPIC (real devnet trade) | $995.92 | Fri 9 Oct 08:00 UTC | $1.82 | — | Active |
| 4 | Sell High 0.5 SOL | $125 | T − 1 h | $0.62 | none posted | Waiting for final price |
| 5 | Buy Low $200 → SOL | $115 | T − 40 min | $3.10 | poster $117.20 at T − 10 min | Safety check (looks like: Kept) |
| 6 | Sell High 1 SOL | $120 | T − 3 h | $2.05 | poster **$120.00** at T − 2 h | Ready (Sold: exactly at target) |
| 7 | Sell High 2 SOL | $130 | T − 9 d | $4.40 | $118.90 | Kept |
| 8 | Sell High 1 SOL | $115 | T − 16 d | $3.60 | $121.40 | Sold for $115.00 |
| 9 | Buy Low $100 → SOL | $109 | T − 23 d | $3.27 | $105.00 | Bought 0.9174 SOL |
| 10 | Buy Low $300 → TSLAon | $330 | T + 5 d (cancelled early) | $2.40 | none; settled | Returned by safety council |

Rows 4–10 use illustrative pay amounts.

---

## 2. Asset catalog (29 markets + reference tokens)

**How to read these tables.**
- **State** is the state in the mock `showcase` scenario. The real state always comes from `health.assets[]`.
- Prices marked * are invented placeholders; replace them with `DeskAsset.spot`.
- Both modes are offered unless noted. PYTH is Sell High only, so there are 29 Sell High markets and 28 Buy Low markets.
- Icons live at `dashboard-breezepocket/public/icons/{lowercase}.svg` (PAXG is `.png`). Pre-IPO logos come from `https://prestocks.com/logos/{lowercase}.png`; cache them and fall back to a monogram.
- The underlying ticker is the symbol minus "on" unless noted.

**Crypto** (priced from Deribit options; ends 08:00 UTC)

| Symbol | Show as | Price | State | Notes |
|---|---|---|---|---|
| SOL | **Solana** | $118.45 (live board, 28 Sep) | **Live (always)** | Native; 9 decimals; mint null |
| WBTC | **Bitcoin** | $110,000* | Preview | Wrapped (tracks BTC 1:1) |
| WETH | **Ether** | $4,000* | Preview | Wrapped (tracks ETH) |
| JUP | **Jupiter** | $0.50* | Coming soon | No feed |
| PYTH | **Pyth Network** | $0.15* | Coming soon | No feed; **Sell High only** |
| RAY | **Raydium** | $3.00* | Coming soon | No feed |

**US stocks & ETFs** (US listed options via Alpaca, indicative; badge "Delayed 15 min"; ends 20:00 UTC)

| Symbol | Show as | Price | State | Notes |
|---|---|---|---|---|
| TSLAon | **Tesla** | $345.20 (vault mock) | **Live** | Exercises the listed-asset + 20:00 path |
| NVDAon | **NVIDIA** | $165* | Preview | |
| HYNIXon | **SK Hynix** | $182.40 (vault mock) | Coming soon | No US options feed, though it has a vault |
| AAPLon · MSFTon · AMZNon · GOOGLon | **Apple · Microsoft · Amazon · Alphabet (Google)** | $230* · $500* · $220* · $240* | Preview | |
| METAon · NFLXon · COINon · MSTRon | **Meta · Netflix · Coinbase · Strategy** | $750* · $1,200* · $330* · $350* | Preview | |
| SPYon · QQQon | **S&P 500 ETF · Nasdaq-100 ETF** | $660* · $590* | Preview | "A basket of 500 / 100 big US companies" |

**Gold & Silver** (priced via ETF option chains; ends 20:00 UTC)

| Symbol | Show as | Price | State | Notes |
|---|---|---|---|---|
| PAXG | **Gold** | $4,434.22 (vault mock) | Preview | Priced via GLD |
| XAGon | **Silver** | $40* | Preview | Priced via SLV |

**Pre-IPO** (PreStocks token price plus a model at 60% vol; badge "Model estimate"; ends 08:00 UTC; 3 Friday dates at ~7, 14 and 30 days; 2 targets per side)

| Symbol | Show as | Price | State |
|---|---|---|---|
| ANTHROPIC | **Anthropic** | $1,030* (a real devnet Buy Low target was $995.92) | **Live** |
| OPENAI · SPACEX · ANDURIL · NEURALINK | **OpenAI · SpaceX · Anduril · Neuralink** | $700* · $250* · $90* · $60* | Preview |
| FIGUREAI · KALSHI · POLYMARKET | **Figure AI · Kalshi · Polymarket** | $45* · $30* · $25* | Preview |

**Reference tokens.**
- **USDC** ("digital dollars", $1.00): what Buy Low locks, and the currency of all upfront pay and Sell High payouts. Devnet mint `GxSfF7CfT3C2Sr7RYFwXoRHmhFeH4DpUVQCDNiktxEFD`, 6 dp.
- **SOL as gas:** needed only for the Collect fallback. Opening a deal needs no SOL at all.
- **TBILL** and **Reserve:** Autopilot icons only.

**Earn chips:** All · Crypto (6) · US Stocks (13) · Gold & Silver (2) · Pre-IPO (8). These replace the web's "RWAs only / crypto only" filter and its "Show only preStocks" toggle.

**Sort order:** Live, then Preview, then Coming soon; within each, by friendly name. The web's catalog order is kept in the data only.

---

## 3. Deal lifecycle: every state, in plain words, with numbers

### 3.1 Reference deals used everywhere (copy, mocks, tests)

**Deal A: Sell High (live numbers).** Lock **1 SOL** with a target of **$128** (8.1% above today's $118.45). The deal ends **Fri 30 Oct 2026, 08:00 UTC**, which is 4:00 PM in Kuala Lumpur or Singapore and 4:00 AM in New York. You get **$4.19 now**: 3.53% of what you lock, or a 40.3% yearly rate.

| Final SOL price | Result | You end with |
|---|---|---|
| $120 (below $128) | **Kept**: 1 SOL comes back | 1 SOL + $4.19 |
| **$128.00 exactly** | **Sold**: equal counts as a swap | $128.00 + $4.19 = **$132.19** |
| $150 | **Sold** at $128 | $132.19. *What-if:* 1 SOL would be worth $150, so you gave up $17.81 of the rise. |
| $100 | **Kept** | 1 SOL (now worth $100) + $4.19 = $104.19. The pay softens a drop but doesn't stop it. |

**Deal B: Buy Low (live numbers).** Set aside **$100** (USDC) with a target of **$109** (8.0% below today), same end date. You get **$3.27 now**: 3.27%, or a 37.3% yearly rate.

| Final SOL price | Result | You end with |
|---|---|---|
| $115 (above $109) | **Kept**: $100 comes back | $100 + $3.27 = $103.27 |
| **$109.00 exactly** | **Bought**: equal counts as a swap | 0.917431192 SOL + $3.27. The SOL is $100 ÷ $109 rounded down, shown as "0.9174 SOL". |
| $105 | **Bought** | 0.9174 SOL (worth $96.33 at $105) + $3.27 |
| $95 | **Bought** | 0.9174 SOL is worth $87.16, plus $3.27 = **$90.43**. *What-if:* you'd have $103.27 if SOL had stayed above $109. You bought at $109 while the market was at $95. |

**Deal C: pre-IPO (a real devnet trade).** Buy Low **$100 → Anthropic** at **$995.92**, ending **Fri 9 Oct, 08:00 UTC**. It paid **$1.82 now** (1.82%). If bought, you receive **0.100409671 ANTHROPIC**, shown as "0.1004 Anthropic · about $100 at your price". The pay is a **model estimate**, because there is no real options market for private companies.

**Deal D: US stock ending at 20:00 UTC.** These are illustrative numbers from the program's tests, assuming today's price is about $165.
- Sell High **10 NVIDIA tokens** at **$180** and get **$12 now**.
- The partner locks $1,800 when the deal opens. If it sells, you receive $1,800.00; if not, your 10 tokens come back.
- It ends at 4:00 AM the *next day* in Kuala Lumpur, and at 4:00 PM in New York (3:00 PM once US daylight time ends).

**Why the yearly rate comes last.** A 4-day deal paying 1.9% displays as a **175.8%** yearly rate. Always lead with dollars.

### 3.2 Opening a deal (the `Flow` states)

The four technical steps (signing, cosigning, broadcasting, confirming) collapse into **one progress sheet with 3 visible steps**. The copy below is for Deal A; for Deal B, swap in "$100" and "$3.27". The Pip pose for each state is listed in §0.5.

| `Flow` step | Screen | Copy | Button |
|---|---|---|---|
| `idle`, no target | Target step | "Pick the price you'd happily **sell** 1 SOL at on Fri 30 Oct." (Buy Low: "…**buy** SOL at…") | Next (disabled) |
| `idle` with a target (board estimate) | Target and amount steps | "About **$4.19** today" | Review deal |
| `quoting` | Review sheet, pay amount shimmering | "Asking our partners for your best offer…" | Getting offer… |
| `quoted` | Review sheet with a 30 s ring | "**$4.19** paid to you now. Offer held for 0:24." When the ring runs out, re-quote silently with a new nonce and flash any change ("Fresh offer: $4.21"). | **Slide to approve** |
| `declined` | Inline card | The mapped reason (§5), e.g. "This date is full right now. Try another date." | Change date / target |
| `signing` | Step 1 (wallet app switch or embedded sheet) | "Approve in your wallet" | — |
| `cosigning` | Step 2 | "Our partner is confirming…" | — |
| `broadcasting` / `confirming` | Step 3 | "Locking your 1 SOL and sending your $4.19…" | — |
| `done` | **Celebration**: a coin shower, and a sprout appears in the garden | "Deal on! **$4.19** is in your wallet. See you Fri 30 Oct." | See my deal · Plant another |
| `error` | Error card | The mapped message (§5), e.g. "You cancelled in your wallet. Nothing happened." | Try again |

### 3.3 A living deal (`DealStatus`, from `dealStatusOf`)

| Status | Rule | Chip | Sell High copy (Deal A) | Buy Low copy (Deal B) | Action |
|---|---|---|---|---|---|
| `active` | now < `expiryTs` | **Growing** · 32 days left | "You locked 1 SOL. Target $128 · today $118.45 (needs +8.1%). *If it ended now:* you'd keep your SOL." | "You set aside $100. Target $109 · today $118.45 (needs −8.0%). *If it ended now:* your $100 comes back." | "No action needed" |
| `awaiting_price` | ended, no price posted | **Waiting for final price** | "Your deal ended Fri 30 Oct, 4:00 PM. We're waiting for the official final price; this usually takes minutes, sometimes hours." After 6 h: "Taking longer than usual. Your funds are safe in the lock." | Same | — |
| `safety_check` | poster price, and now < `postedTs` + 30 min | **Safety check** · 18 min | "Final price $131.20. *Looks like:* **Sold at $128.** We double-check for 30 minutes before paying out." | "Final price $105.00. *Looks like:* **Bought 0.9174 SOL.**" | — |
| `ready` | safety window over (or a governance price), not settled | **Ready** | "Your $128.00 is on its way." | "Your 0.9174 SOL is on its way." | Automatic; **Collect** as fallback |
| `collecting` | local, while the settle is in flight | **Collecting…** | — | — | — |
| `kept` | settled, no swap | **Kept** | "SOL finished at $120.40, under your $128 target. Your **1 SOL is back**. You earned **$4.19**." | "SOL finished at $115.10, above $109. Your **$100 is back**. You earned **$3.27**." | **Go again** |
| `sold` | settled; Sell High and final ≥ target | **Sold at $128** | "SOL finished at $131.20, at or above your $128 target. You sold 1 SOL for **$128.00** and earned **$4.19**: **$132.19** in total." What-if: "1 SOL is worth $131.20 today." | — | Go again |
| `bought` | settled; Buy Low and final ≤ target | **Bought 0.9174 SOL** | — | "SOL finished at $105.00, at or below $109. You bought **0.9174 SOL** with your $100 and earned **$3.27**." What-if: "That SOL is worth $96.33 today." | Go again |
| `returned` | settled with no price, or a backend flag | **Returned** | "The safety council closed this deal early and returned your 1 SOL. You keep your $4.19." | "…returned your $100. You keep your $3.27." | Learn why |

**Notes that apply in every state.**
- "If it ended now" is a **hint**, not a forecast. Label it that way and put it behind a small (i).
- One posted price decides **every** deal on that asset and end date.
- History cards keep the outcome, final price and total earned forever; closed position accounts stay on chain.
- The deal detail screen has a vertical timeline: **Deal opened & paid → Growing → Deal ended → Final price published → 30-min safety check → Money in your wallet.** Each step shows a local timestamp once it has happened.

---

## 4. Glossary (for "What's this?" tooltips and the Learn hub)

Each entry gives **the only wording used in the app**, then in brackets the code, web or marketing names it replaces, then a one-sentence tooltip. Entries marked (Adv) appear only under "How is this priced?" or "Advanced".

- **Sell High** (covered call, `sell_sol`, call): lock something you own, name a higher price you'd happily sell at, and get paid today.
- **Buy Low** (cash-secured put, `buy_sol`, put): set aside digital dollars, name a lower price you'd happily buy at, and get paid today.
- **Deal** (position): one promise, with its own target price and end date.
- **Upfront pay** (premium, yield, income, `yield_amount`): money paid to you the moment the deal starts. It's yours whatever happens next.
- **Target price** (strike, fixed price): the price you agree to sell at (Sell High) or buy at (Buy Low).
- **End date** (expiry, maturity, "Sep_26"): when the deal ends and the final price is checked, shown in your local time.
- **Final price** (settlement, reference or delivery price): the official price that decides your deal. Everyone on that asset and date gets the same number.
- **Today's price** (spot, index price): what the asset is worth on the market right now.
- **What you lock** (collateral, size, deposit): the asset for Sell High, digital dollars for Buy Low.
- **Digital dollars (USDC)**: a digital version of the US dollar; 1 USDC ≈ $1.
- **% of what you lock** (`yield_pct`): your pay as a share of what you locked, valued at today's price.
- **Yearly rate** (APR, Max/Min APR): your pay scaled up to a year, as if you repeated the deal. It isn't a promise, and short deals make it look huge.
- **Kept** (OTM): the price didn't reach your target, so you got back exactly what you locked.
- **Sold / Bought** (exchanged, filled, ITM): the price ended at or beyond your target, so the trade happened at your target price. Landing exactly on the target counts.
- **Partner** (market maker, MM, desk): a professional trading firm that pays your upfront pay and locks its side of the deal in advance.
- **Offer** (quote, RFQ, binding quote, "best of N quotes"): a firm price for your exact deal, the best of several partners' offers. The estimate shown before it is labelled "**about**" (indicative).
- **Offer held for 0:30** (`valid_until`): offers last 30 seconds, and we fetch a fresh one automatically.
- **Approve → Partner confirms → Locking your deal** (sign → co-sign → broadcast/confirm): you approve in your wallet, the partner adds its approval, and the deal is recorded on Solana in seconds.
- **Waiting for final price** (awaiting price): the deal has ended, but the official price hasn't been published yet.
- **Safety check (30 min)** (dispute window): a pause after the final price is published, so a wrong price can be fixed before any money moves.
- **Collect** (settle, claim): sends everyone their money. It normally happens automatically.
- **Safety council** (governance, 3-of-5 multisig): five keyholders. Any three together can correct a wrong price or, in an emergency, return everyone's funds.
- **Returned** (emergency cancel): the council closed the deal early. You got back what you locked and kept your pay.
- **PAYtience fee** (protocol fee, `fee_pct`): the share PAYtience keeps; 0% right now.
- **Network fee** (gas, rent, fee payer): a tiny blockchain cost. Our partner pays it when you open a deal, so you need no SOL to start.
- **The lock** (vault, escrow, PDA): an on-chain safe that holds both sides until the end date. Nobody can redirect it.
- **Fully funded** (fully collateralized): your partner locks its full side on day one, so your payout already exists.
- **Your wallet** (non-custodial): where your money lives. PAYtience never holds your keys.
- **Receipt** (transaction, signature, explorer link, base58 address): proof the deal happened on the public blockchain. Addresses appear under Advanced only.
- **Practice mode / practice money** (devnet, faucet, test USDC, airdrop): a test network with free play money that has no real value.
- **Live / Preview / Coming soon** (`tradable`, QUOTE, SOON): you can deal now / you can see the pay but can't deal yet / not available yet.
- **Stock token** (RWA, "on" suffix): a token that tracks a real share's price, such as Tesla.
- **Pre-IPO** (PreStocks): a token that tracks shares of a private company that isn't on the stock market yet.
- **Model estimate** (synthetic, `prestocks_synthetic`): no real options market exists for this asset, so the pay comes from a pricing model.
- **Delayed 15 min** (Alpaca indicative feed): stock prices can lag by up to 15 minutes, and don't move while US markets are closed.
- **Wrapped** (WBTC, WETH): a token that tracks Bitcoin or Ether one-for-one on Solana.
- **Price swings** (Adv; implied vol, `atm_vol`): how much the market expects the price to move. Bigger swings mean more pay and a likelier swap.
- **"+8.1% above today"** (moneyness): how far your target is from today's price.
- **Deal size** (notional): your deal's dollar value at your target price.
- **This date is full** (exposure, caps): partners can only take on so much per date, so try another date.
- **Where this number comes from** (Adv; Deribit, Alpaca, PreStocks, instrument, `price_source`): the crypto options market, the US stock options market, or a model.
- **Autopilot** (vault, epoch, TVL, low-delta, sentiment, "Principal Protected"): a set-and-forget plan that repeats Sell High every 14-day cycle, with a target about 3–7% above today's price (preview only).
- **Grow my coins / Pay me cash** (compounding / income mode): reinvest the pay into more of the asset, or keep it as cash you can withdraw.
- **Patience Points, Level, Streak, Season, Badge, Leaderboard** (points, tier, "overwriters/makers"): rewards for learning, check-ins, finished deals and invites. They aren't money, and the leaderboard ranks points, not trading volume.
- **Never shown:** nonce, rfq_id, PDA, blockhash, price poster, option mark. Forward price appears under Advanced at most.

## 5. User flows and their states

Each flow lists its steps, then its **Loading · Empty · Error · Edge** states. Every error appears as a friendly card with a retry; raw strings appear only under "Details" and in logs. The mapping table at the end of this section translates every raw reason.

**F0. Shell and status.** At most one banner shows at a time, in this priority order:
1. Offline or unreachable (including a Cloudflare 530 plain-text body): "Can't reach PAYtience. Check your connection." Pip sleeps, and the app retries on its own.
2. `mm_count 0`: "Our partners are napping. Look around; offers will be back soon."
3. `dry_run`: "Preview mode: you can see offers but can't start deals right now."
4. The practice ribbon (always on).

*Edge:* `fresh:false` adds a "Prices warming up" chip to that asset. A 429 shows "Busy moment, retrying…" and backs off.

**F1. First launch.**
1. Pip waves: "Get paid while you wait."
2. Three cards: Name a price · Get paid today (yours either way) · Let the market come to you.
3. Intent question:
   - "I own crypto or stocks and would sell if the price gets high" → Sell High
   - "I have dollars and would buy if it drops" → Buy Low
   - "Just curious" → Learn
4. An optional "How would you describe yourself?" question (from the waitlist) sets how much guidance to show.
5. **Risk primer:** 4 cards, each needing a tap: you may end up selling or buying · your money is locked until the date · pay isn't guaranteed and prices move · practice money has no value.

*Edge:* onboarding can be skipped, but the primer must be completed before the first Approve.

**F2. Practice money (faucet).**
1. Checklist step: "Get free practice money: $1,000 test dollars + a little test SOL."
2. The token is chosen automatically: USDC, or the asset itself when selling a listed asset.
3. Progress runs for up to ~30 s ("Printing your practice dollars…"), then a success message appears. Balances refresh 2.5 s later.

- *Empty:* if `GET /faucet` returns 404, hide the faucet everywhere.
- *Error:*
  - 429 `faucet cooldown: try again in N min` → "You've had practice money recently. More in N min." (a countdown per token)
  - 503 `<SYM> has no price yet` → "Practice {name} isn't ready yet. Try in a minute."
  - 502 `faucet mint failed` → "That didn't work. Try again."
  - 502 `…outcome unknown…` → "Not sure it arrived. Check your balance in a minute." (the cooldown is kept)
- *Edge:*
  - `sol_airdrop_signature` null → "Got your $1,000. Test SOL is busy; try later."
  - The faucet grants only **0.5 SOL**, so the web's default of 1 SOL for Sell High would fail. Defaults must depend on the balance, and the app should suggest Buy Low first.

**F3. Connect or sign in.**
1. Ask only when needed (at Review or when getting practice money).
2. Offer "Continue with email / Apple / Google" (embedded wallet, mocked) or "Use a Solana wallet app" (Mobile Wallet Adapter on Android and Seeker).
3. After the app switch, return to the same step: "Welcome back. Connected as AbCd…WxYz."

- *Error:* the user cancelled · no wallet app installed ("Use email instead?") · the wallet can't sign.
- *Edge:*
  - iOS offers the embedded wallet only.
  - Transactions must be **legacy**.
  - Reconnect silently on relaunch.
  - Never disconnect on a single tap, as the web does.

**F4. Home (Cloud Garden).**
- Greeting.
- **Coin Jar** ("Upfront pay earned: $X"), "Locked now: $Y", and "Next deal ends Fri 30 Oct · in 32 days".
- Garden pots; pots that are ready bloom.
- Daily check-in and tip.
- Practice checklist: connect → practice money → first deal → learn 3 terms.

- *Loading:* skeleton clouds.
- *Empty:* Pip with a watering can: "Your garden is empty. Plant your first deal and get paid today."
- *Error:* show the last good data with "Updated 2 min ago".
- *Edge:* an unknown price shows "—" for that part only. The night sky follows local time. More than 12 deals: the garden scrolls and shows "See all".

**F5. Browse (Earn).**
- Goal toggle **Sell High | Buy Low**. It defaults to the intent answer, or to Buy Low (as on the web) if there's no answer.
- Category chips and search.
- Each card shows the friendly name, ticker, today's price, a state badge, and "On $100 for ~1 month: get **$0.92–$4.70** today".
- An "Autopilot: coming soon" row.

- *Loading:* skeleton cards, showing "—" until the board arrives.
- *Empty:* "No match for 'xyz'. Try 'Solana' or 'Tesla'."
- *Error:* "Offers unavailable right now"; the card stays tappable.
- *Edge:*
  - PYTH is hidden in Buy Low.
  - Coming soon cards are greyed out but still tappable.
  - Pre-IPO cards carry a "Model estimate" badge; stock cards carry "Delayed 15 min" or "Market closed".
  - **Cards never show the yearly rate.**

**F6. Asset detail.**
- The price, plus an optional sparkline.
- Two goal cards: "I'd sell my SOL at a higher price → **Sell High**" and "I'd buy SOL at a lower price → **Buy Low**".
- A short "How it works" using the §3.1 examples.

*Edge:* choosing Sell High without holding the asset → "You'll need SOL to lock. Get practice SOL?" (or suggest Buy Low). Preview and Coming soon assets go to F13 and F14.

**F7. End date.**
- Chips such as "Fri 30 Oct · 32 days · about $X on $100 · ends 4:00 PM your time".
- **Pre-select the date nearest to 30 days.**

- *Empty:* "No dates available right now."
- *Edge:*
  - Only dates 3–90 days out; pre-IPO has just 3 dates.
  - Tag a date "Almost full" when `perExpiry[ts]` reaches 90% of `capPerExpiryUsd`.
  - A date with no board row is disabled ("No offers for this date").
  - Changing the date clears the target and the offer.

**F8. Target price.**
- Up to 4 cards (2 for pre-IPO), nearest first. Each shows the price, "+8.1% above today", "Get about **$4.19**" and an intensity bar.
- Legend: "More pay · more likely to swap ↔ Less pay · less likely to swap". Pip explains it on first use.
- The Sell High "Keep my coins" preset picks the farthest target; this covers the marketing idea "Earn While Holding".

- *Loading:* "Loading live targets…"
- *Empty:* "No offers for this date."
- *Error:* stale price → retry automatically every 10 s.
- *Edge:* targets snap to listed strikes, so the gaps between them look uneven. No custom targets in v1. A rough chance of a swap appears only under "How is this priced?".

**F9. Amount.**
- Input in collateral units, with a "≈ $" equivalent.
- Presets: Sell High 25/50/75%/Max; Buy Low $25/$50/$100/Max.
- Live line: "You lock 1 SOL · get about $4.19 today · if sold you get $128.00".

*Inline errors:*
- "More than you have (0.49 SOL)", linking to practice money.
- "A deal can be up to $2,500 right now." Check before quoting: for Sell High the size is qty × target; for Buy Low it's the USDC amount.
- "Too small to pay out. Try at least $10."

*Edge:* Max keeps 0.01 SOL back. Decimals follow the device locale. When disconnected, the estimate still works and the balance shows "—".

**F10. Review and locked offer** (the confirm screen the web never had).
1. "**Paid to you now: $4.19**" (3.53% of what you lock), with the yearly rate on an (i) line.
2. Teal and coral outcome cards, both dated: "If SOL is **under $128** on Fri 30 Oct, 4:00 PM → your 1 SOL comes back" / "If SOL is **$128 or more** → you get $128.00".
3. Banner: "+$4.19 is yours either way."
4. "Locked until Fri 30 Oct. **You can't withdraw early.**"
5. "Best of 3 offers · PAYtience fee 0% · No network fees for you".
6. Expandable sections: "What if the price moves a lot?" and "How is this priced?".
7. A 30 s ring, then **Slide to approve**.

- *Loading:* the RFQ fires on entry, debounced 450 ms.
- *Error:* a mapped decline card with links back to Date or Target.
- *Edge:*
  - Not connected → go through F3 first.
  - When the offer runs out, re-quote silently with a **new nonce** and flash any change ("Updated from about $4.12").
  - Re-quote when the app returns to the foreground.
  - The risk primer must be completed before the first deal.

**F11. Approve and progress.**
- A 3-step sheet: Approve → Partner confirms → Locking your deal.
- The embedded wallet approves with Face ID or a passcode (mocked). The Approve button is debounced.

*Edge:*
- If `/sign` returns no `signature`, the client broadcasts the transaction itself.
- A **504 partner timeout or disconnect** is never retried blindly. First check whether the position derived from the nonce exists. If it does, show success; if not, show "We didn't hear back. Nothing was taken. Get a fresh offer?"
- Say "Nothing was taken" only when it's true.

**F12. Success and receipt.**
- A skippable coin shower: "Deal on! $4.19 is in your wallet."
- The sprout animates into the garden.
- Buttons: **See my deal** · **Plant another** · "Remind me on Fri 30 Oct".
- The receipt lists the time, what you locked, target, end date, pay and partner, with an explorer link under Advanced.

**F13. Preview asset** (priced, not tradable).
- The same date and target screens, labelled **Preview** and priced on $100 or 1 unit ("about").
- Main button: **Notify me when it's live**, plus "Try it now with Solana".
- No volatility text.

**F14. Coming soon asset.**
- Pip holds a sign: "**Jupiter** isn't available yet. We'll let you know."
- Buttons: [Notify me] · [Try Solana instead].
- Never use the words "devnet" or "listed on chain".

**F15. My Deals.** Two segments:
- **Active:** active, awaiting price, safety check, ready, collecting.
- **Ended:** kept, sold, bought, returned.

Each card shows the icon, "Sell High · Solana", a status chip, "Earned **$4.19**", "Target $128 · Today $118.45", a countdown ring and the "if it ended now" hint. The header shows pay earned so far and the amount locked. This replaces the web's 12-column table.

- *Empty:* "No deals growing. Start one and get paid today." / "Finished deals will show up here."
- *Error:* show the last good data with "Couldn't refresh".
- *Edge:*
  - Sorted soonest first; paginate after 20.
  - No `DealMeta` → hide the %, and base progress on days left.

**F16. Deal detail.**
- A countdown and the two outcome cards. Once the price is posted, the likely outcome is highlighted.
- The timeline (§3.3), a receipt, and "Go again" once the deal has ended.

*Edge:*
- Deals ending at 20:00 UTC show the next day's date in Asia.
- During the safety check say "Looks like: Sold", never just "Sold".

**F17. Collect and outcome reveal.**
- Payout is automatic. When a deal flips to kept, sold or bought, the next app open shows a one-time reveal: the plant blooms, with "You kept your 1 SOL and earned $4.19".
- A **Collect** fallback appears in `ready`.

- *Error:* "Couldn't collect right now. Your funds are safe in the lock."
- *Edge:* `AlreadySettled` from a race counts as success.

**F18. History and Go again.**
- Cards show the outcome badge, final price, total earned and the what-if.
- **Go again** pre-fills the same asset, mode and amount, with the closest similar date and target.
- Filters: All / Kept / Sold / Bought.

**F19. Autopilot (preview).**
- Cards for Gold 8%, Tesla 14% and SK Hynix 12%, plus 6 marked "Coming soon". All are labelled **Preview · not live yet** and have a **Notify me** button.
- The detail page has "Why gold?" cards, "Is this for me?" personas, "Every 14 days, a target 3–7% above today", a disabled "Grow my coins / Pay me cash" toggle, "No deposit or withdrawal fees · 0.5% a year", and "Past results don't predict future results".
- The mock's next-cycle date must be computed from now; 2026-09-17 has already passed.

**F20. Rewards.**
- Points and Level (Seed → Grove), daily streak, season banner, and "How to earn": check in, finish Learn cards, hold a deal to its end, invite friends.
- Badges.
- A referral code (unlocked after the first deal), shared through the native share sheet.
- A points leaderboard with **your row pinned**; no addresses and no volume.
- Points history, using the web's columns.

- *Empty:* "Check in today to start your streak."
- *Edge:* the streak resets at local midnight. The screen is labelled "Points have no cash value."

**F21. Learn hub.**
- Every §4 term has an (i) that opens a Pip explainer sheet.
- Hub content: How it works · Sell High / Buy Low in 60 s · What can go wrong? · What happens on the end date? · Glossary · FAQ · a 3-question quiz that earns points.
- Content is bundled, so it works offline.

**F22. Me.**
- Wallet, balances (labelled as practice), practice money, notifications, Learn/FAQ, Terms/Privacy/Risk, and `hello@paytience.app`.
- **Disconnect** sits behind a confirmation.
- **Hidden dev menu** (tap the version 7×): API base URL (the web's `?mm=`), scenario switcher, time travel, read-only view of any address (the web's `?as=`), reset onboarding, raw errors.

**F23. Notifications** (local in the mock). Each one deep-links to its screen:
- "Your SOL deal ends tomorrow at 4:00 PM."
- "Final price is in: looks like you **kept** your SOL."
- "Money's in! You sold 1 SOL for $128.00."
- "Practice money is ready again."

### Raw reason → friendly copy (the complete mapping)

| Raw string (source) | Code | Friendly copy → recovery |
|---|---|---|
| `no market maker is online` (503) · health `mm_count 0` | no_partners | "Our partners are napping. Offers will be back soon." → Auto-retry |
| `no market maker responded in time` (504, /rfq) | partner_timeout_unknown | "Our partners took too long to answer." → Try again |
| `rate limited` (429, plain) | rate_limited | "Busy moment, retrying…" → Backoff |
| `reference price is stale` · `<ASSET> reference price is stale` | stale_price | "Prices are catching their breath. Trying again in a moment." → Auto-retry after 10 s |
| `expiry too close` / `expiry too far` | date_too_close / date_too_far | "That date is too soon (pick one at least 3 days away)." / "That date is too far out (pick one within 90 days)." → Back to Date |
| `fixed price too far from market` | target_too_far | "That target is too far from today's price. Pick a closer one." → Back to Target |
| `no Deribit option price for that strike and expiry` · `no option price for that strike and expiry` | no_offer_for_target | "No offer for that exact price and date. Try a neighbouring target." → Back to Target |
| `yield below minimum; pick a fixed price closer to market or a later expiry` | pay_too_small | "The pay would be too tiny. Try a closer target, a later date or a bigger amount." → Back |
| `amount N USD exceeds per-position maximum 2500 USD` | over_deal_max | "One deal can be up to $2,500 right now." → Edit amount |
| `desk cap for this expiry reached (5000 USD)` | date_full | "This date is full right now. Try another date." → Back to Date |
| `desk aggregate cap reached (20000 USD)` | partners_full | "Our partners are fully booked. Please try again later." |
| `<ASSET> is quote-only; it is not listed on chain` | preview_only | "Tesla is preview-only for now." → Notify me |
| `notional must be positive` · `unknown asset X; see GET /assets` (404) | internal | "Enter an amount above zero." / "We couldn't find that asset. Pull to refresh." → Edit / Refresh |
| `invalid rfq: …` (any, including `expiry_ts must be 08:00 UTC` / `20:00 UTC`, `token X does not match product Y`) | internal | "Something went wrong on our side. Please try again." → Retry; log it |
| `no market maker quoted: a; b` | first known | Use the first reason that maps; otherwise the generic message |
| `quote expired` · `quote already used` · `no quote for this nonce` | offer_expired | "Your offer timed out. Here's a fresh one." → Auto re-quote |
| `reference price moved X.XX% since quote` | price_moved | "The price moved while you were approving. Here's an updated offer." → Auto re-quote |
| `dry run: desk is not co-signing` | dry_run | "Preview mode: partners are showing prices but not taking deals right now." |
| `market maker <id> is not connected` (422) | partner_gone | "That partner just stepped away. Getting you a new offer…" → Auto re-quote |
| `market maker did not respond in time` · `market maker disconnected` (504, /sign) | partner_timeout_unknown | "We didn't hear back from our partner. Checking your deal…" → **Check the position first**, then offer to re-quote |
| `broadcast failed: … insufficient …` · chain insufficient funds | insufficient_balance | "Not enough balance for this deal." → Edit amount / Practice money |
| `broadcast failed: <rpc>` | broadcast_failed | "Your deal couldn't be sent. Nothing was taken." → Try again |
| `Transaction failed on chain: {…}` | chain_failed | "The network didn't accept this deal. Nothing was taken." → Try again; Details |
| `user signature missing/invalid` · `transaction does not match quote: …` · `fee payer is not this market maker` · `account … is not the expected address` · `missing recent blockhash` · `invalid transaction: …` · `market maker returned no/invalid transaction` | internal | "Something went wrong preparing your deal. Nothing was taken." → Re-quote; log it |
| Wallet rejection (user cancelled) | wallet_rejected | "You cancelled in your wallet. No problem, nothing happened." → Approve again |
| "This wallet cannot sign transactions." | wallet_cannot_sign | "This wallet can't approve deals. Try another way to connect." → Connect |
| Network error, timeout, non-JSON body (Cloudflare 530 "error code: 1033") | offline | "Can't reach PAYtience. Check your connection." → Auto-retry |

Faucet errors are mapped in F2. Settle program errors (`NotExpiredYet`, `AlreadySettled`, `SettlementPriceMissing`, `DisputeWindowOpen`) are never shown to the user; refresh and show the deal's real status instead.

---

## 6. Brand voice and key copy

### 6.1 Voice

- **Calm, warm, patient.** Short sentences, often in threes ("Name a price. Get paid. That's it."). Second person, plain English. Exclamation marks only in celebrations.
- **Honest before hopeful.** Never say "guaranteed", "risk-free", "passive income" or "free money". "You keep the pay either way" is true; "you can't lose" is false.
- **Patience is a strength.** Pip never rushes you. The 30 s ring is framed as "I'll keep it fresh for you", never as urgency.
- **Dollars first.** Lead with "$4.19 today", then the %, then the yearly rate in small print.
- **No trader talk.** Options terms appear only in "For the curious" sections ("Sell High is what traders call a covered call").

**Banned words in the main flow:** position, option, premium, yield, strike, expiry, collateral, market maker, quote, settle, claim, dispute window, devnet, faucet, OTM/ITM, and "Sell high" in lowercase. Use the §4 vocabulary instead. "Reward" is reserved for points.

### 6.2 Taglines

- **Primary:** "Get paid while you wait."
- **Long form:** "Get paid while waiting for the price you want."
- **Support lines (from marketing):** "The price you want, on your terms." · "Name a price. Get paid. That's it." · "Waiting should get paid." · "Built for holders, not traders." · "Stop waiting for free." · "Be first to get paid for patience." · "Solana first. Seeker next."
- **New:** "Plant a price. Pocket the pay." · "Patience, paid." · "Your price. Your date. Paid today."
- **404 / unknown screen:** "Even our patience couldn't find this page." (existing brand copy)

### 6.3 Key strings

**Button labels (web → mobile):**
- Market makers offline → Partners napping
- Select price → Pick a target
- Connect wallet to continue → Continue (opens connect)
- Insufficient balance → Not enough balance
- Getting quote… → Getting your offer…
- Quote declined → Try another date / target
- Sign in your wallet… → Approve in your wallet
- Market maker co-signing… → Partner confirming…
- Broadcasting… / Confirming on devnet… → Locking your deal…
- Earn upfront premium now → **Slide to approve**
- View position in dashboard → See my deal
- Quote only · not tradable on devnet → Notify me when it's live
- Settle → Collect (fallback only)
- GET TEST USDC + SOL → Get practice money

**Pip lines:**
- "Hi, I'm Pip. I help your patience pay."
- "Closer targets pay more, because the swap is more likely."
- "Here's the whole deal. Two endings, and the pay is yours in both."
- "Deal's done. Just waiting for the official price."
- "You kept your SOL and earned $4.19. Plant again?"
- "Oops, that didn't work. Nothing was taken."

Empty-state copy is listed with each flow in §5.

**Practice ribbon:** "Practice mode · test money, no real value."

**Disclaimer** (on Review, the FAQ and Autopilot): "Upfront pay isn't guaranteed and prices can move against you. Not financial advice. Only lock what you're comfortable trading at your price."

### 6.4 FAQ

1. **How do I get paid while I wait?** Pick an asset, a price you'd happily sell or buy at, and a date. A partner pays you right away for that promise. (For the curious: it's a covered call or a cash-secured put, handled for you.)
2. **When do I get the money?** Right away, the moment your deal starts. It lands in your wallet as digital dollars (USDC).
3. **Do I keep the pay if the trade happens?** Yes. You keep it in every outcome.
4. **What happens on the end date?** We check the official final price. With Sell High, if it's at or above your target, your asset is sold at your target; otherwise you get it back. With Buy Low, if it's at or below your target, you buy at your target; otherwise your dollars come back.
5. **What if the price lands exactly on my target?** That counts as reaching it, so the trade happens.
6. **Can I lose money?** Yes, in two ways. With Sell High, if the price shoots past your target, you still sell at your target and miss the extra rise. With Buy Low, if the price falls far below your target, you still buy at your target, so what you bought is worth less than you paid. Anything you've locked can also simply fall in value while it's locked. The upfront pay softens this but doesn't prevent it.
7. **Can I cancel early or take my money out?** No. Your deal is locked until the end date. That's what lets partners pay you upfront.
8. **Why do some offers pay more?** Closer targets, later dates and bumpier assets pay more, because the trade is more likely to happen.
9. **What's the "yearly rate"?** Your pay stretched over a year, as if you repeated the same deal again and again. It isn't a promise. Very short deals can show huge yearly rates on small amounts of money, so look at the dollar amount first.
10. **Who pays me, and is it safe?** Professional partners compete to pay you. Both sides are locked in an on-chain safe on day one, so your payout already exists. A safety council (3 of 5 must agree) can fix a wrong price or, in an emergency, return everyone's funds; you'd keep your pay. Smart contracts can still have bugs, and that is a real risk.
11. **Do I need to do anything when it ends?** Usually not. After a 30-minute safety check, the money is sent to your wallet automatically.
12. **Are there fees?** PAYtience's fee is 0% right now. Our partner pays the network fees when you open a deal.
13. **Is this real money?** Not yet. PAYtience is in practice mode on Solana's test network, and practice money has no value.
14. **Which wallets work?** Sign in with email, Apple or Google, or connect a Solana wallet app (Phantom, Solflare, Seeker). PAYtience never holds your keys.

---

## 7. What newcomers will find risky or confusing, and what the app must do

1. **You might have to sell or buy.** Show the two outcome cards before every Approve. Coral means "the trade happens", not "error". Include the risk primer (F1, F10).
2. **Sell High caps your upside.** Show a real what-if: "1 SOL would be worth $150; you got $132.19."
3. **Buy Low can buy into a falling price.** Show "0.9174 SOL is worth $87.16 today", and say "you buy at your target even if the market is lower".
4. **The upfront pay is kept in every outcome**, including a safety-council return. Put a banner across both outcome cards; the Coin Jar counts the pay from day one.
5. **Money is locked until the end date.** There is no cancel, and marketing's "Cancel anytime" is false. Use a lock notice, slide-to-approve and FAQ #7. Never show a cancel button.
6. **Landing exactly on the target counts as a swap.** Always write "at or above" / "at or below". Seeded position #6 demonstrates it.
7. **The yearly rate misleads** (175.8% for 1.9% over 4 days), and it differs from the % per deal. Show dollars first, then %, then the yearly rate behind an (i). Never show it on asset cards. The default date is about 30 days out.
8. **"The garden grows" does not mean "your money grows".** Nothing compounds or rolls over. Coins arrive on day one; plant growth only shows the time left. Autopilot is marked Preview.
9. **Practice money has no value.** Keep the ribbon always on, put a practice chip on every balance, and explain it in Me.
10. **Pre-IPO pay is a model estimate**, and the token's price can differ from the company's own valuation. Add a badge and a "How is this priced?" sheet.
11. **Stock prices are delayed 15 min** and don't move outside US market hours. Show "Delayed 15 min" and "Market closed" labels.
12. **There are two end times, and 20:00 UTC shifts with US daylight saving** (it falls at night in Asia). Always show local time, including a next-day date when it applies ("Sat 31 Oct, 4:00 AM").
13. **"Waiting for final price" can last hours**, because a manual script posts the price today. Reassure the user after 6 h, and send a push notification when the money lands.
14. **The safety check starts when the price is posted**, and governance can still correct the price. Say "Looks like" until the deal is settled.
15. **Offers expire after 30 s, and are refused if the price moves more than 1%.** Use a calm ring and a silent refresh, and flash the new amount. No urgency, no guilt.
16. **Limits: $2,500 per deal, $5,000 per date, $20,000 total.** Check the amount before quoting, tag dates "Almost full", and use friendly "date is full" copy.
17. **On the web, whoever presses Settle pays the fee**, and they need SOL to do it. The mobile payout is automatic by design, with Collect only as a fallback. The backend decision is in §8.
18. **Sell High needs the asset**, and practice money gives only 0.5 SOL. Make default amounts depend on the balance, and suggest Buy Low first.
19. **Fractional amounts look odd** (0.100409671 ANTHROPIC). Show 4 significant figures plus "about $100 at your price", with the exact figure on tap.
20. **"If it ended now" is a hint, not a forecast.** Label it as a hint.
21. **An emergency return looks like a normal close on chain.** Give "Returned" its own state and a Learn card about the safety council.
22. **Points are not money**, and no token or airdrop is implied. Rank by points, never by volume or deal size.
23. **Deals are public on Solana**, tied to a wallet address rather than a name. Say so in Privacy and in Learn.
24. **Smart-contract and partner risk is real.** Cover it in FAQ #10 and the risk primer; don't bury it.
25. **This is not financial advice.** Pip never recommends an asset or a target; all copy stays neutral.

---

## 8. Open questions for the user (answer before the backend phase)

1. **Mascot:** please share frames from the promo video or the source art, and confirm the name (Pip, Bean, Pati or another). Also confirm the coin and leaf colours.
2. **Wallet:** which embedded or social-login wallet provider to use (for iOS and non-crypto users), and whether to support the Solana Mobile Wallet Adapter on Android and Seeker.
3. **Settlement:** will the backend settle deals automatically, or pay the settle fee? The answer decides whether "Collect" ever appears.
4. **Rewards:** will points, seasons and referrals get a backend, or stay a UI preview?
5. **Autopilot:** keep it as a preview in v1, or hide it?
6. **Font:** Nunito (proposed, rounded) or the marketing site's Roboto?
7. **Default mock scenario for demos:** `showcase` (SOL, Tesla and Anthropic live) or `devnet_strict` (SOL only)?
8. **Mainnet:** when practice mode ends, the faucet, the ribbon and all test-money copy must be removed. Should there also be a region or eligibility gate?