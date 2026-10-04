import { Text } from 'react-native';

import { Row, T } from '@/components/ui';
import { LeaderRow } from '@/features/rewards/leaderboard';
import { colors, radius, space } from '@/theme';

export function LeaderLine({ row, highlight }: { row: LeaderRow; highlight?: boolean }) {
  return (
    <Row
      gap={space.md}
      style={[
        { paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.md },
        highlight ? { backgroundColor: colors.coin, borderWidth: 2, borderColor: colors.navy } : null,
      ]}>
      <T v="smallBold" style={{ width: 32 }}>
        #{row.rank}
      </T>
      <Text style={{ fontSize: 22 }}>{row.emoji}</Text>
      <T v="bodyBold" style={{ flex: 1 }} numberOfLines={1}>
        {row.name}
      </T>
      <T v="smallBold">{row.points.toLocaleString('en-US')} pts</T>
    </Row>
  );
}
