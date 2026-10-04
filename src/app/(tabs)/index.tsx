import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Coin, Floor, Pot } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { Sprout } from '@/components/Sprout';
import { Button, Card, Gap, Row, Screen, SectionTitle, T, tap } from '@/components/ui';
import { PracticeRibbon, Term } from '@/components/widgets';
import { getAsset } from '@/data/assets';
import { TIPS } from '@/data/learn';
import { dealStatus, growthStage, isEnded } from '@/domain/deals';
import { fmtDay, fmtRelative, fmtUsd } from '@/domain/format';
import { useNow, useStore } from '@/store/app-store';
import { colors, radius, space, sticker } from '@/theme';

function greeting(now: number) {
  const h = new Date(now).getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { state, actions } = useStore();
  const now = useNow(5000);
  const deals = state.deals;
  const open = deals.filter((d) => !isEnded(dealStatus(d, now)));
  const earned = deals.reduce((s, d) => s + d.pay, 0);
  const locked = open.reduce((s, d) => s + (d.goal === 'buy' ? d.lockUnits : d.lockUnits * (getAsset(d.symbol)?.price || d.priceAtOpen)), 0);
  const next = [...open].filter((d) => d.endsAt > now).sort((a, b) => a.endsAt - b.endsAt)[0];
  const reveal = deals.find((d) => d.settled && d.seenOutcome === false);
  const today = new Date(now);
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const checkedIn = state.rewards.lastCheckIn === todayKey;
  const tip = TIPS[today.getDate() % TIPS.length];

  const hasMoney = state.balances.usdc > 0 || Object.values(state.balances.tokens).some((v) => v > 0);
  const checklist = [
    { done: !!state.wallet, label: 'Create your free wallet', go: () => router.push('/sign-in') },
    { done: hasMoney || deals.length > 0, label: 'Get free practice money', go: () => router.push('/practice') },
    { done: state.rewards.lessonsDone.includes('how-it-works'), label: 'Learn how it works (1 min)', go: () => router.push('/learn/how-it-works') },
    { done: deals.length > 0, label: 'Start your first deal', go: () => router.push('/(tabs)/earn') },
  ];
  const checklistDone = checklist.every((c) => c.done);

  return (
    <Screen tabs>
      <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
        <View>
          <T v="small">{greeting(now)} 👋</T>
          <T v="h1">{state.wallet ? 'Your garden' : 'Welcome!'}</T>
        </View>
        <PracticeRibbon />
      </Row>

      {reveal ? (
        <Card color={colors.coin} style={{ marginTop: space.lg }} onPress={() => router.push({ pathname: '/deal/[id]', params: { id: reveal.id } })}>
          <Row gap={space.md}>
            <Sprout size={56} mood="excited" pose="cheer" animate={false} />
            <View style={{ flex: 1 }}>
              <T v="bodyBold">Your {getAsset(reveal.symbol)?.name} deal bloomed! 🌼</T>
              <T v="small" color={colors.ink}>
                Tap to see how it ended.
              </T>
            </View>
            <Icon name="chevron" />
          </Row>
        </Card>
      ) : null}

      {/* Coin Jar */}
      <Card style={{ marginTop: space.lg }}>
        <Row style={{ justifyContent: 'space-between' }} center={false}>
          <View style={{ flex: 1 }}>
            <T v="label">
              <Term id="upfront-pay">Upfront pay</Term> earned
            </T>
            <T v="money" color={colors.earn}>
              {fmtUsd(earned)}
            </T>
            <T v="small">Paid to you on day one. Yours to keep.</T>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row' }}>
              <Coin size={30} />
              <View style={{ marginLeft: -10, marginTop: 10 }}>
                <Coin size={30} />
              </View>
            </View>
          </View>
        </Row>
        <View style={styles.jarStats}>
          <View style={{ flex: 1 }}>
            <T v="tiny">Locked now</T>
            <T v="bodyBold">{fmtUsd(locked)}</T>
          </View>
          <View style={{ width: 2, backgroundColor: colors.border, alignSelf: 'stretch' }} />
          <View style={{ flex: 1.4, paddingLeft: space.md }}>
            <T v="tiny">Next deal ends</T>
            <T v="bodyBold">{next ? `${fmtDay(next.endsAt)} · ${fmtRelative(next.endsAt, now)}` : '—'}</T>
          </View>
        </View>
      </Card>

      {/* Cloud Garden */}
      <SectionTitle title="Cloud Garden" action={open.length ? 'See all' : undefined} onAction={() => router.push('/(tabs)/deals')} />
      <View style={[styles.garden, sticker(4)]}>
        <Floor height={70} />
        {open.length === 0 ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', padding: space.md, gap: space.sm }}>
            <Sprout size={92} mood="happy" pose="point" prop="can" />
            <View style={{ flex: 1, marginBottom: 70 }}>
              <View style={[styles.bubble, sticker(2)]}>
                <T v="smallBold">Your garden is empty.</T>
                <T v="small" color={colors.ink}>
                  Plant your first deal and get paid today.
                </T>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-end', paddingHorizontal: space.md, paddingBottom: 18, gap: space.md }}>
            <Sprout size={74} mood="happy" prop="can" pose="point" />
            {open.map((d) => {
              const a = getAsset(d.symbol);
              return (
                <Pressable
                  key={d.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${a?.name} deal`}
                  onPress={() => {
                    tap();
                    router.push({ pathname: '/deal/[id]', params: { id: d.id } });
                  }}
                  style={{ alignItems: 'center' }}>
                  <Pot stage={growthStage(d, now)} size={64} color={a?.color} glyph={a?.glyph} />
                  <View style={styles.potLabel}>
                    <T v="tiny" color={colors.navy} style={{ fontWeight: '800' }}>
                      {d.endsAt > now ? fmtRelative(d.endsAt, now).replace('in ', '') : 'ended'}
                    </T>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
      <T v="tiny" style={{ marginTop: space.sm }}>
        Plants grow as time passes, not money. Your pay already arrived.
      </T>

      {!checklistDone ? (
        <>
          <SectionTitle title="Getting started" />
          <Card>
            {checklist.map((c, i) => (
              <Pressable
                key={c.label}
                accessibilityRole="button"
                disabled={c.done}
                onPress={() => {
                  tap();
                  c.go();
                }}
                style={[styles.checkRow, i > 0 && { borderTopWidth: 2, borderTopColor: colors.border }]}>
                <View style={[styles.checkDot, c.done && { backgroundColor: colors.sprout }]}>{c.done ? <Icon name="check" size={14} color="#fff" /> : <T v="tiny">{i + 1}</T>}</View>
                <T v={c.done ? 'small' : 'bodyBold'} style={[{ flex: 1 }, c.done && { textDecorationLine: 'line-through' }]}>
                  {c.label}
                </T>
                {!c.done ? <Icon name="chevron" size={18} color={colors.muted} /> : null}
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      {/* Quick start */}
      <SectionTitle title="Start a deal" />
      <Row gap={space.md} center={false}>
        <GoalTile emoji="⬆️" title="Sell High" body="Own something? Get paid to name a higher price." onPress={() => router.push({ pathname: '/(tabs)/earn', params: { goal: 'sell' } })} />
        <GoalTile emoji="⬇️" title="Buy Low" body="Have dollars? Get paid to name a lower price." onPress={() => router.push({ pathname: '/(tabs)/earn', params: { goal: 'buy' } })} />
      </Row>

      {/* Daily */}
      <SectionTitle title="Today" />
      <Card color={checkedIn ? colors.paper : '#FFF6D6'}>
        <Row gap={space.md}>
          <Icon name="gift" size={30} />
          <View style={{ flex: 1 }}>
            <T v="bodyBold">{checkedIn ? `Checked in · ${state.rewards.streak}-day streak 🔥` : 'Daily check-in'}</T>
            <T v="small">{checkedIn ? 'See you tomorrow! Points have no cash value.' : 'Say hi to Sprout for +10 points.'}</T>
          </View>
          {!checkedIn ? <Button small kind="sun" title="Check in" onPress={() => actions.checkIn()} /> : null}
        </Row>
      </Card>
      <Gap />
      <Card>
        <Row gap={space.md} center={false}>
          <Sprout size={54} mood="wink" animate={false} />
          <View style={{ flex: 1 }}>
            <T v="label">Sprout’s tip</T>
            <T v="body">{tip}</T>
          </View>
        </Row>
      </Card>
      <Gap />
      <Card onPress={() => router.push('/learn')} color={colors.blueSoft}>
        <Row gap={space.md}>
          <Icon name="book" size={28} />
          <View style={{ flex: 1 }}>
            <T v="bodyBold">New here? Learn in 60 seconds</T>
            <T v="small" color={colors.ink}>
              Short, friendly lessons. No jargon.
            </T>
          </View>
          <Icon name="chevron" />
        </Row>
      </Card>
    </Screen>
  );
}

function GoalTile({ emoji, title, body, onPress }: { emoji: string; title: string; body: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ flex: 1, padding: space.md, gap: 4 }}>
      <T style={{ fontSize: 26 }}>{emoji}</T>
      <T v="h3">{title}</T>
      <T v="small">{body}</T>
    </Card>
  );
}

const styles = StyleSheet.create({
  jarStats: { flexDirection: 'row', marginTop: space.md, paddingTop: space.md, borderTopWidth: 2, borderTopColor: colors.border },
  garden: { height: 210, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#CFE6F8' },
  bubble: { backgroundColor: colors.paper, borderRadius: radius.md, padding: space.sm },
  potLabel: { marginTop: 2, backgroundColor: colors.paper, borderRadius: 999, paddingHorizontal: 6, borderWidth: 1.5, borderColor: colors.navy },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  checkDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
});
