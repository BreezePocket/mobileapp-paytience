export type AssetCategory = 'crypto' | 'stocks' | 'metals' | 'preipo';
/** live = can open deals · quote = preview pay only · soon = not available yet */
export type MarketState = 'live' | 'quote' | 'soon';

export type Asset = {
  symbol: string; // backend `asset` symbol (DeskAsset.asset)
  name: string; // friendly name, shown first
  ticker: string; // short ticker shown second
  blurb: string;
  category: AssetCategory;
  price: number; // live spot in USD from the backend; NaN until known
  vol: number; // live at-the-money volatility (fraction)
  state: MarketState; // from the backend: tradable → live, priced → quote, unknown → soon
  fresh: boolean; // false while the backend's price for it is stale
  mint: string | null; // listed SPL mint; null for SOL
  payoutDecimals: number; // decimals of the token on chain
  expiryUtcHour: 8 | 20;
  buyLow: boolean;
  color: string; // icon background
  glyph: string; // 1-3 chars on the icon
  badge?: 'Model estimate' | 'Delayed 15 min' | 'Wrapped';
  decimals: number;
};

export const CATEGORY_LABEL: Record<AssetCategory, string> = {
  crypto: 'Crypto',
  stocks: 'US Stocks',
  metals: 'Gold & Silver',
  preipo: 'Pre-IPO',
};

type Catalog = Omit<Asset, 'decimals' | 'price' | 'vol' | 'state' | 'fresh' | 'mint' | 'payoutDecimals'> & { decimals?: number };
/** Catalog entries carry only presentation data; every market value arrives from the backend via `applyLiveAssets`. */
const c = (a: Catalog): Asset => ({ decimals: 9, price: NaN, vol: NaN, state: 'soon', fresh: false, mint: null, payoutDecimals: 9, ...a });

