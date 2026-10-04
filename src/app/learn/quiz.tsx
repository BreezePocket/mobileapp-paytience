import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Sprout, SproutMood } from '@/components/Sprout';
import { Badge, Button, Card, Gap, Header, ProgressBar, Row, Screen, T, tap } from '@/components/ui';
import { CoinShower } from '@/components/widgets';
import { QUIZ } from '@/data/learn';
import { useStore } from '@/store/app-store';
import { colors, radius, space, sticker } from '@/theme';

export default function Quiz() {
  const { state, actions } = useStore();
  const [awarded, setAwarded] = useState(0);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = QUIZ.length;

  if (done) {
    const perfect = score === total;
    return (
      <View style={{ flex: 1 }}>
        <Screen
          header={<Header title="Quiz" />}
          contentStyle={{ alignItems: 'center', paddingTop: space.lg }}
          footer={
            <View style={{ gap: space.sm }}>
              <Button
                title="Try again"
                kind="secondary"
                onPress={() => {
                  setI(0);
                  setPicked(null);
                  setScore(0);
                  setAwarded(0);
                  setDone(false);
                }}
              />
              <Button title="Back to Learn" onPress={() => (router.canGoBack() ? router.back() : router.replace('/learn'))} />
            </View>
          }>
          <Sprout size={170} mood={perfect ? 'excited' : score > 0 ? 'happy' : 'thinking'} pose={perfect ? 'cheer' : 'idle'} prop={perfect ? 'sparkles' : 'none'} />
          <Gap h={space.lg} />
          <T v="label">Your score</T>
          <T v="money">
            {score}/{total}
          </T>
          <Gap h={space.sm} />
          <T v="body" center>
            {perfect ? 'Every answer right. You really get it!' : score > 0 ? 'Nice work. Have another go any time.' : 'No worries. The lessons make it click.'}
          </T>
          <Gap h={space.md} />
          {awarded > 0 ? <Badge label={`+${awarded} pts`} color={colors.earnSoft} fg={colors.earn} style={{ alignSelf: 'center' }} /> : null}
          {perfect ? <Badge label="Quiz Whiz badge" color={colors.coin} style={{ alignSelf: 'center', marginTop: space.sm }} /> : null}
        </Screen>
        {perfect ? <CoinShower count={14} /> : null}
      </View>
    );
  }

  const item = QUIZ[i];
  const answered = picked != null;
  const right = answered && picked === item.answer;
  const mood: SproutMood = !answered ? 'thinking' : right ? 'excited' : 'worried';
  const last = i >= total - 1;

  const pick = (k: number) => {
    if (answered) return;
    setPicked(k);
    if (k === item.answer) {
      tap('success');
      setScore((s) => s + 1);
    } else {
      tap('medium');
    }
  };

  const next = () => {
    if (last) {
      const first = state.rewards.quizBest == null;
      actions.finishQuiz(score);
      setAwarded(first ? score * 20 : 0);
      setDone(true);
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };

  return (
    <Screen
      header={<Header title="Quiz" />}
      footer={answered ? <Button title={last ? 'See my score' : 'Next question'} onPress={next} /> : null}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="label">
          Question {i + 1} of {total}
        </T>
        <T v="smallBold">{score} right</T>
      </Row>
      <Gap h={space.sm} />
      <ProgressBar value={(i + (answered ? 1 : 0)) / total} color={colors.blue} />
      <Gap h={space.lg} />
      <Row gap={space.md} style={{ alignItems: 'flex-end' }}>
        <Sprout size={96} mood={mood} pose={right ? 'cheer' : 'idle'} prop={answered && !right ? 'sweat' : 'none'} />
        <T v="h3" style={{ flex: 1, marginBottom: space.lg }}>
          {item.q}
        </T>
      </Row>
      <Gap h={space.md} />
      {item.options.map((opt, k) => {
        const isPicked = picked === k;
        const isAnswer = k === item.answer;
        const bg = !answered ? colors.paper : isAnswer ? colors.earnSoft : isPicked ? colors.swapSoft : colors.paper;
        return (
          <Pressable
            key={opt}
            accessibilityRole="button"
            accessibilityState={{ disabled: answered, selected: isPicked }}
            onPress={() => pick(k)}
            style={({ pressed }) => [
              { backgroundColor: bg, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
              sticker(pressed && !answered ? 1 : 3),
              answered && !isAnswer && !isPicked && { opacity: 0.55 },
            ]}>
            <T v="bodyBold" style={{ flex: 1 }}>
              {opt}
            </T>
            {answered && isAnswer ? <Icon name="check" size={22} color={colors.earn} /> : null}
            {answered && isPicked && !isAnswer ? <Icon name="close" size={22} color={colors.pinkDeep} /> : null}
          </Pressable>
        );
      })}
      {answered ? (
        <Card color={right ? colors.earnSoft : colors.warnSoft} style={{ marginTop: space.sm }}>
          <T v="bodyBold">{right ? 'That’s right!' : 'Not quite.'}</T>
          <T v="body">{item.why}</T>
        </Card>
      ) : null}
    </Screen>
  );
}
