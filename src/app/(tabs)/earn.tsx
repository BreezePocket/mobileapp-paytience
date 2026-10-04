import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Badge, Card, Chip, Gap, Row, Screen, SproutSays, T, tap } from '@/components/ui';
import { AssetIcon, StateBadge, Term } from '@/components/widgets';
import { ASSETS, AssetCategory, CATEGORY_LABEL, sortAssets } from '@/data/assets';
import { fmtPrice, fmtUsd } from '@/domain/format';
import { Goal, payRangePer100 } from '@/domain/pricing';
import { useBoards } from '@/live/boards';
import { useStore } from '@/store/app-store';
import { colors, fonts, radius, space, sticker } from '@/theme';

type Cat = 'all' | AssetCategory;

export default function Earn() {
  const params = useLocalSearchParams<{ goal?: string }>();
  const { state } = useStore();
  const initialGoal: Goal = params.goal === 'sell' || params.goal === 'buy' ? params.goal : state.intent === 'sell' ? 'sell' : 'buy';
  const [goal, setGoal] = useState<Goal>(initialGoal);
  const [cat, setCat] = useState<Cat>('all');
  const [q, setQ] = useState('');

  // follow ?goal= when another screen deep-links here (adjust state during render, not in an effect)
  const [seenParam, setSeenParam] = useState(params.goal);
  if (params.goal !== seenParam) {
    setSeenParam(params.goal);
    if (params.goal === 'sell' || params.goal === 'buy') setGoal(params.goal);
  }

  const query = q.trim().toLowerCase();
  const list = sortAssets(
    ASSETS.filter((a) => (goal === 'buy' ? a.buyLow : true))
      .filter((a) => cat === 'all' || a.category === cat)
      .filter((a) => !query || a.name.toLowerCase().includes(query) || a.ticker.toLowerCase().includes(query)),
  );
  // live offers for every priced asset on screen
  const boards = useBoards(
    list.filter((a) => a.state !== 'soon').map((a) => a.symbol),
    goal,
  );

  const cats: Cat[] = ['all', 'crypto', 'stocks', 'metals', 'preipo'];

  return (
    <Screen tabs>
      <T v="h1" style={{ marginTop: space.sm }}>
        Earn
      </T>
      <Gap h={space.md} />

      {/* goal toggle */}
      <View style={[styles.toggle, sticker(3)]}>
        {(['sell', 'buy'] as Goal[]).map((g) => {
          const sel = goal === g;
          return (
            <Pressable
              key={g}
              accessibilityRole="tab"
              accessibilityState={{ selected: sel }}
              onPress={() => {
                tap();
                setGoal(g);
              }}
              style={[styles.toggleItem, sel && { backgroundColor: g === 'sell' ? colors.blue : colors.pinkDeep }]}>
              <Icon name={g === 'sell' ? 'up' : 'down'} size={18} color={sel ? '#fff' : colors.navy} />
              <T v="bodyBold" color={sel ? '#fff' : colors.navy} style={{ fontFamily: fonts.display }}>
                {g === 'sell' ? 'Sell High' : 'Buy Low'}
              </T>
            </Pressable>
          );
        })}
      </View>
      <Gap h={space.md} />
      <SproutSays mood="happy" size={64}>
        {goal === 'sell' ? (
          <T v="small" color={colors.ink}>
            <Term id="sell-high" />: lock something you own, name a <T v="smallBold">higher</T> price you’d sell at, and get paid today.
          </T>
        ) : (
          <T v="small" color={colors.ink}>
            <Term id="buy-low" />: set aside dollars, name a <T v="smallBold">lower</T> price you’d buy at, and get paid today.
          </T>
        )}
      </SproutSays>

      {/* search */}
      <View style={[styles.search, sticker(2)]}>
        <Icon name="search" size={18} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search Solana, Tesla, Gold…"
          placeholderTextColor={colors.faint}
          style={styles.searchInput}
          accessibilityLabel="Search assets"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: space.md }}>
        {cats.map((c) => (
          <Chip key={c} label={c === 'all' ? 'All' : CATEGORY_LABEL[c]} selected={cat === c} onPress={() => setCat(c)} />
        ))}
      </ScrollView>

      {list.length === 0 ? (
        <Card style={{ alignItems: 'center' }}>
          <T v="bodyBold">No match for “{q}”.</T>
          <T v="small">Try “Solana” or “Tesla”.</T>
        </Card>
      ) : null}

      <View style={{ gap: space.md }}>
        {list.map((a) => {
          const board = boards[a.symbol];
          const range = payRangePer100(board ?? null);
          const soon = a.state === 'soon';
          return (
            <Card
              key={a.symbol}
              style={soon ? { opacity: 0.6 } : undefined}
              onPress={() => router.push({ pathname: '/asset/[symbol]', params: { symbol: a.symbol, goal } })}>
              <Row gap={space.md}>
                <AssetIcon asset={a} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Row gap={6}>
                    <T v="bodyBold">{a.name}</T>
                    {a.ticker.toLowerCase() !== a.name.toLowerCase() ? <T v="tiny">{a.ticker}</T> : null}
                  </Row>
                  <Row gap={6} style={{ flexWrap: 'wrap' }}>
                    <StateBadge asset={a} />
                    {a.badge ? <Badge label={a.badge} color="#F1F4F8" fg={colors.muted} /> : null}
                  </Row>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T v="tiny">Today</T>
                  <T v="bodyBold">{fmtPrice(a.price)}</T>
                </View>
              </Row>
              {range ? (
                <View style={styles.payLine}>
                  <T v="small" color={colors.ink}>
                    On $100 for {range.days} days, get{' '}
                    <T v="smallBold" color={colors.earn}>
                      {fmtUsd(range.min)}–{fmtUsd(range.max)}
                    </T>{' '}
                    today
                  </T>
                </View>
              ) : (
                <View style={styles.payLine}>
                  <T v="small">{soon ? 'Not available yet. Tap to get notified.' : board === undefined ? 'Loading live offers…' : 'No offers right now.'}</T>
                </View>
              )}
            </Card>
          );
        })}
      </View>

      <Gap h={space.lg} />
      <Card onPress={() => router.push('/autopilot')} color={colors.cream}>
        <Row gap={space.md}>
          <T style={{ fontSize: 28 }}>🛩️</T>
          <View style={{ flex: 1 }}>
            <Row gap={6}>
              <T v="bodyBold">Autopilot</T>
              <Badge label="Coming soon" color="#EEF1F5" fg={colors.muted} />
            </Row>
            <T v="small">Set it and forget it: Sell High repeated every 14 days.</T>
          </View>
          <Icon name="chevron" />
        </Row>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', backgroundColor: colors.paper, borderRadius: radius.pill, padding: 4 },
  toggleItem: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radius.pill },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.paper, borderRadius: radius.pill, paddingHorizontal: space.md, marginTop: space.md },
  searchInput: { flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  payLine: { marginTop: space.md, paddingTop: space.sm, borderTopWidth: 2, borderTopColor: colors.border, borderStyle: 'dashed' },
});
