import { router } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated as RNAnimated, Modal, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Coin, Pot } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { Sprout } from '@/components/Sprout';
import { Badge, Button, Card, Gap, Row, T, tap } from '@/components/ui';
import { Asset, getAsset } from '@/data/assets';
import { GLOSSARY, TermId } from '@/data/learn';
import { Deal, dealStatus, DealStatus, growthStage, lockedLabel, progress, STATUS_LABEL } from '@/domain/deals';
import { fmtCountdown, fmtDay, fmtPrice, fmtRelative, fmtUnits, fmtUsd } from '@/domain/format';
import type { Goal } from '@/domain/pricing';
import { colors, fonts, MAX_WIDTH, radius, space, sticker } from '@/theme';

/* ------------------------------------------------------------ asset icon */

export function AssetIcon({ asset, size = 44 }: { asset: Asset | undefined; size?: number }) {
  const glyph = asset?.glyph || asset?.name.slice(0, 1) || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: asset?.color ?? colors.faint,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.navy,
      }}>
      <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: glyph.length > 1 ? size * 0.32 : size * 0.45 }}>{glyph}</Text>
    </View>
  );
}

export function StateBadge({ asset }: { asset: Asset }) {
  if (asset.state === 'live') return <Badge label="Live" color={colors.earnSoft} fg={colors.earn} />;
  if (asset.state === 'quote') return <Badge label="Preview" color={colors.blueSoft} />;
  return <Badge label="Coming soon" color="#EEF1F5" fg={colors.muted} />;
}

/* ------------------------------------------------------- "What's this?" */

const TermCtx = createContext<(id: TermId) => void>(() => {});

export function TermProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<TermId | null>(null);
  const insets = useSafeAreaInsets();
  const entry = open ? GLOSSARY[open] : null;
  return (
    <TermCtx.Provider value={setOpen}>
      {children}
      <Modal visible={!!open} transparent animationType="slide" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(null)} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          {entry && (
            <>
              <Row gap={space.md} style={{ alignItems: 'flex-end' }}>
                <Sprout size={72} mood="happy" pose="point" prop="sign" signText="Aha!" />
                <View style={{ flex: 1, paddingBottom: space.md }}>
                  <T v="label">What’s this?</T>
                  <T v="h2">{entry.term}</T>
                </View>
              </Row>
              <Gap />
              <T v="body">{entry.plain}</T>
              {entry.curious ? (
                <T v="small" style={{ marginTop: space.sm }}>
                  For the curious: {entry.curious}
                </T>
              ) : null}
              <Gap h={space.lg} />
              <Button title="Got it" onPress={() => setOpen(null)} />
              <Gap h={space.sm} />
              <Button
                title="Open the Learn hub"
                kind="ghost"
                onPress={() => {
                  setOpen(null);
                  router.push('/learn');
                }}
              />
            </>
          )}
        </View>
      </Modal>
    </TermCtx.Provider>
  );
}

export function useTerm() {
  return useContext(TermCtx);
}

/** Inline jargon with a dotted underline; tap to explain. */
export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const open = useTerm();
  return (
    <Text
      accessibilityRole="button"
      accessibilityHint="Explains this term"
      onPress={() => {
        tap();
        open(id);
      }}
      style={{ textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: colors.blue, color: colors.blueDeep, fontFamily: fonts.bodyBold }}>
      {children ?? GLOSSARY[id].term}
    </Text>
  );
}

/** A small (i) button that explains a term. */
export function InfoDot({ id, size = 18 }: { id: TermId; size?: number }) {
  const open = useTerm();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`What is ${GLOSSARY[id].term}?`} hitSlop={10} onPress={() => open(id)}>
      <Icon name="info" size={size} color={colors.blue} />
    </Pressable>
  );
}

/* ----------------------------------------------------------- slide to OK */

export function SlideToApprove({ label = 'Slide to approve', onDone, disabled }: { label?: string; onDone: () => void; disabled?: boolean }) {
  const [width, setWidth] = useState(0);
  const knob = 56;
  const [x] = useState(() => new RNAnimated.Value(0));
  const max = Math.max(0, width - knob - 8);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);
  // PanResponder handlers only read the ref inside gesture callbacks, never during render.
  const responder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(max, g.dx))),
        onPanResponderRelease: (_, g) => {
          if (g.dx >= max * 0.85) {
            RNAnimated.timing(x, { toValue: max, duration: 120, useNativeDriver: false }).start(() => {
              tap('success');
              doneRef.current();
              setTimeout(() => x.setValue(0), 600);
            });
          } else {
            RNAnimated.spring(x, { toValue: 0, useNativeDriver: false }).start();
          }
        },
      }),
    [disabled, max, x],
  );
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={disabled ? 'Getting your offer' : label}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityActions={[{ name: 'activate', label: 'Approve' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'activate' && !disabled) {
          tap('success');
          onDone();
        }
      }}
      style={[styles.slider, sticker(4), { backgroundColor: disabled ? '#C9D6E6' : colors.blue }]}>
      <Text style={styles.sliderText}>{disabled ? 'Getting your offer…' : label}</Text>
      <RNAnimated.View {...responder.panHandlers} style={[styles.knob, { transform: [{ translateX: x }] }]}>
        <Coin size={40} />
      </RNAnimated.View>
    </View>
  );
}

