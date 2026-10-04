import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Sprout } from '@/components/Sprout';
import { Button, Card, Gap, Header, Row, Screen, T, tap } from '@/components/ui';
import { AssetIcon, CountdownRing, InfoDot, OutcomeCards, SlideToApprove, Term } from '@/components/widgets';
import { getAsset } from '@/data/assets';
import { fmtDay, fmtPct, fmtPrice, fmtTime, fmtUnits, fmtUsd } from '@/domain/format';
import { dealMath, Goal, targetsOf } from '@/domain/pricing';
import { friendly } from '@/live/api';
import { useBoard } from '@/live/boards';
import { Offer, SubmitStep, useStore } from '@/store/app-store';
import { colors, MAX_WIDTH, radius, space, sticker } from '@/theme';

/** What the screen shows: a firm offer once signed in, the board's estimate before that. */
type OfferView = { pay: number; pct: number; apr: number; validUntil: number; offers: number | null; partner: string | null; firm: boolean };
type Phase = 'quoting' | 'quoted' | 'declined' | 'approving' | 'error';
const STEPS = ['Signing on this device…', 'Our partner is confirming…', 'Locking your deal on Solana…'];
const STEP_INDEX: Record<SubmitStep, number> = { signing: 0, cosigning: 1, confirming: 2 };
const OFFER_MS = 30_000;

