import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Gap, Header, Row, Screen, SproutSays, T, tap } from '@/components/ui';
import { useStore } from '@/store/app-store';
import { colors, radius, space, sticker } from '@/theme';

const CARDS = [
  {
    title: 'You may end up selling or buying',
    body: 'If the price reaches your target, the trade happens at your target. Only pick a price you’re truly happy with.',
  },
  {
    title: 'Your money is locked until the end date',
    body: 'There’s no early exit. That’s what lets partners pay you upfront.',
  },
  {
    title: 'Pay isn’t guaranteed and prices move',
    body: 'Offers change with the market, and what you lock can fall in value. Smart contracts can have bugs too.',
  },
  {
    title: 'Practice money has no value',
    body: 'PAYtience is in practice mode on a test network. It’s a safe place to learn.',
  },
];

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function Primer() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const next = first(params.next);
  const { actions } = useStore();
  const [ticked, setTicked] = useState<boolean[]>(() => CARDS.map(() => false));
  const all = ticked.every(Boolean);
  const count = ticked.filter(Boolean).length;

  const onContinue = () => {
    actions.completePrimer();
    if (next) router.replace(next);
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen
      header={<Header title="Before your first deal" close />}
      footer={<Button title={all ? 'Continue' : `${count} of ${CARDS.length} understood`} disabled={!all} onPress={onContinue} />}>
      <SproutSays mood="determined" pose="point">
        <T v="bodyBold">Four honest things first.</T>
        <T v="small">Tap each card once you’ve got it.</T>
      </SproutSays>
      <Gap h={space.lg} />
      {CARDS.map((c, i) => {
        const on = ticked[i];
        return (
          <View
            key={c.title}
            style={[{ backgroundColor: on ? colors.keepSoft : colors.paper, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md }, sticker(on ? 2 : 4)]}>
            <Row gap={space.sm} center={false}>
              <T v="h3" color={colors.blue}>
                {i + 1}.
              </T>
              <View style={{ flex: 1 }}>
                <T v="h3">{c.title}</T>
                <Gap h={space.xs} />
                <T v="body">{c.body}</T>
              </View>
            </Row>
            <Gap h={space.md} />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => {
                tap();
                setTicked((t) => t.map((x, k) => (k === i ? !x : x)));
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                alignSelf: 'flex-start',
                paddingVertical: space.sm,
                paddingHorizontal: space.md,
                borderRadius: radius.pill,
                borderWidth: 2,
                borderColor: colors.navy,
                backgroundColor: on ? colors.keep : colors.paper,
              }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.navy, backgroundColor: on ? colors.paper : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {on ? <Icon name="check" size={14} /> : null}
              </View>
              <T v="smallBold">I understand</T>
            </Pressable>
          </View>
        );
      })}
    </Screen>
  );
}