/* ------------------------------------------------------- countdown ring */

export function CountdownRing({ msLeft, totalMs = 30_000, size = 54 }: { msLeft: number; totalMs?: number; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, msLeft / totalMs));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E4EDF5" strokeWidth={5} fill={colors.paper} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.blue}
          strokeWidth={5}
          fill="none"
          strokeDasharray={`${circ}`}
          strokeDashoffset={circ * (1 - frac)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <T v="smallBold">{fmtCountdown(msLeft)}</T>
    </View>
  );
}

/* ----------------------------------------------------------- coin shower */

function FallingCoin({ x, delay, h }: { x: number; delay: number; h: number }) {
  const y = useSharedValue(-60);
  const rot = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withTiming(h + 60, { duration: 1600, easing: Easing.in(Easing.quad) }));
    rot.value = withDelay(delay, withTiming(360, { duration: 1600 }));
  }, [delay, h, rot, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: 0 }, style]}>
      <Coin size={34} />
    </Animated.View>
  );
}

export function CoinShower({ count = 18 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const coins = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ x: ((i * 37) % 100) / 100 * (width - 34), delay: (i * 97) % 900 })),
    [count, width],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {coins.map((c, i) => (
        <FallingCoin key={i} x={c.x} delay={c.delay} h={height} />
      ))}
    </View>
  );
}

/* ------------------------------------------------------- outcome cards */

/** The two endings, shown before every approval. Teal = you get it back, coral = trade happens. */
export function OutcomeCards({
  goal,
  asset,
  target,
  lockLabel,
  ifSwapLabel,
  pay,
  endsAt,
  highlight,
}: {
  goal: Goal;
  asset: Asset;
  target: number;
  lockLabel: string;
  ifSwapLabel: string;
  pay: number;
  endsAt: number;
  highlight?: 'keep' | 'swap';
}) {
  const name = asset.ticker === asset.symbol ? asset.name : asset.ticker;
  const keepWhen = goal === 'sell' ? `under ${fmtPrice(target)}` : `above ${fmtPrice(target)}`;
  const swapWhen = goal === 'sell' ? `${fmtPrice(target)} or more` : `${fmtPrice(target)} or less`;
  const keepThen = `your ${lockLabel} comes back`;
  const swapThen = goal === 'sell' ? `you sell for ${ifSwapLabel}` : `you buy ${ifSwapLabel}`;
  return (
    <View>
      <View style={[styles.eitherWay, sticker(3)]}>
        <Coin size={24} />
        <T v="bodyBold" style={{ flex: 1 }}>
          +{fmtUsd(pay)} is yours either way
        </T>
      </View>
      <Gap h={space.md} />
      <Row gap={space.md} center={false}>
        <View style={[styles.outcome, { backgroundColor: colors.keepSoft }, highlight === 'swap' && { opacity: 0.45 }, highlight === 'keep' && sticker(4)]}>
          <View style={[styles.outcomeDot, { backgroundColor: colors.keep }]}>
            <Icon name="back" size={16} color={colors.navy} />
          </View>
          <T v="tiny">If {name} is</T>
          <T v="bodyBold">{keepWhen}</T>
          <T v="tiny">on {fmtDay(endsAt)}</T>
          <Gap h={6} />
          <T v="small" color={colors.ink}>
            → {keepThen}
          </T>
        </View>
        <View style={[styles.outcome, { backgroundColor: colors.swapSoft }, highlight === 'keep' && { opacity: 0.45 }, highlight === 'swap' && sticker(4)]}>
          <View style={[styles.outcomeDot, { backgroundColor: colors.swap }]}>
            <Icon name={goal === 'sell' ? 'up' : 'down'} size={16} color={colors.navy} />
          </View>
          <T v="tiny">If {name} is</T>
          <T v="bodyBold">{swapWhen}</T>
          <T v="tiny">on {fmtDay(endsAt)}</T>
          <Gap h={6} />
          <T v="small" color={colors.ink}>
            → {swapThen}
          </T>
        </View>
      </Row>
    </View>
  );
}

