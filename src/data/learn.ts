export type TermId =
  | 'sell-high'
  | 'buy-low'
  | 'deal'
  | 'upfront-pay'
  | 'target-price'
  | 'end-date'
  | 'final-price'
  | 'todays-price'
  | 'what-you-lock'
  | 'usdc'
  | 'pct-of-lock'
  | 'yearly-rate'
  | 'kept'
  | 'swap'
  | 'partner'
  | 'offer'
  | 'safety-check'
  | 'safety-council'
  | 'practice-mode'
  | 'preview'
  | 'stock-token'
  | 'pre-ipo'
  | 'model-estimate'
  | 'delayed'
  | 'network-fee'
  | 'the-lock'
  | 'your-wallet';

export const GLOSSARY: Record<TermId, { term: string; plain: string; curious?: string }> = {
  'sell-high': {
    term: 'Sell High',
    plain: 'Lock something you own, name a higher price you’d happily sell at, and get paid today.',
    curious: 'Traders call this a covered call.',
  },
  'buy-low': {
    term: 'Buy Low',
    plain: 'Set aside digital dollars, name a lower price you’d happily buy at, and get paid today.',
    curious: 'Traders call this a cash-secured put.',
  },
  deal: { term: 'Deal', plain: 'One promise with its own target price and end date.' },
  'upfront-pay': {
    term: 'Upfront pay',
    plain: 'Money paid to you the moment the deal starts. It’s yours whatever happens next.',
    curious: 'Traders call this the option premium.',
  },
  'target-price': {
    term: 'Target price',
    plain: 'The price you agree to sell at (Sell High) or buy at (Buy Low).',
    curious: 'Traders call this the strike.',
  },
  'end-date': {
    term: 'End date',
    plain: 'When the deal ends and the final price is checked. Always shown in your local time.',
  },
  'final-price': {
    term: 'Final price',
    plain: 'The official price that decides your deal. Everyone on that asset and date gets the same number.',
  },
  'todays-price': { term: 'Today’s price', plain: 'What the asset is worth on the market right now.' },
  'what-you-lock': {
    term: 'What you lock',
    plain: 'The asset for Sell High, digital dollars for Buy Low. It stays in a safe until the end date.',
  },
  usdc: { term: 'Digital dollars (USDC)', plain: 'A digital version of the US dollar. 1 USDC is about $1.' },
  'pct-of-lock': {
    term: '% of what you lock',
    plain: 'Your pay as a share of what you locked, valued at today’s price.',
  },
  'yearly-rate': {
    term: 'Yearly rate',
    plain:
      'Your pay stretched over a year, as if you repeated the deal again and again. It isn’t a promise, and short deals make it look huge. Look at the dollars first.',
  },
  kept: {
    term: 'Kept',
    plain: 'The price didn’t reach your target, so you got back exactly what you locked. Plus your pay.',
  },
  swap: {
    term: 'Sold / Bought',
    plain:
      'The price ended at or beyond your target, so the trade happened at your target price. Landing exactly on the target counts.',
  },
  partner: {
    term: 'Partner',
    plain: 'A professional trading firm that pays your upfront pay and locks its side of the deal in advance.',
  },
  offer: {
    term: 'Offer',
    plain:
      'A firm price for your exact deal: the best of several partners’ offers. It’s held for 30 seconds and refreshed for you automatically.',
  },
  'safety-check': {
    term: 'Safety check',
    plain: 'A 30-minute pause after the final price is published, so a wrong price can be fixed before money moves.',
  },
  'safety-council': {
    term: 'Safety council',
    plain:
      'Five keyholders. Any three together can correct a wrong price or, in an emergency, return everyone’s funds. You’d keep your pay.',
  },
  'practice-mode': {
    term: 'Practice mode',
    plain: 'A test network with free play money. Nothing here has real value, so it’s the perfect place to learn.',
  },
  preview: {
    term: 'Preview',
    plain: 'You can see what you’d get paid, but deals for this asset aren’t open yet.',
  },
  'stock-token': { term: 'Stock token', plain: 'A token that tracks a real company share’s price, like Tesla.' },
  'pre-ipo': {
    term: 'Pre-IPO',
    plain: 'A token that tracks shares of a private company that isn’t on the stock market yet.',
  },
  'model-estimate': {
    term: 'Model estimate',
    plain: 'No real options market exists for this asset, so the pay comes from a pricing model.',
  },
  delayed: {
    term: 'Delayed 15 min',
    plain: 'Stock prices can lag by up to 15 minutes, and don’t move while US markets are closed.',
  },
  'network-fee': {
    term: 'Network fee',
    plain: 'A tiny blockchain cost. Our partner pays it when you open a deal, so you need nothing extra to start.',
  },
  'the-lock': {
    term: 'The lock',
    plain: 'An on-chain safe that holds both sides of the deal until the end date. Nobody can redirect it.',
  },
  'your-wallet': {
    term: 'Your wallet',
    plain: 'Where your money lives. PAYtience never holds your keys.',
  },
};

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  emoji: string;
  cards: { title: string; body: string; mood?: 'happy' | 'thinking' | 'worried' | 'excited' | 'determined' }[];
};

