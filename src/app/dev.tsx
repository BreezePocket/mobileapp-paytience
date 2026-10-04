import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Platform, View } from 'react-native';

import { Sprout, SproutMood, SproutPose, SproutProp } from '@/components/Sprout';
import { Button, Card, Gap, Header, Screen, SectionTitle, T } from '@/components/ui';
import { fmtDayTime } from '@/domain/format';
import { API_URL, RPC_URL } from '@/live/config';
import { useNow, useStore } from '@/store/app-store';
import { colors, radius, space } from '@/theme';



const MOODS: SproutMood[] = ['happy', 'excited', 'laugh', 'worried', 'determined', 'sleepy', 'wink', 'thinking'];
const POSES: SproutPose[] = ['idle', 'wave', 'cheer', 'point', 'hold'];
const PROPS: SproutProp[] = ['none', 'coin', 'sign', 'wand', 'sweat', 'zzz', 'sparkles', 'can'];


function confirm(title: string, msg: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${msg}`)) onYes();
    return;
  }
  Alert.alert(title, msg, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reset', style: 'destructive', onPress: onYes },
  ]);
}

function Tile({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={{ width: '25%', padding: 4 }}>
      <View style={{ backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', paddingVertical: space.sm }}>
        {children}
        <T v="tiny" numberOfLines={1}>
          {label}
        </T>
      </View>
    </View>
  );
}

export default function Dev() {
  const { state, actions } = useStore();
  const now = useNow(1000);

  return (
    <Screen header={<Header title="Dev menu" />}>
      <Card color={colors.warnSoft}>
        <T v="label">Hidden dev menu</T>
        <T v="small">Live data: the PAYtience backend and Solana devnet.</T>
      </Card>

      <SectionTitle title="Connection" />
      <Card>
        <T v="small">Backend: {API_URL}</T>
        <T v="small">
          Status: {state.market.status}
          {state.market.health ? ` · v${state.market.health.version ?? '?'} · ${state.market.health.assets?.length ?? 0} assets${state.market.health.dry_run ? ' · dry run' : ''}` : ''}
        </T>
        <T v="small">Last update: {state.market.updatedAt ? fmtDayTime(state.market.updatedAt) : '—'}</T>
        <T v="small">Solana RPC: {RPC_URL}</T>
        <T v="small">Device clock: {fmtDayTime(now)}</T>
        {state.syncError ? <T v="small" color={colors.danger}>{state.syncError}</T> : null}
        <Gap />
        <Button title="Refresh now" small kind="secondary" onPress={() => actions.refresh()} />
      </Card>

      <SectionTitle title="Data" />
      <Card>
        <T v="small">
          Deals: {state.deals.length} · USDC {state.balances.usdc.toFixed(2)} · tokens {JSON.stringify(state.balances.tokens)}
        </T>
        <T v="small" selectable>
          Wallet: {state.wallet ? state.wallet.address : 'none'} · primer {state.primerDone ? 'done' : 'not done'} · onboarded {state.onboarded ? 'yes' : 'no'}
        </T>
        <T v="small">Points: {state.rewards.points} · lessons {state.rewards.lessonsDone.length} · quiz best {state.rewards.quizBest ?? '—'}</T>
        <Gap />
        <Button
          title="Reset everything"
          kind="danger"
          onPress={() =>
            confirm('Reset everything?', 'Clears rewards, onboarding and notes on this device. Your wallet and its deals on Solana stay.', () => {
              actions.reset();
              router.replace('/');
            })
          }
        />
      </Card>

      <SectionTitle title="Sprout moods × poses" />
      {POSES.map((pose) => (
        <View key={pose} style={{ marginBottom: space.md }}>
          <T v="label">pose: {pose}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {MOODS.map((mood) => (
              <Tile key={mood} label={mood}>
                <Sprout size={64} mood={mood} pose={pose} animate={false} />
              </Tile>
            ))}
          </View>
        </View>
      ))}

      <SectionTitle title="Sprout props" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
        {PROPS.map((prop) => (
          <Tile key={prop} label={prop}>
            <Sprout size={64} mood="happy" pose={prop === 'coin' || prop === 'can' ? 'hold' : prop === 'sign' ? 'point' : 'idle'} prop={prop} signText="Soon!" animate={false} />
          </Tile>
        ))}
      </View>
    </Screen>
  );
}
