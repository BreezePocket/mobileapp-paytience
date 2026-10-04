import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/Icon';
import { Sprout } from '@/components/Sprout';
import { Badge, Button, Card, Divider, Gap, ListRow, Row, Screen, SectionTitle, T } from '@/components/ui';
import { AssetIcon, PracticeRibbon } from '@/components/widgets';
import { Asset, getAsset } from '@/data/assets';
import { fmtUnits, fmtUsd, shortAddress } from '@/domain/format';
import { useStore } from '@/store/app-store';
import { colors, MAX_WIDTH, radius, space } from '@/theme';

const DISCLAIMER = 'Upfront pay isn’t guaranteed and prices can move against you. Not financial advice. Only lock what you’re comfortable trading at your price.';

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


const NOTIFY_OPTIONS = [
  { id: 'ending', label: 'A deal ends tomorrow' },
  { id: 'final', label: 'Final price is in' },
  { id: 'money', label: 'Money’s in your wallet' },
  { id: 'practice', label: 'Practice money is ready again' },
] as const;

function RowIcon({ name }: { name: IconName }) {
  return (
    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.blueSoft, borderWidth: 2, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={20} />
    </View>
  );
}

export default function Me() {
  const { state, actions } = useStore();
  const insets = useSafeAreaInsets();
  const wallet = state.wallet;
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notify, setNotify] = useState<Record<string, boolean>>({ ending: true, final: true, money: true, practice: false });
  const [riskOpen, setRiskOpen] = useState(false);
  const taps = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    [],
  );

  const tokens = Object.entries(state.balances.tokens).filter(([, n]) => n > 0);
  const total = state.balances.usdc + tokens.reduce((sum, [sym, n]) => sum + n * (getAsset(sym)?.price || 0), 0);

  const onVersionTap = () => {
    taps.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (taps.current >= 7) {
      taps.current = 0;
      router.push('/dev');
      return;
    }
    tapTimer.current = setTimeout(() => {
      taps.current = 0;
    }, 1500);
  };

  const signOut = () => {
    const msg = 'This removes the wallet from this device for good. Its practice money and deals can’t be recovered here afterwards.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Remove wallet?\n\n${msg}`)) actions.signOut();
      return;
    }
    Alert.alert('Remove wallet?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => actions.signOut() },
    ]);
  };

  return (
    <Screen tabs>
      <Row style={{ justifyContent: 'space-between', marginTop: space.md }}>
        <T v="h1">Me</T>
        <PracticeRibbon />
      </Row>
      <Gap h={space.lg} />

      {/* profile */}
      <Card>
        <Row gap={space.md}>
          <Sprout size={64} mood={wallet ? 'happy' : 'sleepy'} pose={wallet ? 'wave' : 'idle'} animate={false} />
          <View style={{ flex: 1, gap: 2 }}>
            {wallet ? (
              <>
                <T v="h3" numberOfLines={1}>
                  {wallet.label}
                </T>
                <T v="small">
                  On this device · {shortAddress(wallet.address)}
                </T>
                <Badge label="Your keys, your wallet" color={colors.keepSoft} style={{ marginTop: 4 }} />
              </>
            ) : (
              <>
                <T v="h3">Not signed in</T>
                <T v="small">Sign in to get practice money and start a deal.</T>
              </>
            )}
          </View>
        </Row>
        {!wallet ? <Button title="Sign in" icon="wallet" onPress={() => router.push('/sign-in')} style={{ marginTop: space.md }} /> : null}
      </Card>

      {/* balances */}
      <Card style={{ marginTop: space.lg }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="label">Practice balances</T>
          <Badge label="No real value" color={colors.practice} />
        </Row>
        <Gap h={space.sm} />
        <T v="money">{fmtUsd(total)}</T>
        <Divider />
        <Row gap={space.md}>
          <AssetIcon asset={DOLLARS} size={40} />
          <View style={{ flex: 1 }}>
            <T v="bodyBold">Digital dollars</T>
            <T v="small">USDC</T>
          </View>
          <T v="bodyBold">{fmtUsd(state.balances.usdc)}</T>
        </Row>
        {tokens.map(([sym, n]) => {
          const a = getAsset(sym);
          return (
            <Row key={sym} gap={space.md} style={{ marginTop: space.md }}>
              <AssetIcon asset={a} size={40} />
              <View style={{ flex: 1 }}>
                <T v="bodyBold">{a?.name ?? sym}</T>
                <T v="small">
                  {fmtUnits(n, sym)} {a?.ticker ?? sym}
                </T>
              </View>
              <T v="bodyBold">≈{fmtUsd(n * (a?.price || 0))}</T>
            </Row>
          );
        })}
        <Gap h={space.lg} />
        <Button title="Get practice money" kind="sun" icon="gift" onPress={() => router.push('/practice')} />
        <T v="tiny" center style={{ marginTop: space.sm }}>
          Practice mode · test money, no real value.
        </T>
      </Card>

      <SectionTitle title="More" />
      <Card style={{ paddingVertical: space.sm, paddingHorizontal: space.sm }}>
        <ListRow icon={<RowIcon name="book" />} title="Learn hub" subtitle="Lessons, glossary and a quiz" onPress={() => router.push('/learn')} />
        <ListRow icon={<RowIcon name="sparkle" />} title="Autopilot" subtitle="Preview" onPress={() => router.push('/autopilot')} />
        <ListRow
          icon={<RowIcon name="bell" />}
          title="Notifications"
          subtitle="Choose what we tell you about"
          onPress={() => setNotifyOpen((o) => !o)}
          right={<View style={{ transform: [{ rotate: notifyOpen ? '-90deg' : '90deg' }] }}><Icon name="chevron" size={18} color={colors.muted} /></View>}
        />
        {notifyOpen ? (
          <View style={{ paddingHorizontal: space.md, paddingBottom: space.sm }}>
            {NOTIFY_OPTIONS.map((o) => (
              <Row key={o.id} style={{ justifyContent: 'space-between', paddingVertical: space.xs }}>
                <T v="body" style={{ flex: 1 }}>
                  {o.label}
                </T>
                <Switch
                  value={!!notify[o.id]}
                  onValueChange={(v) => setNotify((n) => ({ ...n, [o.id]: v }))}
                  trackColor={{ true: colors.sprout, false: '#C9D6E6' }}
                  accessibilityLabel={o.label}
                />
              </Row>
            ))}
          </View>
        ) : null}
        <ListRow icon={<RowIcon name="info" />} title="Help & FAQ" onPress={() => router.push('/learn/faq')} />
        <ListRow icon={<RowIcon name="shield" />} title="Risk & terms" subtitle="Please read before your first deal" onPress={() => setRiskOpen(true)} />
        <ListRow
          icon={<RowIcon name="share" />}
          title="Contact us"
          subtitle="hello@paytience.app"
          onPress={() => Linking.openURL('mailto:hello@paytience.app').catch(() => {})}
        />
      </Card>

      {wallet ? <Button title="Remove wallet from this device" kind="ghost" onPress={signOut} style={{ marginTop: space.lg }} /> : null}

      <Pressable onPress={onVersionTap} accessibilityRole="text" style={{ alignSelf: 'center', padding: space.md, marginTop: space.md }}>
        <T v="tiny">PAYtience 0.1 · practice</T>
      </Pressable>

      <Modal visible={riskOpen} transparent animationType="slide" onRequestClose={() => setRiskOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(11,35,80,0.35)' }} onPress={() => setRiskOpen(false)} accessibilityLabel="Close" />
        <View
          style={{
            backgroundColor: colors.cream,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            borderWidth: 2,
            borderColor: colors.navy,
            padding: space.xl,
            paddingBottom: insets.bottom + space.lg,
            width: '100%',
            maxWidth: MAX_WIDTH,
            alignSelf: 'center',
          }}>
          <Row gap={space.md} style={{ alignItems: 'flex-end' }}>
            <Sprout size={72} mood="determined" pose="point" />
            <View style={{ flex: 1, paddingBottom: space.md }}>
              <T v="label">Before you start</T>
              <T v="h2">Risk & terms</T>
            </View>
          </Row>
          <Gap />
          <T v="body">{DISCLAIMER}</T>
          <Gap h={space.sm} />
          <T v="small">
            You might end up selling or buying at your target price. Your money is locked until the end date. Smart contracts can have bugs. PAYtience is in practice mode, and practice money has no value.
          </T>
          <Gap h={space.lg} />
          <Button title="Got it" onPress={() => setRiskOpen(false)} />
        </View>
      </Modal>
    </Screen>
  );
}
