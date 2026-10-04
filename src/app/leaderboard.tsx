import { Text, View } from 'react-native';

import { Card, Gap, Header, Screen, T } from '@/components/ui';
import { rankWithYou, LeaderRow } from '@/features/rewards/leaderboard';
import { LeaderLine } from '@/features/rewards/LeaderLine';
import { useStore } from '@/store/app-store';
import { colors, radius, space, sticker } from '@/theme';

const PODIUM = [
  { place: 2, height: 78, color: colors.blueSoft },
  { place: 1, height: 108, color: colors.coin },
  { place: 3, height: 60, color: colors.pink },
];

function Podium({ rows }: { rows: LeaderRow[] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
      {PODIUM.map((p) => {
        const row = rows[p.place - 1];
        if (!row) return <View key={p.place} style={{ flex: 1 }} />;
        return (
          <View key={p.place} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: p.place === 1 ? 40 : 32 }}>{row.emoji}</Text>
            <T v="smallBold" center numberOfLines={1}>
              {row.you ? 'You' : row.name}
            </T>
            <T v="tiny" center>
              {row.points.toLocaleString('en-US')} pts
            </T>
            <View
              style={[
                { width: '100%', height: p.height, backgroundColor: p.color, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
                sticker(3),
                row.you ? { borderWidth: 3 } : null,
              ]}>
              <T v="h1">{p.place}</T>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function Leaderboard() {
  const { state } = useStore();
  const rows = rankWithYou(state.rewards.points);
  const me = rows.find((r) => r.you)!;

  return (
    <Screen
      header={<Header title="Leaderboard" />}
      footer={
        <Card style={{ padding: space.xs }} color={colors.paper}>
          <LeaderLine row={me} highlight />
        </Card>
      }>
      <T v="small" center>
        Other players will appear here when the season opens to everyone. Ranked by points only, never by money or deals.
      </T>
      <Gap h={space.xl} />
      <Podium rows={rows} />
      <Gap h={space.lg} />
      <Card style={{ gap: 2 }}>
        {rows.slice(3).map((row) => (
          <LeaderLine key={row.name + row.rank} row={row} highlight={row.you} />
        ))}
      </Card>
      <Gap h={space.md} />
      <T v="tiny" center>
        Points have no cash value.
      </T>
    </Screen>
  );
}
