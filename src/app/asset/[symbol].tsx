import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Sprout } from '@/components/Sprout';
import { Badge, Button, Card, Gap, Header, Row, Screen, SectionTitle, SproutSays, T } from '@/components/ui';
import { AssetIcon, StateBadge, Term } from '@/components/widgets';
import { getAsset } from '@/data/assets';
import { fmtPrice, fmtUsd } from '@/domain/format';
import { defaultEndDate, endDatesOf, Goal, targetsOf } from '@/domain/pricing';
import { useBoard } from '@/live/boards';
import { useStore } from '@/store/app-store';
import { colors, space } from '@/theme';

export default function AssetDetail() {
  const { symbol, goal: goalParam } = useLocalSearchParams<{ symbol: string; goal?: string }>();
  const asset = getAsset(symbol);
  const { state, actions } = useStore();
  const [goal, setGoal] = useState<Goal>(goalParam === 'sell' ? 'sell' : goalParam === 'buy' ? 'buy' : 'buy');
  const g: Goal = goal === 'buy' && asset && !asset.buyLow ? 'sell' : goal;
  const { board } = useBoard(asset && asset.state !== 'soon' ? asset.symbol : undefined, g);

  if (!asset) {
    return (
      <Screen header={<Header />}>
        <Gap h={60} />
        <SproutSays mood="worried" prop="sweat">
          We couldn’t find that asset. Pull it up from the Earn tab.
        </SproutSays>
      </Screen>
    );
  }

  const notified = state.notifyMe.includes(asset.symbol);
  const canBuy = asset.buyLow;
  // a worked example from the live board: the date nearest a month, the second-closest target
  const end = defaultEndDate(endDatesOf(board));
  const exampleTargets = targetsOf(g, board, end?.ts);
  const example = exampleTargets[1] ?? exampleTargets[0];
  const exampleLock = g === 'sell' ? `$100 of ${asset.name}` : '$100';

  const notifyButtons = (
    <View style={{ gap: space.sm }}>
      <Button title={notified ? 'We’ll let you know ✓' : 'Notify me when it’s live'} kind={notified ? 'secondary' : 'primary'} icon="bell" onPress={() => actions.toggleNotify(asset.symbol)} />
      <Button title="Try it now with Solana" kind="ghost" onPress={() => router.replace({ pathname: '/asset/[symbol]', params: { symbol: 'SOL', goal: g } })} />
    </View>
  );

  if (asset.state === 'soon') {
    return (
      <Screen header={<Header title={asset.name} />} floor footer={notifyButtons}>
        <View style={{ alignItems: 'center', gap: space.md, marginTop: space.xl }}>
          <AssetIcon asset={asset} size={64} />
          <T v="h1" center>
            {asset.name}
          </T>
          <StateBadge asset={asset} />
          <Sprout size={170} mood="happy" pose="point" prop="sign" signText="Soon!" />
          <T v="body" center style={{ maxWidth: 320 }}>
            {asset.name} isn’t available yet. Tap below and we’ll let you know when it is.
          </T>
        </View>
      </Screen>
    );
  }

  const live = asset.state === 'live';

  return (
    <Screen
      header={<Header title={asset.name} />}
      footer={
        live ? (
          <Button
            title={`Continue with ${g === 'sell' ? 'Sell High' : 'Buy Low'}`}
            onPress={() => router.push({ pathname: '/deal/new', params: { symbol: asset.symbol, goal: g } })}
          />
        ) : (
          notifyButtons
        )
      }>
      <Card>
        <Row gap={space.md}>
          <AssetIcon asset={asset} size={56} />
          <View style={{ flex: 1 }}>
            <T v="h2">{asset.name}</T>
            <T v="small">{asset.blurb}</T>
          </View>
        </Row>
        <Gap />
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <T v="tiny">
              <Term id="todays-price" />
            </T>
            <T v="h1">{fmtPrice(asset.price)}</T>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <StateBadge asset={asset} />
            {asset.badge ? <Badge label={asset.badge} color="#F1F4F8" fg={colors.muted} /> : null}
          </View>
        </Row>
        {asset.badge === 'Model estimate' ? (
          <T v="tiny" style={{ marginTop: space.sm }}>
            <Term id="pre-ipo">Pre-IPO</Term>: pay here is a <Term id="model-estimate">model estimate</Term>.
          </T>
        ) : asset.badge === 'Delayed 15 min' ? (
          <T v="tiny" style={{ marginTop: space.sm }}>
            A <Term id="stock-token">stock token</Term>. Prices are <Term id="delayed">delayed up to 15 min</Term>.
          </T>
        ) : null}
      </Card>

      {!live ? (
        <Card color={colors.blueSoft} style={{ marginTop: space.md }}>
          <Row gap={space.sm}>
            <Icon name="info" />
            <T v="small" color={colors.ink} style={{ flex: 1 }}>
              <T v="smallBold">Preview.</T> You can see what you’d get paid, but deals for {asset.name} aren’t open yet.
            </T>
          </Row>
        </Card>
      ) : null}

      <SectionTitle title="What would you like to do?" />
      <View style={{ gap: space.md }}>
        <GoalCard selected={g === 'sell'} onPress={() => setGoal('sell')} emoji="⬆️" title="Sell High" line={`I’d sell my ${asset.name} at a higher price`} />
        {canBuy ? <GoalCard selected={g === 'buy'} onPress={() => setGoal('buy')} emoji="⬇️" title="Buy Low" line={`I’d buy ${asset.name} at a lower price`} /> : null}
      </View>

      {example && end ? (
        <>
          <SectionTitle title="How it works" />
          <Card>
            <T v="body">
              {g === 'sell' ? (
                <>
                  Lock {exampleLock} with a target of <T v="bodyBold">{fmtPrice(example.target)}</T> (today {fmtPrice(asset.price)}).
                </>
              ) : (
                <>
                  Set aside {exampleLock} with a target of <T v="bodyBold">{fmtPrice(example.target)}</T> (today {fmtPrice(asset.price)}).
                </>
              )}
            </T>
            <Gap h={space.sm} />
            <Row gap={space.sm}>
              <T style={{ fontSize: 20 }}>🪙</T>
              <T v="bodyBold" color={colors.earn}>
                You’d get about {fmtUsd(example.pct)} today
              </T>
            </Row>
            <Gap h={space.sm} />
            <T v="small">
              {g === 'sell'
                ? `If ${asset.name} stays under ${fmtPrice(example.target)}, you keep it. If it reaches ${fmtPrice(example.target)} or more, you sell at ${fmtPrice(example.target)}.`
                : `If ${asset.name} stays above ${fmtPrice(example.target)}, your $100 comes back. If it drops to ${fmtPrice(example.target)} or less, you buy at ${fmtPrice(example.target)}.`}{' '}
              The pay is yours either way.
            </T>
          </Card>
        </>
      ) : null}
      <Gap h={space.lg} />
    </Screen>
  );
}

function GoalCard({ selected, onPress, emoji, title, line }: { selected: boolean; onPress: () => void; emoji: string; title: string; line: string }) {
  return (
    <Card onPress={onPress} color={selected ? colors.blueSoft : colors.paper}>
      <Row gap={space.md}>
        <T style={{ fontSize: 28 }}>{emoji}</T>
        <View style={{ flex: 1 }}>
          <T v="h3">{title}</T>
          <T v="small" color={colors.ink}>
            {line}
          </T>
        </View>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            borderWidth: 2,
            borderColor: colors.navy,
            backgroundColor: selected ? colors.blue : colors.paper,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {selected ? <Icon name="check" size={16} color="#fff" /> : null}
        </View>
      </Row>
    </Card>
  );
}
