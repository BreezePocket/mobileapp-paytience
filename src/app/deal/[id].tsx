import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Pot } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { Sprout, SproutMood, SproutProp } from '@/components/Sprout';
import { Badge, Button, Card, Divider, Gap, Header, Row, Screen, SectionTitle, T } from '@/components/ui';
import { CoinShower, CountdownRing, InfoDot, OutcomeCards, StatusChip, Term } from '@/components/widgets';
import { Asset, getAsset } from '@/data/assets';
import { Deal, dealStatus, DealStatus, growthStage, isEnded, lockedLabel, progress, SAFETY_CHECK_MS, swapHappens } from '@/domain/deals';
import { fmtDayTime, fmtPct, fmtPrice, fmtRelative, fmtSignedPct, fmtUnits, fmtUsd, shortAddress } from '@/domain/format';
import { useNow, useStore } from '@/store/app-store';
import { colors, radius, space } from '@/theme';

const SIX_HOURS = 6 * 3_600_000;

function nameOf(a: Asset | undefined, symbol: string): string {
  if (!a) return symbol;
  return a.ticker === a.symbol ? a.name : a.ticker;
}

function tickerOf(a: Asset | undefined, symbol: string): string {
  if (!a) return symbol;
  return a.ticker.length > 5 ? a.name : a.ticker;
}

const MOOD: Record<DealStatus, { mood: SproutMood; prop: SproutProp; line: string }> = {
  active: { mood: 'happy', prop: 'can', line: 'Your deal is growing. No action needed.' },
  awaiting_price: { mood: 'sleepy', prop: 'zzz', line: 'Deal’s done. Just waiting for the official price.' },
  safety_check: { mood: 'thinking', prop: 'none', line: 'Double-checking the final price for you.' },
  ready: { mood: 'excited', prop: 'coin', line: 'All checked. Your money is on its way.' },
  kept: { mood: 'laugh', prop: 'sparkles', line: 'All done. Plant again?' },
  sold: { mood: 'excited', prop: 'coin', line: 'All done. Plant again?' },
  bought: { mood: 'excited', prop: 'coin', line: 'All done. Plant again?' },
  returned: { mood: 'thinking', prop: 'none', line: 'This one closed early. Your pay is still yours.' },
};

/** The "looks like" / final result line, e.g. "Sold at $128" or "Bought 0.9174 SOL". */
function resultLine(d: Deal, a: Asset | undefined): string {
  if (d.finalPrice == null) return '';
  const tick = tickerOf(a, d.symbol);
  if (!swapHappens(d.goal, d.finalPrice, d.target)) return d.goal === 'sell' ? `Kept your ${lockedLabel(d)}` : `Your ${lockedLabel(d)} comes back`;
  return d.goal === 'sell' ? `Sold at ${fmtPrice(d.target)}` : `Bought ${fmtUnits(d.ifSwapGet, d.symbol)} ${tick}`;
}

