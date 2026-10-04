import { router } from 'expo-router';
import { useState } from 'react';
import { Share, Text, View } from 'react-native';

import { Coin } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { Sprout } from '@/components/Sprout';
import { Badge, Button, Card, Gap, ProgressBar, Row, Screen, SectionTitle, T } from '@/components/ui';
import { rankWithYou } from '@/features/rewards/leaderboard';
import { LeaderLine } from '@/features/rewards/LeaderLine';
import { BADGES, levelFor, LEVELS, useNow, useStore } from '@/store/app-store';
import { colors, fonts, radius, space } from '@/theme';

const WEEK = 7 * 86_400_000;
const SEASONS = ['Dawn', 'Breeze', 'Rainbow', 'Starry'] as const;
// Seasons run 8 weeks each, cycling from this fixed local start (Breeze began Mon 7 Sep 2026).
const SEASON_ANCHOR = new Date(2026, 8, 7).getTime();
const ANCHOR_INDEX = 1;

function seasonAt(now: number) {
  const len = 8 * WEEK;
  const n = Math.floor((now - SEASON_ANCHOR) / len);
  const name = SEASONS[(((ANCHOR_INDEX + n) % SEASONS.length) + SEASONS.length) % SEASONS.length];
  const end = SEASON_ANCHOR + (n + 1) * len;
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86_400_000));
  const done = (now - (end - len)) / len;
  return { name, daysLeft, done };
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const HOW_TO_EARN: { label: string; pts: string; emoji: string }[] = [
  { label: 'Check in each day', pts: '+10', emoji: '📅' },
  { label: 'Finish a Learn lesson', pts: '+20', emoji: '📘' },
  { label: 'Take the quiz (first try)', pts: '+20 a right answer', emoji: '🧠' },
  { label: 'Start your first deal', pts: '+100', emoji: '🌱' },
  { label: 'Hold a deal to its end date', pts: '+50', emoji: '🌼' },
  { label: 'Earn a badge', pts: '+25', emoji: '🏅' },
  { label: 'Invite friends', pts: 'Soon', emoji: '💌' },
];