export const ASSETS: Asset[] = [
  // Crypto
  c({ symbol: 'SOL', name: 'Solana', ticker: 'SOL', blurb: 'The fast, low-fee blockchain PAYtience runs on.', category: 'crypto', expiryUtcHour: 8, buyLow: true, color: '#14F195', glyph: '◎', decimals: 9 }),
  c({ symbol: 'WBTC', name: 'Bitcoin', ticker: 'BTC', blurb: 'The original cryptocurrency, as a token on Solana.', category: 'crypto', expiryUtcHour: 8, buyLow: true, color: '#F7931A', glyph: '₿', badge: 'Wrapped', decimals: 8 }),
  c({ symbol: 'WETH', name: 'Ether', ticker: 'ETH', blurb: "Ethereum's coin, as a token on Solana.", category: 'crypto', expiryUtcHour: 8, buyLow: true, color: '#627EEA', glyph: 'Ξ', badge: 'Wrapped', decimals: 8 }),
  c({ symbol: 'JUP', name: 'Jupiter', ticker: 'JUP', blurb: "Token of Solana's biggest swap app.", category: 'crypto', expiryUtcHour: 8, buyLow: true, color: '#1BD9A1', glyph: 'J' }),
  c({ symbol: 'PYTH', name: 'Pyth Network', ticker: 'PYTH', blurb: 'A network that brings prices on-chain.', category: 'crypto', expiryUtcHour: 8, buyLow: false, color: '#7A5CFA', glyph: 'P' }),
  c({ symbol: 'RAY', name: 'Raydium', ticker: 'RAY', blurb: 'A trading app on Solana.', category: 'crypto', expiryUtcHour: 8, buyLow: true, color: '#C200FB', glyph: 'R' }),
  // US stocks & ETFs
  c({ symbol: 'TSLAon', name: 'Tesla', ticker: 'TSLA', blurb: 'Electric cars and energy. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#E31937', glyph: 'T', badge: 'Delayed 15 min' }),
  c({ symbol: 'NVDAon', name: 'NVIDIA', ticker: 'NVDA', blurb: 'Chips that power AI. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#76B900', glyph: 'N', badge: 'Delayed 15 min' }),
  c({ symbol: 'AAPLon', name: 'Apple', ticker: 'AAPL', blurb: 'iPhone maker. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#555555', glyph: 'A', badge: 'Delayed 15 min' }),
  c({ symbol: 'MSFTon', name: 'Microsoft', ticker: 'MSFT', blurb: 'Windows, Office and cloud. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#00A4EF', glyph: 'M', badge: 'Delayed 15 min' }),
  c({ symbol: 'AMZNon', name: 'Amazon', ticker: 'AMZN', blurb: 'Online shopping and cloud. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#FF9900', glyph: 'a', badge: 'Delayed 15 min' }),
  c({ symbol: 'GOOGLon', name: 'Alphabet (Google)', ticker: 'GOOGL', blurb: 'Search, YouTube and Android. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#4285F4', glyph: 'G', badge: 'Delayed 15 min' }),
  c({ symbol: 'METAon', name: 'Meta', ticker: 'META', blurb: 'Facebook, Instagram, WhatsApp. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#0668E1', glyph: '∞', badge: 'Delayed 15 min' }),
  c({ symbol: 'NFLXon', name: 'Netflix', ticker: 'NFLX', blurb: 'Streaming shows and films. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#E50914', glyph: 'N', badge: 'Delayed 15 min' }),
  c({ symbol: 'COINon', name: 'Coinbase', ticker: 'COIN', blurb: 'A big US crypto exchange. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#0052FF', glyph: 'C', badge: 'Delayed 15 min' }),
  c({ symbol: 'MSTRon', name: 'Strategy', ticker: 'MSTR', blurb: 'A company that holds lots of Bitcoin. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#D9232E', glyph: 'S', badge: 'Delayed 15 min' }),
  c({ symbol: 'SPYon', name: 'S&P 500 ETF', ticker: 'SPY', blurb: 'A basket of 500 big US companies.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#1B3C87', glyph: '500', badge: 'Delayed 15 min' }),
  c({ symbol: 'QQQon', name: 'Nasdaq-100 ETF', ticker: 'QQQ', blurb: 'A basket of 100 big US tech companies.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#00A0DF', glyph: '100', badge: 'Delayed 15 min' }),
  c({ symbol: 'HYNIXon', name: 'SK Hynix', ticker: 'HYNIX', blurb: 'Memory chips. Stock token.', category: 'stocks', expiryUtcHour: 20, buyLow: true, color: '#F37321', glyph: 'SK' }),
  // Gold & silver
  c({ symbol: 'PAXG', name: 'Gold', ticker: 'PAXG', blurb: 'A token backed by real gold.', category: 'metals', expiryUtcHour: 20, buyLow: true, color: '#E4B43C', glyph: 'Au' }),
  c({ symbol: 'XAGon', name: 'Silver', ticker: 'XAG', blurb: 'A token that tracks silver.', category: 'metals', expiryUtcHour: 20, buyLow: true, color: '#A8B2BD', glyph: 'Ag' }),
  // Pre-IPO
  c({ symbol: 'ANTHROPIC', name: 'Anthropic', ticker: 'ANTHROPIC', blurb: 'AI company, not on the stock market yet.', category: 'preipo', expiryUtcHour: 8, buyLow: true, color: '#D97757', glyph: 'A', badge: 'Model estimate' }),
  c({ symbol: 'OPENAI', name: 'OpenAI', ticker: 'OPENAI', blurb: 'AI company, not on the stock market yet.', category: 'preipo', expiryUtcHour: 8, buyLow: true, color: '#10A37F', glyph: 'O', badge: 'Model estimate' }),
  c({ symbol: 'SPACEX', name: 'SpaceX', ticker: 'SPACEX', blurb: 'Rockets and Starlink. Private company.', category: 'preipo', expiryUtcHour: 8, buyLow: true, color: '#1D1D1F', glyph: 'X', badge: 'Model estimate' }),
  c({ symbol: 'ANDURIL', name: 'Anduril', ticker: 'ANDURIL', blurb: 'Defence tech. Private company.', category: 'preipo', expiryUtcHour: 8, buyLow: true, color: '#3B3B3B', glyph: 'A', badge: 'Model estimate' }),
  c({ symbol: 'NEURALINK', name: 'Neuralink', ticker: 'NEURALINK', blurb: 'Brain-computer chips. Private company.', category: 'preipo', expiryUtcHour: 8, buyLow: true, color: '#6B5BD2', glyph: 'N', badge: 'Model estimate' }),
  c({ symbol: 'FIGUREAI', name: 'Figure AI', ticker: 'FIGUREAI', blurb: 'Humanoid robots. Private company.', category: 'preipo', expiryUtcHour: 8, buyLow: true, color: '#222F3E', glyph: 'F', badge: 'Model estimate' }),
  c({ symbol: 'KALSHI', name: 'Kalshi', ticker: 'KALSHI', blurb: 'Prediction markets. Private company.', category: 'preipo', expiryUtcHour: 8, buyLow: true, color: '#00C28B', glyph: 'K', badge: 'Model estimate' }),
  c({ symbol: 'POLYMARKET', name: 'Polymarket', ticker: 'POLYMARKET', blurb: 'Prediction markets. Private company.', category: 'preipo', expiryUtcHour: 8, buyLow: true, color: '#2E5CFF', glyph: 'P', badge: 'Model estimate' }),
];