export const LESSONS: Lesson[] = [
  {
    id: 'how-it-works',
    title: 'How PAYtience works',
    minutes: 1,
    emoji: '🌱',
    cards: [
      { title: 'Name a price', body: 'Pick something and a price you’d be happy to trade at, like “I’d sell my SOL at $128”.', mood: 'happy' },
      { title: 'Get paid today', body: 'A partner pays you right away for that promise. The money lands in your wallet in seconds.', mood: 'excited' },
      { title: 'Wait patiently', body: 'Your deal grows until the end date you chose. You don’t need to do anything.', mood: 'thinking' },
      { title: 'Two endings', body: 'On the end date, you either get back what you locked, or the trade happens at your price. The pay is yours either way.', mood: 'determined' },
    ],
  },
  {
    id: 'sell-high',
    title: 'Sell High in 60 seconds',
    minutes: 1,
    emoji: '⬆️',
    cards: [
      { title: 'You own 1 SOL', body: 'Today it’s $118. You’d happily sell it at $128.', mood: 'happy' },
      { title: 'Lock it, get paid', body: 'Lock 1 SOL with a $128 target for about a month. You get about $4.19 today.', mood: 'excited' },
      { title: 'If SOL stays under $128', body: 'Your 1 SOL comes back. You keep the $4.19. Do it again!', mood: 'happy' },
      { title: 'If SOL hits $128 or more', body: 'You sell at $128 and keep the $4.19: $132.19 in total. If SOL shot to $150, you miss the extra rise.', mood: 'thinking' },
    ],
  },
  {
    id: 'buy-low',
    title: 'Buy Low in 60 seconds',
    minutes: 1,
    emoji: '⬇️',
    cards: [
      { title: 'You have $100', body: 'SOL is $118 today. You’d happily buy some at $109.', mood: 'happy' },
      { title: 'Set it aside, get paid', body: 'Set aside $100 with a $109 target. You get about $3.27 today.', mood: 'excited' },
      { title: 'If SOL stays above $109', body: 'Your $100 comes back. You keep the $3.27.', mood: 'happy' },
      { title: 'If SOL drops to $109 or less', body: 'You buy 0.9174 SOL at $109 and keep the $3.27. If SOL fell to $95, it’s worth less than you paid.', mood: 'thinking' },
    ],
  },
  {
    id: 'what-can-go-wrong',
    title: 'What can go wrong?',
    minutes: 2,
    emoji: '⛅',
    cards: [
      { title: 'You might have to trade', body: 'That’s the deal. Only pick a price you’re truly happy to sell or buy at.', mood: 'determined' },
      { title: 'Sell High caps your upside', body: 'If the price rockets past your target, you still sell at your target.', mood: 'thinking' },
      { title: 'Buy Low can buy a falling price', body: 'If the price drops far below your target, you still buy at your target.', mood: 'worried' },
      { title: 'Locked until the end date', body: 'There’s no early exit. That’s what lets partners pay you upfront.', mood: 'thinking' },
      { title: 'Tech risk is real', body: 'Smart contracts can have bugs. Only lock what you’re comfortable with.', mood: 'worried' },
    ],
  },
  {
    id: 'end-date',
    title: 'What happens on the end date?',
    minutes: 1,
    emoji: '📅',
    cards: [
      { title: 'The final price is published', body: 'One official price decides every deal on that asset and date.', mood: 'thinking' },
      { title: '30-minute safety check', body: 'We wait 30 minutes so a wrong price can be fixed before money moves.', mood: 'determined' },
      { title: 'Money arrives automatically', body: 'You get back what you locked, or the result of the trade. No buttons to press.', mood: 'excited' },
    ],
  },
];

