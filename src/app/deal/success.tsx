import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Coin } from '@/components/Art';
import { Sprout } from '@/components/Sprout';
import { Button, Card, Gap, Row, Screen, T } from '@/components/ui';
import { CoinShower } from '@/components/widgets';
import { getAsset } from '@/data/assets';
import { lockedLabel } from '@/domain/deals';
import { fmtDay, fmtPrice, fmtTime, fmtUsd } from '@/domain/format';
import { useStore } from '@/store/app-store';
import { colors, space, sticker } from '@/theme';

export default function Success() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const deal = state.deals.find((d) => d.id === id);
  const asset = getAsset(deal?.symbol);

  if (!deal || !asset) return <Redirect href="/(tabs)" />;

  return (
    <Screen
      floor
      scroll={false}
      footer={
        <View style={{ gap: space.sm }}>
          <Button title="See my deal" onPress={() => router.replace({ pathname: '/deal/[id]', params: { id: deal.id } })} />
          <Row gap={space.sm}>
            <Button title="Plant another" kind="secondary" style={{ flex: 1 }} onPress={() => router.replace('/(tabs)/earn')} />
            <Button title="Home" kind="secondary" style={{ flex: 1 }} onPress={() => router.replace('/(tabs)')} />
          </Row>
        </View>
      }>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
        <View style={[{ backgroundColor: colors.earnSoft, borderRadius: 999, paddingHorizontal: space.lg, paddingVertical: space.sm }, sticker(3)]}>
          <Row gap={space.sm}>
            <Coin size={26} />
            <T v="h2" color={colors.earn}>
              +{fmtUsd(deal.pay)}
            </T>
          </Row>
        </View>
        <Sprout size={180} mood="excited" pose="cheer" prop="coin" />
        <T v="hero" center>
          Deal on!
        </T>
        <T v="body" center style={{ maxWidth: 330 }}>
          <T v="bodyBold">{fmtUsd(deal.pay)}</T> is already in your wallet. A new sprout is growing in your garden. 🌱
        </T>
        <Card style={{ alignSelf: 'stretch' }}>
          <T v="small">
            {deal.goal === 'sell' ? 'Sell High' : 'Buy Low'} · {asset.name}
          </T>
          <T v="bodyBold">
            Locked {lockedLabel(deal)} · Target {fmtPrice(deal.target)}
          </T>
          <T v="small">
            See you {fmtDay(deal.endsAt)} at {fmtTime(deal.endsAt)}. No action needed until then.
          </T>
        </Card>
      </View>
      <CoinShower />
      <Gap />
    </Screen>
  );
}
