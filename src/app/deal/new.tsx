import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Card, Chip, Gap, Header, ProgressBar, Row, Screen, SproutSays, T, tap } from '@/components/ui';
import { InfoDot, Term } from '@/components/widgets';
import { getAsset } from '@/data/assets';
import { fmtDay, fmtPrice, fmtSignedPct, fmtTime, fmtUnits, fmtUsd } from '@/domain/format';
import { dealMath, defaultEndDate, endDatesOf, Goal, LIMITS, targetsOf } from '@/domain/pricing';
import { useBoard } from '@/live/boards';
import { useStore } from '@/store/app-store';
import { colors, fonts, radius, space, sticker } from '@/theme';

type Step = 0 | 1 | 2;
const STEP_TITLES = ['Pick an end date', 'Pick a target price', 'How much?'];

export default function NewDeal() {
  const params = useLocalSearchParams<{ symbol: string; goal: string }>();
  const asset = getAsset(params.symbol);
  const goal: Goal = params.goal === 'sell' ? 'sell' : 'buy';
  const { state } = useStore();

  // dates and targets come from the backend's live board for this asset
  const { board, loading, error } = useBoard(asset?.symbol, goal);
  const dates = endDatesOf(board);
  const [step, setStep] = useState<Step>(0);
  const [pickedEnd, setPickedEnd] = useState<number | undefined>(undefined);
  const endTs = pickedEnd ?? defaultEndDate(dates)?.ts;
  const end = dates.find((d) => d.ts === endTs);
  const targets = targetsOf(goal, board, end?.ts);
  const [targetPrice, setTargetPrice] = useState<number | null>(null);
  const target = targets.find((t) => t.target === targetPrice);

  const balance = !asset ? 0 : goal === 'sell' ? state.balances.tokens[asset.symbol] ?? 0 : state.balances.usdc;
  const [amountText, setAmountText] = useState(() => {
    if (goal === 'buy') return '100';
    if (!asset) return '1';
    const bal = state.balances.tokens[asset.symbol] ?? 0;
    return bal > 0 ? String(Number(Math.min(bal, 1).toPrecision(4))) : String(Number((100 / asset.price).toPrecision(3)));
  });
  const amount = parseFloat(amountText.replace(',', '.')) || 0;

  if (!asset) {
    return (
      <Screen header={<Header />}>
        <SproutSays mood="worried">We couldn’t find that asset.</SproutSays>
      </Screen>
    );
  }

  const unit = goal === 'sell' ? asset.ticker : '$';
  const math = target ? dealMath(goal, asset, target, amount) : undefined;

  let amountError: string | null = null;
  if (amount <= 0) amountError = 'Enter an amount above zero.';
  else if (math && math.dealSizeUsd > LIMITS.maxDealUsd) amountError = `One deal can be up to ${fmtUsd(LIMITS.maxDealUsd)} right now.`;
  else if (math && math.dealSizeUsd < LIMITS.minDealUsd) amountError = `Too small to pay out. Try at least ${fmtUsd(LIMITS.minDealUsd)}.`;
  const overBalance = !!state.wallet && amount > balance + 1e-9;

  const presets =
    goal === 'buy'
      ? [25, 50, 100, 500].map((v) => ({ label: `$${v}`, value: v }))
      : [0.25, 0.5, 0.75, 1].map((f) => ({ label: f === 1 ? 'Max' : `${f * 100}%`, value: Number((balance * f).toPrecision(4)) }));

  const next = () => {
    if (step < 2) setStep((step + 1) as Step);
    else if (target && end) {
      router.push({
        pathname: '/deal/review',
        params: { symbol: asset.symbol, goal, end: String(end.ts), target: String(target.target), amount: String(amount) },
      });
    }
  };
  const canNext = step === 0 ? !!end : step === 1 ? !!target : !amountError;

  return (
    <Screen
      header={
        <View>
          <Header
            title={`${goal === 'sell' ? 'Sell High' : 'Buy Low'} · ${asset.name}`}
            onBack={() => (step > 0 ? setStep((step - 1) as Step) : router.back())}
          />
          <View style={{ paddingHorizontal: space.lg, gap: 6, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="label">
                Step {step + 1} of 3 · {STEP_TITLES[step]}
              </T>
            </Row>
            <ProgressBar value={(step + 1) / 3} color={colors.blue} height={10} />
          </View>
        </View>
      }
      footer={
        <View style={{ gap: space.sm }}>
          {step === 2 && math ? (
            <T v="small" center color={colors.ink}>
              You lock {goal === 'sell' ? `${fmtUnits(amount, asset.symbol)} ${asset.ticker}` : fmtUsd(amount)} · get about{' '}
              <T v="smallBold" color={colors.earn}>
                {fmtUsd(math.pay)}
              </T>{' '}
              today
            </T>
          ) : null}
          <Button title={step === 2 ? 'Review deal' : 'Next'} disabled={!canNext} onPress={next} />
        </View>
      }>
      <Gap h={space.md} />

      {step === 0 ? (
        <>
          <SproutSays mood="thinking" size={76}>
            <T v="small" color={colors.ink}>
              When should the deal end? Your money stays locked until then. About a month is a good start.
            </T>
          </SproutSays>
          <Gap />
          {dates.length === 0 ? (
            <Card>
              <T v="body">{loading ? 'Loading live dates…' : error ? 'Offers are unavailable right now. Please try again in a moment.' : 'No dates available right now.'}</T>
            </Card>
          ) : null}
          <View style={{ gap: space.sm }}>
            {dates.map((d) => {
              const sel = d.ts === endTs;
              const ts = targetsOf(goal, board, d.ts);
              const est = ts[1] ?? ts[0];
              return (
                <Pressable
                  key={d.ts}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  onPress={() => {
                    tap();
                    setPickedEnd(d.ts);
                    setTargetPrice(null);
                  }}
                  style={[styles.option, sel ? [{ backgroundColor: colors.blueSoft }, sticker(3)] : null]}>
                  <View style={{ flex: 1 }}>
                    <T v="bodyBold">
                      {fmtDay(d.ts)} · {d.days} days
                    </T>
                    <T v="tiny">Ends {fmtTime(d.ts)} your time</T>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="tiny">about</T>
                    <T v="smallBold" color={colors.earn}>
                      {fmtUsd(est?.pct ?? 0)} on $100
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Gap />
          <T v="tiny" center>
            Longer deals pay more in total, but lock your money for longer.
          </T>
        </>
      ) : null}

      {step === 1 && end ? (
        <>
          <SproutSays mood="happy" size={76}>
            <T v="small" color={colors.ink}>
              Pick the price you’d happily <T v="smallBold">{goal === 'sell' ? 'sell' : 'buy'}</T> {asset.name} at on {fmtDay(end.ts)}. Closer targets pay more, because the trade is
              more likely.
            </T>
          </SproutSays>
          <Gap />
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="small">
              <Term id="todays-price" />: <T v="smallBold">{fmtPrice(asset.price)}</T>
            </T>
            <InfoDot id="target-price" />
          </Row>
          <Gap h={space.sm} />
          <View style={{ gap: space.sm }}>
            {targets.map((t, i) => {
              const sel = t.target === targetPrice;
              const pay = goal === 'sell' ? t.payPerUnit : t.pct;
              const intensity = 1 - i / Math.max(1, targets.length);
              return (
                <Pressable
                  key={t.target}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  onPress={() => {
                    tap();
                    setTargetPrice(t.target);
                  }}
                  style={[styles.option, sel ? [{ backgroundColor: colors.blueSoft }, sticker(3)] : null]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Row gap={6}>
                      <T v="h3">{fmtPrice(t.target)}</T>
                      <T v="tiny">
                        {fmtSignedPct(t.moneyness)} {goal === 'sell' ? 'above' : 'below'} today
                      </T>
                    </Row>
                    <View style={styles.intensityTrack}>
                      <View style={{ width: `${25 + intensity * 75}%`, height: '100%', backgroundColor: colors.blue, opacity: 0.35 + intensity * 0.65, borderRadius: 4 }} />
                    </View>
                    {goal === 'sell' && i === targets.length - 1 ? <T v="tiny">Most likely to keep your {asset.ticker}</T> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="tiny">get about</T>
                    <T v="bodyBold" color={colors.earn}>
                      {fmtUsd(pay)}
                    </T>
                    <T v="tiny">{goal === 'sell' ? `per 1 ${asset.ticker}` : 'per $100'}</T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Gap h={space.sm} />
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="tiny">More pay · more likely to trade</T>
            <T v="tiny">Less pay · less likely</T>
          </Row>
          {targets.length === 0 ? (
            <Card>
              <T v="body">No offers for this date. Try another date.</T>
            </Card>
          ) : null}
        </>
      ) : null}

      {step === 2 && target ? (
        <>
          <SproutSays mood="determined" size={76}>
            <T v="small" color={colors.ink}>
              {goal === 'sell'
                ? `How much ${asset.name} would you like to lock? Only lock what you’d be happy to sell at ${fmtPrice(target.target)}.`
                : `How many dollars would you like to set aside? Only use money you’d be happy to spend on ${asset.name} at ${fmtPrice(target.target)}.`}
            </T>
          </SproutSays>
          <Gap />
          <Card>
            <T v="label">
              <Term id="what-you-lock" />
            </T>
            <Row gap={space.sm} style={{ marginTop: space.sm }}>
              {goal === 'buy' ? <T v="h1">$</T> : null}
              <TextInput
                value={amountText}
                onChangeText={(v) => setAmountText(v.replace(/[^0-9.,]/g, ''))}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                accessibilityLabel="Amount"
                selectTextOnFocus
              />
              {goal === 'sell' ? <T v="h2">{asset.ticker}</T> : null}
            </Row>
            <T v="small">
              {goal === 'sell' ? `≈ ${fmtUsd(amount * asset.price)} today · ` : ''}
              Practice balance: {state.wallet ? (goal === 'sell' ? `${fmtUnits(balance, asset.symbol)} ${asset.ticker}` : fmtUsd(balance)) : '—'}
            </T>
            {state.wallet && balance > 0 ? (
              <Row gap={space.sm} style={{ flexWrap: 'wrap', marginTop: space.md }}>
                {presets.map((p) => (
                  <Chip key={p.label} label={p.label} onPress={() => setAmountText(String(p.value))} />
                ))}
              </Row>
            ) : null}
            {amountError ? (
              <T v="smallBold" color={colors.danger} style={{ marginTop: space.sm }}>
                {amountError}
              </T>
            ) : null}
          </Card>

          {overBalance || !state.wallet ? (
            <Card color={colors.warnSoft} style={{ marginTop: space.md }} onPress={() => router.push(state.wallet ? '/practice' : '/sign-in')}>
              <Row gap={space.sm}>
                <Icon name="wallet" />
                <T v="small" color={colors.ink} style={{ flex: 1 }}>
                  {!state.wallet
                    ? 'You’ll need a free wallet with practice money. Tap to set one up. It takes 10 seconds.'
                    : `That’s more than you have (${goal === 'sell' ? `${fmtUnits(balance, asset.symbol)} ${asset.ticker}` : fmtUsd(balance)}). Tap to get free practice money.`}
                </T>
                <Icon name="chevron" />
              </Row>
            </Card>
          ) : null}

          {math ? (
            <Card style={{ marginTop: space.md }} color={colors.cream}>
              <SummaryLine label="You lock" value={goal === 'sell' ? `${fmtUnits(amount, asset.symbol)} ${asset.ticker}` : fmtUsd(amount)} />
              <SummaryLine label="Paid to you today (about)" value={fmtUsd(math.pay)} strong />
              <SummaryLine
                label={goal === 'sell' ? 'If it sells, you get' : 'If it buys, you get'}
                value={goal === 'sell' ? fmtUsd(math.ifSwapGet) : `${fmtUnits(math.ifSwapGet, asset.symbol)} ${asset.ticker}`}
              />
              <SummaryLine label="Ends" value={end ? `${fmtDay(end.ts)} · ${fmtTime(end.ts)}` : '—'} />
            </Card>
          ) : null}
          <T v="tiny" center style={{ marginTop: space.sm }}>
            {unit === '$' ? 'Digital dollars (USDC).' : ''} One deal can be up to {fmtUsd(LIMITS.maxDealUsd)} for now.
          </T>
        </>
      ) : null}
    </Screen>
  );
}

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
      <T v="small">{label}</T>
      <T v={strong ? 'bodyBold' : 'smallBold'} color={strong ? colors.earn : colors.ink}>
        {value}
      </T>
    </Row>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.navy,
    padding: space.md,
  },
  intensityTrack: { height: 8, borderRadius: 4, backgroundColor: '#EAF1F8', overflow: 'hidden', marginTop: 4, maxWidth: 140 },
  amountInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.navy,
    paddingVertical: 4,
    minWidth: 60,
  },
});
