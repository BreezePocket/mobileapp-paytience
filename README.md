# PAYtience mobile

**Get paid while you wait.** A React Native (Expo SDK 57) app for PAYtience, designed for people who have never used crypto. Sprout, the mascot from the hackathon promo video, guides every step.

It runs on **live data**: prices and offers come from the PAYtience backend (`https://api.paytience.app`), and wallets, balances and deals live on **Solana devnet** (practice money, no real value).

## Run it

```bash
npm install
npx expo start
```

- **Phone:** open Expo Go (signed in to the same Expo account) and pick the project, or scan the QR code.
- **Browser:** press `w`, or open http://localhost:8081.

## Screens

| Area | Route | What it does |
|---|---|---|
| Onboarding | `/onboarding` | Sprout says hi, then 3 cards (name a price, get paid today, two endings) and "which sounds like you?" |
| Home | `/(tabs)` | Coin Jar (upfront pay earned, locked now, next end date), Cloud Garden (one pot per deal, grows with time), getting-started checklist, daily check-in, tip |
| Earn | `/(tabs)/earn` | Sell High / Buy Low toggle, categories, search, "On $100 for ~1 month, get $X–$Y today" |
| Asset | `/asset/[symbol]` | Price, what each choice means, worked example. Preview and Coming soon states have "Notify me" |
| Deal wizard | `/deal/new` | End date → target price → amount, with Sprout explaining each step |
| Review | `/deal/review` | Offer with a 30 s refresh ring, both endings side by side, lock notice, risks, slide to approve, 3-step progress |
| Success | `/deal/success` | Coin shower: "Deal on!" |
| My Deals | `/(tabs)/deals`, `/deal/[id]` | Active and Ended lists; detail with status, "if it ended now" hint, timeline and receipt |
| Rewards | `/(tabs)/rewards`, `/leaderboard` | Level, streak, season, badges, referral, points leaderboard (points have no cash value) |
| Me | `/(tabs)/me` | Wallet, practice balances, settings, risk and terms |
| Learn | `/learn`, `/learn/[lesson]`, `/learn/glossary`, `/learn/faq`, `/learn/quiz` | Short lessons, jargon buster, FAQ, quiz |
| Onboarding extras | `/sign-in`, `/primer`, `/practice` | Create the practice wallet, 4-card risk primer before the first deal, free practice money |
| Autopilot | `/autopilot` | Preview only |
| Dev menu | `/dev` (tap the version on Me 7 times) | Connection status, refresh, reset, Sprout gallery |

Every piece of jargon is tappable ("What's this?"), and the main flow never uses trader words.

## Code map

- `src/app/`: routes (Expo Router)
- `src/components/Sprout.tsx`: the mascot as SVG, with 8 moods, 5 poses and props
- `src/components/ui.tsx`, `widgets.tsx`, `Art.tsx`, `Icon.tsx`: sticker-style UI kit
- `src/live/`: backend client, Solana program client, device wallet, board cache
- `src/store/app-store.tsx`: app state, polling, and the offer → sign → confirm flow
- `src/domain/`: board-to-screen conversions, deal lifecycle, formatting
- `src/data/`: asset catalog, glossary, lessons, FAQ, quiz
- `docs/product-brief.md`: the full product spec, including the exact backend wire types
- `docs/mascot-reference/`: frames from the promo video

## Where the data comes from

| Data | Source |
|---|---|
| Assets, prices, Live / Preview state | `GET /health` every 15 s (`src/store/app-store.tsx`, `src/data/assets.ts` holds names and icons only) |
| End dates, targets, pay estimates | `GET /board` per asset (`src/live/boards.ts`) |
| Firm offer on the review screen | `POST /rfq`, refreshed with a new nonce before it expires |
| Opening a deal | The app builds `open_position` / `open_asset_position`, signs it on the device, `POST /sign` has the partner co-sign and broadcast, then the app waits for confirmation (`src/live/chain.ts`) |
| Deals and balances | Read from Solana devnet every 20 s |
| Practice money | `POST /faucet` |
| Collect (fallback) | The app sends the program's permissionless `settle` itself |

**Wallet:** a Solana keypair is made on the device and kept in secure storage (`src/live/wallet.ts`). It is a devnet practice wallet; removing it from the device loses access to it.

**Still local to the device** (no backend exists for them yet): rewards points, streak and badges, "Notify me", and the notes a deal's on-chain account does not store (when it opened, the partner's name). The leaderboard lists only you, and Autopilot is a static preview.

**Config:** set `EXPO_PUBLIC_API_URL` or `EXPO_PUBLIC_SOLANA_RPC` to point somewhere else (for example a local backend on `http://<your-mac-ip>:8080`).