function statusCopy(d: Deal, s: DealStatus, a: Asset | undefined, now: number): { body: string; total?: string; whatIf?: string } {
  const name = nameOf(a, d.symbol);
  const tick = tickerOf(a, d.symbol);
  const locked = lockedLabel(d);
  const final = d.finalPrice ?? 0;
  switch (s) {
    case 'active':
      return { body: d.goal === 'sell' ? `You locked ${locked}. Your deal ends ${fmtRelative(d.endsAt, now)}.` : `You set aside ${locked}. Your deal ends ${fmtRelative(d.endsAt, now)}.` };
    case 'awaiting_price': {
      const body = `Your deal ended ${fmtDayTime(d.endsAt)}. We’re waiting for the official final price; this usually takes minutes, sometimes hours.`;
      return now - d.endsAt > SIX_HOURS ? { body: `${body} Taking longer than usual. Your funds are safe in the lock.` } : { body };
    }
    case 'safety_check':
      return { body: `Final price ${fmtPrice(final)}. Looks like: ${resultLine(d, a)}. We double-check for 30 minutes before paying out.` };
    case 'ready': {
      const swapped = swapHappens(d.goal, final, d.target);
      if (d.goal === 'sell') return { body: swapped ? `Your ${fmtUsd(d.ifSwapGet)} is on its way.` : `Your ${locked} is on its way back.` };
      return { body: swapped ? `Your ${fmtUnits(d.ifSwapGet, d.symbol)} ${tick} is on its way.` : `Your ${locked} is on its way back.` };
    }
    case 'kept':
      if (d.goal === 'sell') {
        return {
          body: `${name} finished at ${fmtPrice(final)}, under your ${fmtPrice(d.target)} target. Your ${locked} is back. You earned ${fmtUsd(d.pay)}.`,
          total: `${locked} (worth ${fmtUsd(d.lockUnits * final)} at the final price) + ${fmtUsd(d.pay)}`,
          whatIf: final < d.priceAtOpen ? `The pay softened the drop but didn’t stop it: ${name} was ${fmtPrice(d.priceAtOpen)} when you started.` : undefined,
        };
      }
      return {
        body: `${name} finished at ${fmtPrice(final)}, above your ${fmtPrice(d.target)} target. Your ${locked} is back. You earned ${fmtUsd(d.pay)}.`,
        total: `${fmtUsd(d.lockUnits + d.pay)}`,
      };
    case 'sold': {
      const worth = d.lockUnits * final;
      const gaveUp = worth - d.ifSwapGet;
      return {
        body: `${name} finished at ${fmtPrice(final)}, at or above your ${fmtPrice(d.target)} target. You sold ${locked} for ${fmtUsd(d.ifSwapGet)} and earned ${fmtUsd(d.pay)}.`,
        total: fmtUsd(d.ifSwapGet + d.pay),
        whatIf:
          gaveUp > 0.005
            ? `${locked} would be worth ${fmtUsd(worth)} at the final price, so you gave up ${fmtUsd(gaveUp)} of the rise.`
            : `${locked} is worth ${fmtUsd(worth)} at the final price.`,
      };
    }
    case 'bought': {
      const worth = d.ifSwapGet * final;
      return {
        body: `${name} finished at ${fmtPrice(final)}, at or below your ${fmtPrice(d.target)} target. You bought ${fmtUnits(d.ifSwapGet, d.symbol)} ${tick} with your ${locked} and earned ${fmtUsd(d.pay)}.`,
        total: `${fmtUnits(d.ifSwapGet, d.symbol)} ${tick} (worth ${fmtUsd(worth)}) + ${fmtUsd(d.pay)} = ${fmtUsd(worth + d.pay)}`,
        whatIf: `That ${tick} is worth ${fmtUsd(worth)} at the final price. You’d have ${fmtUsd(d.lockUnits + d.pay)} if ${name} had stayed above ${fmtPrice(d.target)}. You buy at your target even if the market is lower.`,
      };
    }
    case 'returned':
      return { body: `The safety council closed this deal early and returned your ${locked}. You keep your ${fmtUsd(d.pay)}.` };
  }
}

type Step = { label: string; state: 'done' | 'now' | 'todo'; at?: number; note?: string };