export const FAQ: { q: string; a: string }[] = [
  { q: 'How do I get paid while I wait?', a: 'Pick an asset, a price you’d happily sell or buy at, and a date. A partner pays you right away for that promise.' },
  { q: 'When do I get the money?', a: 'Right away, the moment your deal starts. It lands in your wallet as digital dollars (USDC).' },
  { q: 'Do I keep the pay if the trade happens?', a: 'Yes. You keep it in every outcome.' },
  { q: 'What if the price lands exactly on my target?', a: 'That counts as reaching it, so the trade happens.' },
  { q: 'Can I lose money?', a: 'Yes. With Sell High you miss gains above your target. With Buy Low you may buy something that keeps falling. What you lock can also fall in value. The upfront pay softens this but doesn’t prevent it.' },
  { q: 'Can I cancel early?', a: 'No. Your deal is locked until the end date. That’s what lets partners pay you upfront.' },
  { q: 'Why do some offers pay more?', a: 'Closer targets, later dates and bumpier assets pay more, because the trade is more likely to happen.' },
  { q: 'Who pays me, and is it safe?', a: 'Professional partners compete to pay you. Both sides are locked in an on-chain safe on day one, so your payout already exists. Smart contracts can still have bugs.' },
  { q: 'Are there fees?', a: 'PAYtience’s fee is 0% right now, and our partner pays the network fees.' },
  { q: 'Is this real money?', a: 'Not yet. PAYtience is in practice mode on Solana’s test network. Practice money has no value.' },
];

export const QUIZ: { q: string; options: string[]; answer: number; why: string }[] = [
  {
    q: 'You start a Sell High deal and get $4.19. The price never reaches your target. What happens?',
    options: ['You lose the $4.19', 'You get your asset back and keep the $4.19', 'Your asset is sold anyway'],
    answer: 1,
    why: 'The pay is yours in every outcome, and your asset comes back.',
  },
  {
    q: 'The final price lands exactly on your target. Does the trade happen?',
    options: ['Yes, equal counts', 'No, it must go past it', 'Only for Buy Low'],
    answer: 0,
    why: 'Landing exactly on the target counts as reaching it.',
  },
  {
    q: 'Can you take your money out before the end date?',
    options: ['Yes, any time', 'Only in the first hour', 'No, it’s locked until the end date'],
    answer: 2,
    why: 'Locking until the end date is what lets partners pay you upfront.',
  },
];

export const TIPS = [
  'Closer targets pay more, because the trade is more likely.',
  'Always pick a price you’d be genuinely happy to trade at.',
  'Look at the dollars first. The yearly rate can look huge on short deals.',
  'Your upfront pay is yours in every outcome.',
  'Deals are locked until the end date. Patience pays!',
  'Landing exactly on your target counts as a trade.',
];