export default function Review() {
  const p = useLocalSearchParams<{ symbol: string; goal: string; end: string; target: string; amount: string }>();
  const asset = getAsset(p.symbol);
  const goal: Goal = p.goal === 'sell' ? 'sell' : 'buy';
  const endTs = Number(p.end);
  const targetPrice = Number(p.target);
  const amount = Number(p.amount);
  const { state, actions } = useStore();
  const { board, loading: boardLoading } = useBoard(asset?.symbol, goal);

  const [phase, setPhase] = useState<Phase>('quoting');
  const [live, setLive] = useState<Offer | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [left, setLeft] = useState(OFFER_MS);
  const [step, setStep] = useState(0);
  const [showMore, setShowMore] = useState<'moves' | 'priced' | null>(null);
  const seq = useRef(0);
  const [attempt, setAttempt] = useState(0);

  // the board's estimate for this exact target, shown until a firm offer arrives
  const t = targetsOf(goal, board, endTs).find((x) => x.target === targetPrice);
  const math = asset && t ? dealMath(goal, asset, t, amount) : undefined;

  const symbol = asset?.symbol;
  const signedIn = !!state.wallet;
  /** Ask the backend for a firm offer. Each call uses a new nonce; a stale answer is dropped. */
  const requestOffer = useEffectEvent(async () => {
    if (!symbol || !signedIn || !(amount > 0) || !isFinite(endTs)) return;
    const n = ++seq.current;
    const res = await actions.requestOffer({ symbol, goal, target: targetPrice, endsAt: endTs, amount });
    if (n !== seq.current) return; // a newer request, or the user already approved
    if (!res.ok) {
      setLive(null);
      setProblem(friendly(new Error(res.reason)));
      setPhase('declined');
      return;
    }
    const was = live ? Number(live.quote.yield_amount) / 1e6 : null;
    const now = Number(res.offer.quote.yield_amount) / 1e6;
    if (was != null && Math.abs(was - now) >= 0.01) setFlash(`Fresh offer: ${fmtUsd(now)} (was ${fmtUsd(was)})`);
    setLive(res.offer);
    setProblem(null);
    setPhase('quoted');
  });

  // first offer, and again whenever the deal or the wallet changes
  useEffect(() => {
    const id = setTimeout(() => requestOffer(), 0);
    return () => clearTimeout(id);
  }, [symbol, signedIn, goal, targetPrice, endTs, amount, attempt]);

  // offers last 30 s; fetch a fresh one when the ring runs out
  const validUntil = live?.quote.valid_until;
  useEffect(() => {
    if (phase !== 'quoted' || validUntil == null) return;
    let asked = false;
    const id = setInterval(() => {
      const ms = Math.min(OFFER_MS, validUntil - Date.now());
      setLeft(ms);
      if (ms <= 1500 && !asked) {
        asked = true;
        requestOffer();
      }
    }, 500);
    return () => clearInterval(id);
  }, [phase, validUntil]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(id);
  }, [flash]);

  if (!asset || !isFinite(endTs) || !(targetPrice > 0)) {
    return (
      <Screen header={<Header />}>
        <Gap h={40} />
        <Card>
          <T v="body">This deal link looks incomplete. Please start again from Earn.</T>
          <Gap />
          <Button title="Back to Earn" onPress={() => router.replace('/(tabs)/earn')} />
        </Card>
      </Screen>
    );
  }
  if (!t || !math) {
    return (
      <Screen header={<Header title="Review your deal" />}>
        <Gap h={40} />
        <Card>
          {boardLoading ? (
            <Row>
              <ActivityIndicator color={colors.blue} />
              <T v="small">Loading live offers…</T>
            </Row>
          ) : (
            <>
              <T v="body">That target isn’t on offer any more. Prices moved, so the choices changed.</T>
              <Gap />
              <Button title="Pick a new target" onPress={() => router.back()} />
            </>
          )}
        </Card>
      </Screen>
    );
  }

  const offer: OfferView | null = live
    ? {
        pay: Number(live.quote.yield_amount) / 1e6,
        pct: live.quote.yield_pct,
        apr: live.quote.apr_pct,
        validUntil: live.quote.valid_until,
        offers: live.quote.quotes_received ?? null,
        partner: live.quote.mm_name ?? null,
        firm: true,
      }
    : !signedIn
      ? { pay: math.pay, pct: t.pct, apr: t.apr, validUntil: 0, offers: null, partner: null, firm: false }
      : null;

  const lockLabel = goal === 'sell' ? `${fmtUnits(amount, asset.symbol)} ${asset.ticker}` : fmtUsd(amount);
  const ifSwapLabel = goal === 'sell' ? fmtUsd(math.ifSwapGet) : `${fmtUnits(math.ifSwapGet, asset.symbol)} ${asset.ticker}`;
  const balance = goal === 'sell' ? state.balances.tokens[asset.symbol] ?? 0 : state.balances.usdc;
  const here = `/deal/review?symbol=${asset.symbol}&goal=${goal}&end=${endTs}&target=${targetPrice}&amount=${amount}`;

  const retry = () => {
    setProblem(null);
    setPhase('quoting');
    setAttempt((n) => n + 1);
  };

  const gate: { label: string; go: () => void } | null = !state.wallet
    ? { label: 'Create a free wallet to continue', go: () => router.push({ pathname: '/sign-in', params: { next: here } }) }
    : state.balances.loaded && amount > balance + 1e-9
      ? { label: 'Get practice money to continue', go: () => router.push('/practice') }
      : !state.primerDone
        ? { label: 'Quick safety check first (30 s)', go: () => router.push({ pathname: '/primer', params: { next: here } }) }
        : phase === 'declined' || phase === 'error'
          ? { label: 'Get a fresh offer', go: retry }
          : null;

  const approve = async () => {
    if (!live || phase !== 'quoted') return;
    seq.current += 1; // ignore any offer still on its way
    setPhase('approving');
    setStep(0);
    try {
      const id = await actions.submitDeal(live, (st) => setStep(STEP_INDEX[st]));
      router.replace({ pathname: '/deal/success', params: { id } });
    } catch (e) {
      setLive(null);
      setProblem(friendly(e));
      setPhase('error');
    }
  };

  return (
    <Screen
      header={<Header title="Review your deal" />}
      footer={
        gate ? (
          <Button title={gate.label} onPress={gate.go} />
        ) : (
          <SlideToApprove disabled={phase !== 'quoted'} label="Slide to approve" onDone={approve} />
        )
      }>
      <Card style={{ marginTop: space.md, alignItems: 'center' }}>
        <Row gap={space.sm}>
          <AssetIcon asset={asset} size={30} />
          <T v="bodyBold">
            {goal === 'sell' ? 'Sell High' : 'Buy Low'} · {asset.name}
          </T>
        </Row>
        <Gap h={space.md} />
        <T v="label">{offer && !offer.firm ? 'Paid to you now (about)' : 'Paid to you now'}</T>
        {problem ? (
          <View style={{ paddingVertical: space.sm }}>
            <T v="bodyBold" center>
              {problem}
            </T>
          </View>
        ) : phase === 'quoting' || !offer ? (
          <View style={{ height: 46, justifyContent: 'center' }}>
            <Row>
              <ActivityIndicator color={colors.blue} />
              <T v="small">Asking our partners for your best offer…</T>
            </Row>
          </View>
        ) : (
          <T v="money" color={colors.earn}>
            {fmtUsd(offer.pay)}
          </T>
        )}
        {offer && !problem ? (
          <Row gap={6}>
            <T v="small">{fmtPct(offer.pct)} of what you lock</T>
            <InfoDot id="pct-of-lock" size={16} />
          </Row>
        ) : null}
        {flash ? (
          <View style={styles.flash}>
            <T v="tiny" color={colors.navy}>
              {flash}
            </T>
          </View>
        ) : null}
        {offer && !offer.firm ? (
          <T v="tiny" center style={{ marginTop: space.sm }}>
            A live estimate. You’ll get a firm offer once your wallet is set up.
          </T>
        ) : null}
        {phase === 'quoted' && offer ? (
          <Row gap={space.sm} style={{ marginTop: space.md }}>
            <CountdownRing msLeft={left} size={46} />
            <T v="tiny" style={{ flex: 1 }}>
              I’ll keep this <Term id="offer">offer</Term> fresh for you. It refreshes automatically, no rush.
            </T>
          </Row>
        ) : null}
      </Card>

      <Gap h={space.lg} />
      <T v="h3">Here’s the whole deal. Two endings:</T>
      <Gap h={space.sm} />
      <OutcomeCards goal={goal} asset={asset} target={targetPrice} lockLabel={lockLabel} ifSwapLabel={ifSwapLabel} pay={offer?.pay ?? math.pay} endsAt={endTs} />

      <Gap h={space.lg} />
      <Card>
        <Line label="You lock" value={lockLabel} term="what-you-lock" />
        <Line label="Target price" value={fmtPrice(targetPrice)} term="target-price" />
        <Line label="Today’s price" value={fmtPrice(asset.price)} />
        <Line label="Ends" value={`${fmtDay(endTs)} · ${fmtTime(endTs)}`} term="end-date" />
        <Line label="Yearly rate" value={offer ? fmtPct(offer.apr, 1) : '—'} term="yearly-rate" muted />
        <Line label="PAYtience fee" value="0%" />
        <Line label="Network fees" value="Paid by partner" term="network-fee" />
        <Line label="Paid by" value={offer?.partner ? (offer.offers && offer.offers > 1 ? `${offer.partner} · best of ${offer.offers}` : offer.partner) : 'Best partner offer'} term="partner" />
      </Card>

      <Gap />
      <Card color={colors.warnSoft} flat>
        <Row gap={space.sm} center={false}>
          <Icon name="lock" size={20} />
          <T v="small" color={colors.ink} style={{ flex: 1 }}>
            <T v="smallBold">Locked until {fmtDay(endTs)}.</T> You can’t withdraw early. That’s what lets partners pay you upfront.
          </T>
        </Row>
      </Card>

      <Gap />
      <Expander title="What if the price moves a lot?" open={showMore === 'moves'} onToggle={() => setShowMore(showMore === 'moves' ? null : 'moves')}>
        {goal === 'sell' ? (
          <T v="small" color={colors.ink}>
            If {asset.name} shoots far past {fmtPrice(targetPrice)}, you still sell at {fmtPrice(targetPrice)} and miss the extra rise. If it drops a lot, you keep your {asset.ticker}, now worth
            less. The {fmtUsd(offer?.pay ?? math.pay)} softens a drop but doesn’t stop it.
          </T>
        ) : (
          <T v="small" color={colors.ink}>
            If {asset.name} falls far below {fmtPrice(targetPrice)}, you still buy at {fmtPrice(targetPrice)}, so what you bought is worth less than you paid. If it rises a lot, your{' '}
            {fmtUsd(amount)} comes back and you miss the ride up.
          </T>
        )}
      </Expander>
      <Expander title="How is this priced?" open={showMore === 'priced'} onToggle={() => setShowMore(showMore === 'priced' ? null : 'priced')}>
        <T v="small" color={colors.ink}>
          Professional partners compete to pay you. Pay comes from live {asset.category === 'crypto' ? 'crypto' : asset.category === 'preipo' ? 'model' : 'US stock'} options prices.
          {asset.badge === 'Model estimate' ? ' There is no real options market for private companies, so this is a model estimate.' : ''} Rough chance the trade happens:{' '}
          <T v="smallBold">{Math.round(t.chance * 100)}%</T>. For the curious: {goal === 'sell' ? 'this is a covered call.' : 'this is a cash-secured put.'}
        </T>
      </Expander>

      <Gap />
      <T v="tiny" center>
        Upfront pay isn’t guaranteed and prices can move against you. Not financial advice. Only lock what you’re comfortable trading at your price.
      </T>

      <Modal visible={phase === 'approving'} transparent animationType="slide">
        <View style={styles.scrim} />
        <View style={[styles.sheet, sticker(0)]}>
          <Row gap={space.md} style={{ alignItems: 'flex-end' }}>
            <Sprout size={80} mood={step === 2 ? 'excited' : 'determined'} pose={step === 2 ? 'cheer' : 'hold'} prop={step === 2 ? 'coin' : 'none'} />
            <View style={{ flex: 1, paddingBottom: space.md }}>
              <T v="h2">Setting up your deal</T>
              <T v="small">This takes a few seconds.</T>
            </View>
          </Row>
          <Gap />
          {STEPS.map((s, i) => (
            <Row key={s} gap={space.md} style={{ paddingVertical: space.sm }}>
              <View style={[styles.stepDot, i < step && { backgroundColor: colors.sprout }, i === step && { backgroundColor: colors.blueSoft }]}>
                {i < step ? <Icon name="check" size={14} color="#fff" /> : i === step ? <ActivityIndicator size="small" color={colors.blue} /> : <T v="tiny">{i + 1}</T>}
              </View>
              <T v={i === step ? 'bodyBold' : 'body'} color={i > step ? colors.faint : colors.ink}>
                {s}
              </T>
            </Row>
          ))}
          <Gap />
          <T v="tiny" center>
            {goal === 'sell' ? `Locking your ${lockLabel} and sending your ${fmtUsd(offer?.pay ?? 0)}…` : `Setting aside ${lockLabel} and sending your ${fmtUsd(offer?.pay ?? 0)}…`}
          </T>
        </View>
      </Modal>
    </Screen>
  );
}

function Line({ label, value, term, muted }: { label: string; value: string; term?: Parameters<typeof InfoDot>[0]['id']; muted?: boolean }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
      <Row gap={6}>
        <T v="small">{label}</T>
        {term ? <InfoDot id={term} size={15} /> : null}
      </Row>
      <T v={muted ? 'small' : 'smallBold'} color={muted ? colors.muted : colors.ink}>
        {value}
      </T>
    </Row>
  );
}

function Expander({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.expander}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          tap();
          onToggle();
        }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.md }}>
        <T v="bodyBold">{title}</T>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron" size={18} />
        </View>
      </Pressable>
      {open ? <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flash: { marginTop: space.sm, backgroundColor: colors.coin, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4, borderWidth: 1.5, borderColor: colors.navy },
  expander: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: 2, borderColor: colors.navy, marginBottom: space.sm },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,35,80,0.35)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignSelf: 'center',
    maxWidth: MAX_WIDTH,
    marginHorizontal: 'auto',
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    paddingBottom: space.xxl + 12,
  },
  stepDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
});