function timeline(d: Deal, s: DealStatus, now: number): Step[] {
  const opened: Step = { label: 'Deal opened & paid', state: 'done', at: d.openedAt, note: `+${fmtUsd(d.pay)} sent to your wallet` };
  if (s === 'returned') {
    return [
      opened,
      { label: 'Growing', state: 'done' },
      { label: 'Closed early by the safety council', state: 'done' },
      { label: 'Money in your wallet', state: 'done', note: `Your ${lockedLabel(d)} came back` },
    ];
  }
  const ended = now >= d.endsAt;
  const posted = d.finalPrice != null && d.postedAt != null;
  const checkEnds = posted ? (d.postedAt as number) + SAFETY_CHECK_MS : undefined;
  const checked = checkEnds != null && now >= checkEnds;
  return [
    opened,
    { label: 'Growing', state: ended ? 'done' : 'now', note: ended ? undefined : `${Math.round(progress(d, now) * 100)}% of the way · ends ${fmtRelative(d.endsAt, now)}` },
    { label: 'Deal ended', state: ended ? 'done' : 'todo', at: ended ? d.endsAt : undefined, note: ended ? undefined : fmtDayTime(d.endsAt) },
    {
      label: 'Final price published',
      state: posted ? 'done' : ended ? 'now' : 'todo',
      at: posted ? d.postedAt : undefined,
      note: posted ? `${fmtPrice(d.finalPrice)}` : ended ? 'Usually minutes, sometimes hours' : undefined,
    },
    {
      label: '30-min safety check',
      state: checked ? 'done' : posted ? 'now' : 'todo',
      at: checked ? checkEnds : undefined,
      note: posted && !checked && checkEnds ? `${fmtRelative(checkEnds, now).replace('in ', '')} left` : undefined,
    },
    { label: 'Money in your wallet', state: d.settled ? 'done' : checked ? 'now' : 'todo', at: d.settled ? checkEnds : undefined },
  ];
}

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <View>
      {steps.map((st, i) => {
        const last = i === steps.length - 1;
        const dot = st.state === 'done' ? colors.sprout : st.state === 'now' ? colors.coin : colors.paper;
        return (
          <View key={st.label} style={{ flexDirection: 'row', alignItems: 'stretch', gap: space.md }}>
            <View style={{ alignItems: 'center', width: 26 }}>
              <View
                style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: dot, borderWidth: 2, borderColor: st.state === 'todo' ? colors.faint : colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                {st.state === 'done' ? <Icon name="check" size={14} color={colors.navy} strokeWidth={3} /> : null}
              </View>
              {!last ? <View style={{ width: 2, flex: 1, minHeight: 22, backgroundColor: st.state === 'done' ? colors.navy : colors.border }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : space.md }}>
              <T v="bodyBold" color={st.state === 'todo' ? colors.muted : colors.ink}>
                {st.label}
              </T>
              {st.at != null ? <T v="tiny">{fmtDayTime(st.at)}</T> : null}
              {st.note ? <T v="small">{st.note}</T> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
      <T v="small">{label}</T>
      <T v="smallBold" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </T>
    </Row>
  );
}

export default function DealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useStore();
  const now = useNow();
  const deal = state.deals.find((d) => d.id === id);
  const [reveal, setReveal] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  // One-time reveal: latch it locally (render-time state adjustment), then mark it seen in the store.
  const unseen = !!deal && deal.settled && deal.seenOutcome === false;
  if (unseen && !reveal) setReveal(true);
  const dealId = deal?.id;
  useEffect(() => {
    if (unseen && dealId) actions.markOutcomeSeen(dealId);
  }, [unseen, dealId, actions]);

  if (!deal) {
    return (
      <Screen header={<Header title="Deal" />}>
        <Gap h={space.xl} />
        <Card style={{ alignItems: 'center', gap: space.sm }}>
          <Sprout size={110} mood="thinking" prop="sign" signText="Hmm?" pose="hold" />
          <T v="h3" center>
            We couldn’t find this deal
          </T>
          <T v="small" center>
            Even our patience couldn’t find this page. It may belong to another wallet.
          </T>
          <Button title="See my deals" onPress={() => router.replace('/(tabs)/deals')} style={{ alignSelf: 'stretch', marginTop: space.sm }} />
        </Card>
      </Screen>
    );
  }

  const a = getAsset(deal.symbol);
  const s = dealStatus(deal, now);
  const ended = isEnded(s);
  const mood = MOOD[s];
  const copy = statusCopy(deal, s, a, now);
  const today = a?.price || deal.priceAtOpen;
  const needs = deal.target / today - 1;
  const swapIfNow = swapHappens(deal.goal, today, deal.target);
  const ifNow = swapIfNow
    ? deal.goal === 'sell'
      ? `you’d sell for ${fmtUsd(deal.ifSwapGet)}`
      : `you’d buy ${fmtUnits(deal.ifSwapGet, deal.symbol)} ${tickerOf(a, deal.symbol)}`
    : deal.goal === 'sell'
      ? `you’d keep your ${tickerOf(a, deal.symbol)}`
      : `your ${lockedLabel(deal)} comes back`;
  const highlight = deal.finalPrice != null && s !== 'returned' ? (swapHappens(deal.goal, deal.finalPrice, deal.target) ? 'swap' : 'keep') : undefined;
  const ifSwapLabel = deal.goal === 'sell' ? fmtUsd(deal.ifSwapGet) : `${fmtUnits(deal.ifSwapGet, deal.symbol)} ${tickerOf(a, deal.symbol)}`;
  const safetyLeft = deal.postedAt != null ? deal.postedAt + SAFETY_CHECK_MS - now : 0;

  const footer = ended ? (
    <Button title="Go again" icon="sparkle" onPress={() => router.push({ pathname: '/deal/new', params: { symbol: deal.symbol, goal: deal.goal } })} />
  ) : s === 'ready' ? (
    <View>
      <Button
        title={collecting ? 'Collecting…' : 'Collect'}
        kind="sun"
        icon="wallet"
        loading={collecting}
        onPress={() => {
          setCollecting(true);
          setCollectError(null);
          actions
            .collect(deal.id)
            .catch(() => setCollectError('Couldn’t collect right now. Your funds are safe in the lock. Collecting needs a little test SOL; get practice money if you have none.'))
            .finally(() => setCollecting(false));
        }}
      />
      <T v="tiny" center color={collectError ? colors.danger : undefined} style={{ marginTop: 6 }}>
        {collectError ?? 'Payouts are usually sent for you. Tap if yours hasn’t arrived yet.'}
      </T>
    </View>
  ) : undefined;

  return (
    <View style={{ flex: 1 }}>
      <Screen header={<Header title={`${deal.goal === 'sell' ? 'Sell High' : 'Buy Low'} · ${a?.name ?? deal.symbol}`} />} footer={footer}>
        {reveal ? (
          <Card color={colors.coin} style={{ marginBottom: space.lg, alignItems: 'center', gap: 4 }}>
            <T v="h2" center>
              {s === 'kept' ? 'You kept it!' : s === 'returned' ? 'Money’s back!' : 'Money’s in!'}
            </T>
            <T v="body" center>
              {s === 'kept'
                ? `You kept your ${lockedLabel(deal)} and earned ${fmtUsd(deal.pay)}.`
                : s === 'sold'
                  ? `You sold ${lockedLabel(deal)} for ${fmtUsd(deal.ifSwapGet)} and earned ${fmtUsd(deal.pay)}.`
                  : s === 'bought'
                    ? `You bought ${fmtUnits(deal.ifSwapGet, deal.symbol)} ${tickerOf(a, deal.symbol)} and earned ${fmtUsd(deal.pay)}.`
                    : `Your ${lockedLabel(deal)} is back and you keep ${fmtUsd(deal.pay)}.`}
            </T>
          </Card>
        ) : null}

        {/* status */}
        <Card style={{ gap: space.sm }}>
          <Row gap={space.md} style={{ alignItems: 'flex-end' }}>
            <Sprout size={96} mood={mood.mood} prop={mood.prop} pose={ended ? 'cheer' : 'idle'} />
            <View style={{ flex: 1, gap: 6, paddingBottom: space.sm }}>
              <StatusChip deal={deal} now={now} />
              <T v="small">{mood.line}</T>
            </View>
            <Pot stage={growthStage(deal, now)} size={56} color={a?.color} glyph={a?.glyph} />
          </Row>
          <Divider />
          <T v="body">{copy.body}</T>
          {copy.total ? (
            <View style={{ backgroundColor: colors.earnSoft, borderRadius: radius.md, padding: space.md, borderWidth: 2, borderColor: colors.navy }}>
              <T v="label">In total</T>
              <T v="h3">{copy.total}</T>
            </View>
          ) : null}
          {copy.whatIf ? (
            <T v="small">
              <T v="smallBold">What if: </T>
              {copy.whatIf}
            </T>
          ) : null}
          {s === 'safety_check' && safetyLeft > 0 ? (
            <Row gap={space.md}>
              <CountdownRing msLeft={safetyLeft} totalMs={SAFETY_CHECK_MS} size={60} />
              <T v="small" style={{ flex: 1 }}>
                <Term id="safety-check">Safety check</Term> ends {fmtRelative(deal.postedAt! + SAFETY_CHECK_MS, now)}.
              </T>
            </Row>
          ) : null}
          {s === 'returned' ? (
            <T v="small">
              Why? A <Term id="safety-council" /> (3 of 5 must agree) can return everyone’s funds in an emergency. You still keep your pay.
            </T>
          ) : null}
        </Card>

        {/* numbers */}
        <SectionTitle title="Your deal" />
        <Card style={{ gap: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="small">{deal.goal === 'sell' ? 'What you locked' : 'What you set aside'}</T>
            <T v="bodyBold">{lockedLabel(deal)}</T>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={4}>
              <T v="small">Target price</T>
              <InfoDot id="target-price" size={16} />
            </Row>
            <T v="bodyBold">{fmtPrice(deal.target)}</T>
          </Row>
          <Row style={{ justifyContent: 'space-between' }} center={false}>
            <Row gap={4}>
              <T v="small">End date</T>
              <InfoDot id="end-date" size={16} />
            </Row>
            <View style={{ alignItems: 'flex-end' }}>
              <T v="bodyBold">{fmtDayTime(deal.endsAt)}</T>
              {s === 'active' ? <T v="tiny">{fmtRelative(deal.endsAt, now)}</T> : null}
            </View>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="small">Upfront pay earned</T>
            <T v="h3" color={colors.earn}>
              {fmtUsd(deal.pay)}
            </T>
          </Row>
          <Row gap={4} style={{ justifyContent: 'flex-end' }}>
            <T v="tiny">
              {fmtPct(deal.pct)} of what you locked · {fmtPct(deal.apr, 1)} yearly rate
            </T>
            <InfoDot id="yearly-rate" size={14} />
          </Row>
          {deal.finalPrice != null ? (
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={4}>
                <T v="small">Final price</T>
                <InfoDot id="final-price" size={16} />
              </Row>
              <T v="bodyBold">{fmtPrice(deal.finalPrice)}</T>
            </Row>
          ) : null}
          {s === 'active' ? (
            <>
              <Divider />
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={4}>
                  <T v="small">Today’s price</T>
                  <InfoDot id="todays-price" size={16} />
                </Row>
                <T v="bodyBold">{fmtPrice(today)}</T>
              </Row>
              <T v="small">
                Target {fmtPrice(deal.target)} · today {fmtPrice(today)} {swapIfNow ? '(already reached)' : `(needs ${fmtSignedPct(needs)})`}
              </T>
              <View style={{ backgroundColor: colors.blueSoft, borderRadius: radius.md, padding: space.md, gap: 4 }}>
                <Row gap={6}>
                  <Badge label="Hint, not a forecast" color={colors.paper} />
                  <InfoDot id="final-price" size={16} />
                </Row>
                <T v="small" color={colors.ink}>
                  If it ended now: {ifNow}. Only the official final price on {fmtDayTime(deal.endsAt)} decides.
                </T>
              </View>
            </>
          ) : null}
        </Card>

        {a && s !== 'returned' ? (
          <>
            <SectionTitle title={highlight ? (ended ? 'How it ended' : 'Looks like') : 'Two endings'} />
            {s === 'safety_check' ? (
              <T v="small" style={{ marginBottom: space.sm }}>
                Looks like: {resultLine(deal, a)}. Not final until the safety check is done.
              </T>
            ) : null}
            <OutcomeCards goal={deal.goal} asset={a} target={deal.target} lockLabel={lockedLabel(deal)} ifSwapLabel={ifSwapLabel} pay={deal.pay} endsAt={deal.endsAt} highlight={highlight} />
          </>
        ) : null}

        <SectionTitle title="Timeline" />
        <Card>
          <Timeline steps={timeline(deal, s, now)} />
        </Card>

        <SectionTitle title="Receipt" action={receiptOpen ? 'Hide' : 'Show'} onAction={() => setReceiptOpen((o) => !o)} />
        {receiptOpen ? (
          <Card>
            <ReceiptRow label="Opened" value={fmtDayTime(deal.openedAt)} />
            <ReceiptRow label="Partner" value={deal.partner} />
            <ReceiptRow label="Offers compared" value={String(deal.offers)} />
            <ReceiptRow label="Price when you started" value={fmtPrice(deal.priceAtOpen)} />
            <ReceiptRow label="PAYtience fee" value="0%" />
            <Divider />
            <Pressable accessibilityRole="button" onPress={() => setAdvanced((v) => !v)} hitSlop={8}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="smallBold" color={colors.blue}>
                  Advanced
                </T>
                <View style={{ transform: [{ rotate: advanced ? '90deg' : '0deg' }] }}>
                  <Icon name="chevron" size={16} color={colors.blue} />
                </View>
              </Row>
            </Pressable>
            {advanced ? (
              <View style={{ marginTop: space.sm }}>
                <ReceiptRow label="Deal address" value={shortAddress(deal.id)} />
                <T v="tiny">Deals are public on Solana, tied to a wallet address rather than a name.</T>
              </View>
            ) : null}
          </Card>
        ) : (
          <Card flat color={colors.paper} onPress={() => setReceiptOpen(true)} style={{ paddingVertical: space.md }}>
            <T v="small">Opened {fmtDayTime(deal.openedAt)} · {deal.partner} · fee 0%</T>
          </Card>
        )}
        <Gap h={space.lg} />
        <T v="tiny" center>
          Deals are locked until the end date. Upfront pay is yours in every outcome.
        </T>
      </Screen>
      {reveal ? <CoinShower /> : null}
    </View>
  );
}