export const ASSET_BY_SYMBOL: Record<string, Asset> = Object.fromEntries(ASSETS.map((a) => [a.symbol, a]));

const MINT_TO_SYMBOL: Record<string, string> = {};
export function symbolForMint(mint: string | null): string | undefined {
  return mint == null ? 'SOL' : MINT_TO_SYMBOL[mint];
}

type LiveAsset = {
  asset: string;
  underlying: string;
  venue: string;
  tradable: boolean;
  fresh: boolean;
  spot: number | null;
  atm_vol: number | null;
  mint?: string | null;
  decimals?: number | null;
  expiry_time_of_day?: number | null;
};

/** Overlay the backend's `health.assets` on the catalog. Assets it does not report become "Coming soon". */
export function applyLiveAssets(live: LiveAsset[] | undefined): void {
  const bySymbol = new Map((live ?? []).map((l) => [l.asset, l]));
  const apply = (a: Asset): Asset => {
    const l = bySymbol.get(a.symbol);
    if (!l) return { ...a, price: NaN, vol: NaN, state: 'soon', fresh: false };
    const isSol = a.symbol === 'SOL';
    return {
      ...a,
      price: l.spot ?? NaN,
      vol: l.atm_vol ?? NaN,
      fresh: l.fresh,
      state: l.tradable && (isSol || !!l.mint) ? 'live' : 'quote',
      mint: isSol ? null : l.mint ?? null,
      payoutDecimals: isSol ? 9 : l.decimals ?? 9,
      expiryUtcHour: l.expiry_time_of_day === 72000 ? 20 : 8,
    };
  };
  for (let i = 0; i < ASSETS.length; i++) ASSETS[i] = apply(ASSETS[i]);
  // an asset the backend prices but the catalog has no artwork for
  for (const l of bySymbol.values()) {
    if (ASSETS.some((a) => a.symbol === l.asset)) continue;
    ASSETS.push(
      apply(
        c({
          symbol: l.asset,
          name: l.underlying || l.asset,
          ticker: l.underlying || l.asset,
          blurb: '',
          category: l.venue === 'alpaca' ? 'stocks' : l.venue === 'prestocks' ? 'preipo' : 'crypto',
          expiryUtcHour: 8,
          buyLow: true,
          color: '#5A7396',
          glyph: (l.underlying || l.asset).slice(0, 1),
        }),
      ),
    );
  }
  for (const a of ASSETS) {
    ASSET_BY_SYMBOL[a.symbol] = a;
    if (a.mint) MINT_TO_SYMBOL[a.mint] = a.symbol;
  }
}

export function getAsset(symbol: string | undefined): Asset | undefined {
  return symbol ? ASSET_BY_SYMBOL[symbol] : undefined;
}

const STATE_ORDER: Record<MarketState, number> = { live: 0, quote: 1, soon: 2 };
export function sortAssets(list: Asset[]): Asset[] {
  return [...list].sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.name.localeCompare(b.name));
}
