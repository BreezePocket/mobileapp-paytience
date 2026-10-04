import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Coin } from '@/components/Art';
import { Button, Card, Chip, Gap, Row, Screen, T } from '@/components/ui';
import { DealCard, EmptyState, InfoDot } from '@/components/widgets';
import { getAsset } from '@/data/assets';
import { dealStatus, DealStatus, isEnded } from '@/domain/deals';
import { fmtUsd } from '@/domain/format';
import { useNow, useStore } from '@/store/app-store';
import { colors, space } from '@/theme';

type Segment = 'active' | 'ended';
type EndedFilter = 'all' | 'kept' | 'sold' | 'bought';
const FILTERS: { id: EndedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'kept', label: 'Kept' },
  { id: 'sold', label: 'Sold' },
  { id: 'bought', label: 'Bought' },
];
const PAGE = 20;

export default function MyDeals() {
  const { state } = useStore();
  const now = useNow(5000);
  const [segment, setSegment] = useState<Segment>('active');
  const [filter, setFilter] = useState<EndedFilter>('all');
  const [shown, setShown] = useState(PAGE);

  const withStatus = useMemo(() => state.deals.map((d) => ({ d, s: dealStatus(d, now) as DealStatus })), [state.deals, now]);
  const active = withStatus.filter((x) => !isEnded(x.s)).sort((a, b) => a.d.endsAt - b.d.endsAt);
  // ended: most recently finished first
  const ended = withStatus.filter((x) => isEnded(x.s)).sort((a, b) => b.d.endsAt - a.d.endsAt);
  const endedFiltered = filter === 'all' ? ended : ended.filter((x) => x.s === filter);
  const list = segment === 'active' ? active : endedFiltered;

  const earned = state.deals.reduce((s, d) => s + d.pay, 0);
  const lockedNow = active.reduce((s, { d }) => s + (d.goal === 'buy' ? d.lockUnits : d.lockUnits * (getAsset(d.symbol)?.price || d.priceAtOpen)), 0);

  const startDeal = () => router.push('/(tabs)/earn');

  if (state.deals.length === 0) {
    return (
      <Screen tabs>
        <Gap h={space.lg} />
        <T v="h1">My Deals</T>
        <Gap h={space.lg} />
        {state.wallet && !state.dealsLoaded ? (
          <EmptyState title="Looking for your deals…" body={state.syncError ?? 'Reading them from Solana.'} mood="thinking" />
        ) : (
          <EmptyState title="No deals growing." body="Start one and get paid today." prop="can" cta="Start a deal" onCta={startDeal} />
        )}
      </Screen>
    );
  }

  return (
    <Screen tabs>
      <Gap h={space.lg} />
      <T v="h1">My Deals</T>
      <Gap h={space.md} />
      <Card color={colors.cream}>
        <Row gap={space.md}>
          <View style={{ flex: 1 }}>
            <Row gap={4}>
              <T v="label">Upfront pay earned</T>
              <InfoDot id="upfront-pay" size={14} />
            </Row>
            <Row gap={6}>
              <Coin size={24} />
              <T v="h2" color={colors.earn}>
                {fmtUsd(earned)}
              </T>
            </Row>
          </View>
          <View style={{ flex: 1 }}>
            <Row gap={4}>
              <T v="label">Locked right now</T>
              <InfoDot id="the-lock" size={14} />
            </Row>
            <T v="h2">≈ {fmtUsd(lockedNow)}</T>
          </View>
        </Row>
        <T v="tiny" style={{ marginTop: space.sm }}>
          {active.length} growing · {ended.length} finished
        </T>
      </Card>

      <Gap h={space.lg} />
      <Row gap={space.sm}>
        <Chip label={`Active (${active.length})`} selected={segment === 'active'} onPress={() => { setSegment('active'); setShown(PAGE); }} />
        <Chip label={`Ended (${ended.length})`} selected={segment === 'ended'} onPress={() => { setSegment('ended'); setShown(PAGE); }} />
      </Row>
      {segment === 'ended' ? (
        <Row gap={space.xs} style={{ marginTop: space.md, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => { setFilter(f.id); setShown(PAGE); }} />
          ))}
        </Row>
      ) : null}
      <Gap h={space.lg} />

      {list.length === 0 ? (
        segment === 'active' ? (
          <EmptyState title="No deals growing." body="Start one and get paid today." prop="can" />
        ) : (
          <EmptyState
            title={filter === 'all' ? 'Nothing finished yet.' : `No ${filter} deals yet.`}
            body="Finished deals will show up here."
            mood="sleepy"
            prop="zzz"
          />
        )
      ) : (
        <>
          {list.slice(0, shown).map(({ d }) => (
            <DealCard key={d.id} deal={d} now={now} />
          ))}
          {list.length > shown ? <Button title={`Show more (${list.length - shown})`} kind="ghost" onPress={() => setShown((n) => n + PAGE)} /> : null}
        </>
      )}

      <Gap h={space.lg} />
      <Button title="Start a deal" icon="sparkle" onPress={startDeal} />
    </Screen>
  );
}