/* ------------------------------------------------------------ deal card */

const STATUS_COLORS: Record<DealStatus, { bg: string; fg: string }> = {
  active: { bg: colors.earnSoft, fg: colors.earn },
  awaiting_price: { bg: colors.warnSoft, fg: colors.warn },
  safety_check: { bg: colors.warnSoft, fg: colors.warn },
  ready: { bg: colors.blueSoft, fg: colors.blueDeep },
  kept: { bg: colors.keepSoft, fg: '#0E7C74' },
  sold: { bg: colors.swapSoft, fg: '#B4233D' },
  bought: { bg: colors.swapSoft, fg: '#B4233D' },
  returned: { bg: '#EEF1F5', fg: colors.muted },
};

export function statusLabel(d: Deal, s: DealStatus, now: number): string {
  const a = getAsset(d.symbol);
  if (s === 'active') return `Growing · ${fmtRelative(d.endsAt, now).replace('in ', '')} left`;
  if (s === 'sold') return `Sold at ${fmtPrice(d.target)}`;
  if (s === 'bought') return `Bought ${fmtUnits(d.ifSwapGet, d.symbol)} ${a?.ticker ?? ''}`;
  return STATUS_LABEL[s];
}

export function StatusChip({ deal, now }: { deal: Deal; now: number }) {
  const s = dealStatus(deal, now);
  const c = STATUS_COLORS[s];
  return <Badge label={statusLabel(deal, s, now)} color={c.bg} fg={c.fg} />;
}

export function DealCard({ deal, now }: { deal: Deal; now: number }) {
  const a = getAsset(deal.symbol);
  const s = dealStatus(deal, now);
  const p = progress(deal, now);
  return (
    <Card onPress={() => router.push({ pathname: '/deal/[id]', params: { id: deal.id } })} style={{ marginBottom: space.md }}>
      <Row gap={space.md}>
        <Pot stage={growthStage(deal, now)} size={46} color={a?.color} glyph={a?.glyph} />
        <View style={{ flex: 1, gap: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="bodyBold">
              {deal.goal === 'sell' ? 'Sell High' : 'Buy Low'} · {a?.name ?? deal.symbol}
            </T>
          </Row>
          <StatusChip deal={deal} now={now} />
          <T v="small">
            Locked {lockedLabel(deal)} · Target {fmtPrice(deal.target)}
          </T>
          {s === 'active' ? (
            <View style={{ height: 8, borderRadius: 8, backgroundColor: '#E4EDF5', overflow: 'hidden', marginTop: 2 }}>
              <View style={{ width: `${p * 100}%`, height: '100%', backgroundColor: colors.sprout }} />
            </View>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T v="tiny">Earned</T>
          <T v="h3" color={colors.earn}>
            {fmtUsd(deal.pay)}
          </T>
        </View>
      </Row>
    </Card>
  );
}

/* ------------------------------------------------------- practice pill */

export function PracticeRibbon() {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/practice')} style={styles.ribbon}>
      <Text style={styles.ribbonText}>Practice mode · test money</Text>
    </Pressable>
  );
}

export function EmptyState({ title, body, cta, onCta, mood = 'happy', prop }: { title: string; body: string; cta?: string; onCta?: () => void; mood?: 'happy' | 'sleepy' | 'thinking' | 'worried'; prop?: 'can' | 'zzz' | 'sign' }) {
  return (
    <Card style={{ alignItems: 'center', gap: space.sm }}>
      <Sprout size={96} mood={mood} prop={prop} pose={prop === 'can' ? 'point' : 'idle'} />
      <T v="h3" center>
        {title}
      </T>
      <T v="small" center>
        {body}
      </T>
      {cta ? <Button title={cta} onPress={onCta ?? (() => {})} style={{ alignSelf: 'stretch', marginTop: space.sm }} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(11,35,80,0.35)' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.xl,
    borderWidth: 2,
    borderColor: colors.navy,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  slider: { height: 64, borderRadius: radius.pill, justifyContent: 'center', overflow: 'hidden' },
  sliderText: { position: 'absolute', alignSelf: 'center', color: '#fff', fontFamily: fonts.display, fontSize: 18 },
  knob: { position: 'absolute', left: 4, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  eitherWay: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.earnSoft, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm },
  outcome: { flex: 1, borderRadius: radius.md, padding: space.md, borderWidth: 2, borderColor: colors.navy },
  outcomeDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.navy, marginBottom: 6 },
  ribbon: { alignSelf: 'flex-start', backgroundColor: colors.practice, paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.navy },
  ribbonText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.navy },
});