export default function Rewards() {
  const { state, actions } = useStore();
  const now = useNow(30_000);
  const r = state.rewards;
  const [shareNote, setShareNote] = useState<string | null>(null);

  const { level, next, idx } = levelFor(r.points);
  const levelProgress = next ? (r.points - level.at) / (next.at - level.at) : 1;
  const checkedToday = r.lastCheckIn === dayKey(now);
  const streakAlive = checkedToday || r.lastCheckIn === dayKey(now - 86_400_000);
  const streak = streakAlive ? r.streak : 0;
  const season = seasonAt(now);

  const hasDeal = state.deals.length > 0 || r.badges.includes('first-deal');
  const seed = (state.wallet?.address ?? 'SPROUT').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const code = `SPROUT-${(seed + 'SEED').slice(0, 4)}`;

  const rows = rankWithYou(r.points);
  const me = rows.find((x) => x.you)!;
  const top3 = rows.slice(0, 3);

  const share = async () => {
    const message = `I’m growing my patience with PAYtience. Join me with code ${code} 🌱`;
    try {
      await Share.share({ message });
      setShareNote(null);
    } catch {
      setShareNote(`Sharing isn’t available here. Your code is ${code}.`);
    }
  };

  return (
    <Screen tabs>
      <Gap h={space.lg} />
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="h1">Rewards</T>
        <Badge label="Points have no cash value" color={colors.paper} />
      </Row>
      <Gap h={space.md} />

      {/* season */}
      <Card color={colors.blue}>
        <Row gap={space.md}>
          <Text style={{ fontSize: 34 }}>🍃</Text>
          <View style={{ flex: 1 }}>
            <T v="h3" color="#fff">
              {season.name} Season
            </T>
            <T v="small" color="#EAF2FF">
              Ends in {season.daysLeft} day{season.daysLeft === 1 ? '' : 's'} · points leaderboard resets each season
            </T>
          </View>
        </Row>
        <Gap h={space.sm} />
        <ProgressBar value={season.done} color={colors.coin} height={10} />
      </Card>

      <Gap h={space.lg} />
      {/* level */}
      <Card>
        <Row gap={space.md}>
          <Sprout size={72} mood={idx >= 3 ? 'excited' : 'happy'} prop="sparkles" />
          <View style={{ flex: 1, gap: 4 }}>
            <T v="label">Your level</T>
            <T v="h2">{level.name}</T>
            <Row gap={6}>
              <Coin size={18} />
              <T v="bodyBold">{r.points.toLocaleString('en-US')} points</T>
            </Row>
          </View>
        </Row>
        <Gap h={space.md} />
        <ProgressBar value={levelProgress} />
        <T v="tiny" style={{ marginTop: 6 }}>
          {next ? `${(next.at - r.points).toLocaleString('en-US')} points to ${next.name}` : `You reached ${LEVELS[LEVELS.length - 1].name}, the top level.`}
        </T>
      </Card>

      <Gap h={space.lg} />
      {/* check-in */}
      <Card color={colors.cream}>
        <Row gap={space.md}>
          <Text style={{ fontSize: 34 }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <T v="h3">
              {streak} day{streak === 1 ? '' : 's'} streak
            </T>
            <T v="small">{streak === 0 ? 'Check in today to start your streak.' : 'Resets at local midnight if you miss a day.'}</T>
          </View>
        </Row>
        <Row gap={6} style={{ marginVertical: space.md, justifyContent: 'space-between' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const filled = i < Math.min(7, streak);
            return (
              <View
                key={i}
                style={{ flex: 1, height: 28, borderRadius: 8, borderWidth: 2, borderColor: colors.navy, backgroundColor: filled ? colors.coin : colors.paper, alignItems: 'center', justifyContent: 'center' }}>
                {filled ? <Icon name="check" size={14} /> : <T v="tiny">{i + 1}</T>}
              </View>
            );
          })}
        </Row>
        <Button
          title={checkedToday ? 'Checked in today' : 'Check in · +10'}
          icon={checkedToday ? 'check' : 'sparkle'}
          kind="sun"
          disabled={checkedToday}
          onPress={() => actions.checkIn()}
        />
      </Card>

      <SectionTitle title="How to earn" />
      <Card>
        {HOW_TO_EARN.map((h, i) => (
          <Row key={h.label} gap={space.md} style={{ paddingVertical: space.sm, borderTopWidth: i ? 1 : 0, borderColor: colors.border }}>
            <Text style={{ fontSize: 20 }}>{h.emoji}</Text>
            <T v="body" style={{ flex: 1 }}>
              {h.label}
            </T>
            <Badge label={h.pts} color={h.pts === 'Soon' ? '#EEF1F5' : colors.earnSoft} fg={h.pts === 'Soon' ? colors.muted : colors.earn} />
          </Row>
        ))}
        <T v="tiny" style={{ marginTop: space.sm }}>
          Points reward learning and patience, never how much you trade.
        </T>
      </Card>

      <SectionTitle title="Badges" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {BADGES.map((b) => {
          const got = r.badges.includes(b.id);
          return (
            <View
              key={b.id}
              style={{
                width: '47%',
                flexGrow: 1,
                padding: space.md,
                borderRadius: radius.lg,
                borderWidth: 2,
                borderColor: got ? colors.navy : colors.faint,
                borderStyle: got ? 'solid' : 'dashed',
                backgroundColor: got ? colors.paper : 'rgba(255,255,255,0.5)',
                alignItems: 'center',
                gap: 4,
              }}>
              <Text style={{ fontSize: 30, opacity: got ? 1 : 0.35 }}>{b.emoji}</Text>
              <T v="smallBold" center>
                {b.name}
              </T>
              <T v="tiny" center>
                {got ? 'Earned' : b.how}
              </T>
              {!got ? <Icon name="lock" size={14} color={colors.faint} /> : null}
            </View>
          );
        })}
      </View>

      <SectionTitle title="Invite friends" />
      <Card color={hasDeal ? colors.paper : colors.skyBottom}>
        {hasDeal ? (
          <>
            <T v="small">Share your code. Friends get a warm welcome from Sprout.</T>
            <Gap h={space.sm} />
            <View style={{ borderWidth: 2, borderColor: colors.navy, borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center', backgroundColor: colors.cream }}>
              <Text selectable style={{ fontFamily: fonts.display, fontSize: 24, color: colors.navy, letterSpacing: 2 }}>
                {code}
              </Text>
            </View>
            <Gap h={space.md} />
            <Button title="Share" icon="share" onPress={share} />
            {shareNote ? (
              <T v="tiny" center style={{ marginTop: space.sm }}>
                {shareNote}
              </T>
            ) : null}
          </>
        ) : (
          <Row gap={space.md}>
            <Icon name="lock" size={28} color={colors.muted} />
            <View style={{ flex: 1 }}>
              <T v="bodyBold">Unlocks after your first deal</T>
              <T v="small">Start a deal and your invite code appears here.</T>
            </View>
          </Row>
        )}
      </Card>

      <SectionTitle title="Leaderboard" action="See all" onAction={() => router.push('/leaderboard')} />
      <Card style={{ gap: 2 }}>
        {top3.map((row) => (
          <LeaderLine key={row.name} row={row} highlight={row.you} />
        ))}
        {me.rank > 3 ? (
          <>
            <T v="tiny" center>
              ···
            </T>
            <LeaderLine row={me} highlight />
          </>
        ) : null}
        <T v="tiny" center style={{ marginTop: space.sm }}>
          Ranked by points only.
        </T>
      </Card>
    </Screen>
  );
}
