import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Sprout } from '@/components/Sprout';
import { Badge, Button, Card, Gap, Header, ProgressBar, Row, Screen, SproutSays, T, tap } from '@/components/ui';
import { AssetIcon, CoinShower } from '@/components/widgets';
import { Asset, getAsset } from '@/data/assets';
import { fmtUnits, fmtUsd } from '@/domain/format';
import { friendly } from '@/live/api';
import { useNow, useStore } from '@/store/app-store';
import { colors, space } from '@/theme';

const DOLLARS: Asset = {
  symbol: 'USDC',
  name: 'Digital dollars',
  ticker: 'USDC',
  blurb: 'A digital version of the US dollar.',
  category: 'crypto',
  price: 1,
  vol: 0,
  state: 'live',
  expiryUtcHour: 8,
  buyLow: false,
  color: '#2775CA',
  glyph: '$',
  decimals: 6,
  fresh: true,
  mint: null,
  payoutDecimals: 6,
};

/** What one top-up is worth; the backend decides the real amount (GET /faucet). */
const FAUCET_USD = 1000;

const CHOICES: { token: string; title: string; subtitle: string }[] = [
  { token: 'USDC', title: `${fmtUsd(FAUCET_USD).replace('.00', '')} digital dollars`, subtitle: 'For Buy Low deals. Comes with a little test SOL.' },
  { token: 'TSLAon', title: `${fmtUsd(FAUCET_USD).replace('.00', '')} of Tesla`, subtitle: 'A stock token for Sell High deals' },
  { token: 'WBTC', title: `${fmtUsd(FAUCET_USD).replace('.00', '')} of Bitcoin`, subtitle: 'For Sell High deals' },
];

/** The real top-up takes up to ~30 s; the bar creeps towards 90% while we wait. */
const EXPECTED = 15_000;

type Phase = { kind: 'pick'; error?: string } | { kind: 'printing'; token: string } | { kind: 'done'; token: string; amount: number; sol: boolean };

function assetFor(token: string): Asset | undefined {
  return token === 'USDC' ? DOLLARS : getAsset(token);
}

export default function Practice() {
  const { state, actions } = useStore();
  useNow(30_000); // re-render so the "More in N min" countdown stays fresh
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const start = (token: string) => {
    if (!state.wallet) {
      router.push('/sign-in');
      return;
    }
    setPhase({ kind: 'printing', token });
    setProgress(0);
    const TICK = 200;
    let ticks = 0;
    timer.current = setInterval(() => {
      ticks += 1;
      setProgress(0.9 * (1 - Math.exp((-ticks * TICK) / EXPECTED)));
    }, TICK);
    const stop = () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
    actions
      .claimPracticeMoney(token)
      .then((res) => {
        stop();
        tap('success');
        setPhase({ kind: 'done', token, amount: res.amount ?? res.usdc_amount, sol: !!res.sol_airdrop_signature });
      })
      .catch((e: unknown) => {
        stop();
        setPhase({ kind: 'pick', error: friendly(e) });
      });
  };

  if (phase.kind === 'printing') {
    const a = assetFor(phase.token);
    return (
      <Screen header={<Header title="Practice money" close />} contentStyle={{ alignItems: 'center', paddingTop: space.xxl }}>
        <Sprout size={150} mood="determined" pose="hold" prop="coin" />
        <Gap h={space.lg} />
        <T v="h2" center>
          Printing your practice dollars…
        </T>
        <Gap h={space.sm} />
        <T v="small" center>
          {a?.name ?? phase.token} worth {fmtUsd(FAUCET_USD)}, coming right up.
        </T>
        <Gap h={space.lg} />
        <View style={{ alignSelf: 'stretch' }}>
          <ProgressBar value={progress} height={16} />
        </View>
      </Screen>
    );
  }

  if (phase.kind === 'done') {
    const a = assetFor(phase.token);
    const isDollars = phase.token === 'USDC';
    return (
      <View style={{ flex: 1 }}>
        <Screen
          header={<Header title="Practice money" close />}
          contentStyle={{ alignItems: 'center', paddingTop: space.xl }}
          footer={
            <View style={{ gap: space.sm }}>
              <Button title="Start a deal" kind="sun" onPress={() => router.replace('/(tabs)/earn')} />
              <Button title="Get more practice money" kind="ghost" onPress={() => setPhase({ kind: 'pick' })} />
            </View>
          }>
          <Sprout size={170} mood="excited" pose="cheer" prop="coin" />
          <Gap h={space.lg} />
          <T v="h1" center>
            Your practice money is in!
          </T>
          <Gap h={space.md} />
          <Card style={{ alignSelf: 'stretch' }}>
            <Row gap={space.md}>
              <AssetIcon asset={a} size={48} />
              <View style={{ flex: 1 }}>
                <T v="h3">{isDollars ? fmtUsd(phase.amount) : `${fmtUnits(phase.amount, phase.token)} ${a?.ticker ?? phase.token}`}</T>
                <T v="small">{isDollars ? 'Digital dollars (USDC)' : `≈${fmtUsd(phase.amount * (a?.price || 0))} of ${a?.name ?? phase.token}`}</T>
              </View>
              <Badge label="Practice" color={colors.practice} />
            </Row>
          </Card>
          <Gap h={space.md} />
          <T v="small" center>
            {phase.sol ? 'A little test SOL came with it. ' : ''}Remember: it’s play money with no real value. Perfect for trying things out.
          </T>
        </Screen>
        <CoinShower />
      </View>
    );
  }

  return (
    <Screen header={<Header title="Practice money" close />}>
      <SproutSays mood="happy" pose="wave">
        <T v="bodyBold">Free play money to learn with.</T>
        <T v="small">PAYtience is in practice mode. This money has no real value, so you can try deals without any worry.</T>
      </SproutSays>
      <Gap h={space.lg} />
      {phase.error ? (
        <Card color={colors.warnSoft} flat style={{ marginBottom: space.md }}>
          <T v="smallBold">{phase.error}</T>
        </Card>
      ) : null}
      {CHOICES.filter((c) => c.token === 'USDC' || getAsset(c.token)?.state === 'live').map((c) => {
        const a = assetFor(c.token);
        const wait = actions.faucetCooldown(c.token);
        const mins = Math.ceil(wait / 60_000);
        const held = c.token === 'USDC' ? state.balances.usdc : state.balances.tokens[c.token] ?? 0;
        return (
          <Card key={c.token} style={{ marginBottom: space.md }}>
            <Row gap={space.md}>
              <AssetIcon asset={a} size={48} />
              <View style={{ flex: 1 }}>
                <T v="bodyBold">{c.title}</T>
                <T v="small">{c.subtitle}</T>
                {held > 0 ? (
                  <T v="tiny">You have {c.token === 'USDC' ? fmtUsd(held) : `${fmtUnits(held, c.token)} ${a?.ticker ?? c.token}`}</T>
                ) : null}
              </View>
            </Row>
            <Gap h={space.md} />
            {!state.wallet ? (
              <Button title="Sign in to get it" small kind="secondary" icon="wallet" onPress={() => router.push('/sign-in')} />
            ) : wait > 0 ? (
              <Button title={`More in ${mins} min`} small kind="secondary" icon="clock" disabled onPress={() => {}} />
            ) : (
              <Button title="Get it" small icon="gift" onPress={() => start(c.token)} />
            )}
          </Card>
        );
      })}
      {state.wallet ? (
        <T v="tiny" center>
          You can top up each one once an hour.
        </T>
      ) : null}
    </Screen>
  );
}
