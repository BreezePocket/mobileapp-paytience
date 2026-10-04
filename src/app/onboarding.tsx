import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { Coin } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { Sprout, SproutMood, SproutPose, SproutProp } from '@/components/Sprout';
import { Button, Card, Gap, Row, Screen, T, tap } from '@/components/ui';
import { Intent, useStore } from '@/store/app-store';
import { colors, space, sticker } from '@/theme';

const SLIDES: { title: string; body: string; mood: SproutMood; pose: SproutPose; prop: SproutProp; example: string }[] = [
  {
    title: 'Name a price',
    body: 'Pick something, and a price you’d be happy to trade it at.',
    mood: 'determined',
    pose: 'point',
    prop: 'none',
    example: '“I’d sell my SOL at $128.”',
  },
  {
    title: 'Get paid today',
    body: 'A partner pays you right away for that promise. The money is yours, whatever happens next.',
    mood: 'excited',
    pose: 'cheer',
    prop: 'coin',
    example: 'You get $4.19 now',
  },
  {
    title: 'Let the market come to you',
    body: 'On the date you chose, you either get back what you locked, or the trade happens at your price.',
    mood: 'happy',
    pose: 'wave',
    prop: 'sparkles',
    example: 'Two endings. Pay kept in both.',
  },
];

const INTENTS: { id: Intent; title: string; body: string; emoji: string }[] = [
  { id: 'sell', title: 'I own crypto or stocks', body: 'I’d sell if the price gets high', emoji: '⬆️' },
  { id: 'buy', title: 'I have dollars', body: 'I’d buy if the price drops', emoji: '⬇️' },
  { id: 'learn', title: 'Just curious', body: 'Show me around first', emoji: '👀' },
];

export default function Onboarding() {
  const { actions } = useStore();
  const [step, setStep] = useState(0); // 0 welcome · 1..3 slides · 4 intent
  const [intent, setIntent] = useState<Intent | null>(null);

  const finish = (i: Intent) => {
    actions.completeOnboarding(i);
    router.replace('/(tabs)');
  };

  if (step === 0) {
    return (
      <Screen scroll={false} floor>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.lg }}>
          <Image source={require('@/assets/images/paytience-wordmark.png')} style={{ width: 240, height: 92 }} resizeMode="contain" accessibilityLabel="PAYtience" />
          <View style={[{ backgroundColor: colors.paper, borderRadius: 20, paddingHorizontal: space.lg, paddingVertical: space.md }, sticker(3)]}>
            <T v="h3" center>
              Hi, I’m Sprout! 🌱
            </T>
            <T v="small" center>
              I help your patience pay.
            </T>
          </View>
          <Sprout size={170} pose="wave" mood="happy" />
        </View>
        <View style={{ paddingBottom: space.xxl, gap: space.md }}>
          <T v="hero" center>
            Get paid while{'\n'}you <T v="hero" color={colors.coinDark}>wait.</T>
          </T>
          <Gap h={space.sm} />
          <Button title="Get started" onPress={() => setStep(1)} />
          <Button title="I’ve used PAYtience before" kind="ghost" onPress={() => finish('learn')} />
        </View>
      </Screen>
    );
  }

  if (step <= SLIDES.length) {
    const s = SLIDES[step - 1];
    return (
      <Screen
        scroll={false}
        floor
        header={
          <Row style={{ justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.sm }}>
            <Dots count={SLIDES.length} active={step - 1} />
            <Pressable onPress={() => setStep(SLIDES.length + 1)} hitSlop={10} accessibilityRole="button">
              <T v="smallBold" color={colors.muted}>
                Skip
              </T>
            </Pressable>
          </Row>
        }
        footer={
          <Row gap={space.md}>
            <Button title="Back" kind="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />
            <Button title="Next" onPress={() => setStep(step + 1)} style={{ flex: 2 }} />
          </Row>
        }>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.lg }}>
          <View style={[{ backgroundColor: colors.paper, borderRadius: 18, paddingHorizontal: space.lg, paddingVertical: space.sm }, sticker(3)]}>
            <Row>
              {step === 2 ? <Coin size={24} /> : null}
              <T v="bodyBold">{s.example}</T>
            </Row>
          </View>
          <Sprout size={180} mood={s.mood} pose={s.pose} prop={s.prop} />
          <T v="h1" center>
            {s.title}
          </T>
          <T v="body" center style={{ maxWidth: 340 }}>
            {s.body}
          </T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <Row style={{ paddingHorizontal: space.lg, paddingVertical: space.sm }}>
          <Pressable onPress={() => setStep(SLIDES.length)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Icon name="back" />
          </Pressable>
        </Row>
      }
      footer={<Button title="Let’s go" disabled={!intent} onPress={() => intent && finish(intent)} />}>
      <Row gap={space.md} style={{ alignItems: 'flex-end' }}>
        <Sprout size={96} mood="thinking" />
        <View style={{ flex: 1, paddingBottom: space.lg }}>
          <T v="h2">Which sounds like you?</T>
          <T v="small">So I can show you the right things first.</T>
        </View>
      </Row>
      <Gap h={space.lg} />
      <View style={{ gap: space.md }}>
        {INTENTS.map((i) => {
          const sel = intent === i.id;
          return (
            <Card
              key={i.id}
              color={sel ? colors.blueSoft : colors.paper}
              onPress={() => {
                tap();
                setIntent(i.id);
              }}>
              <Row gap={space.md}>
                <T style={{ fontSize: 30 }}>{i.emoji}</T>
                <View style={{ flex: 1 }}>
                  <T v="bodyBold">{i.title}</T>
                  <T v="small">{i.body}</T>
                </View>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: colors.navy,
                    backgroundColor: sel ? colors.blue : colors.paper,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {sel ? <Icon name="check" size={16} color="#fff" /> : null}
                </View>
              </Row>
            </Card>
          );
        })}
      </View>
      <Gap h={space.lg} />
      <T v="tiny" center>
        PAYtience is in practice mode: you’ll use free test money with no real value.
      </T>
    </Screen>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <Row gap={6}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 22 : 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: colors.navy,
            backgroundColor: i === active ? colors.blue : colors.paper,
          }}
        />
      ))}
    </Row>
  );
}
