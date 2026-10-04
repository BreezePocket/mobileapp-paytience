import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Sprout } from '@/components/Sprout';
import { Badge, Button, Card, Gap, Header, Row, Screen, T, tap } from '@/components/ui';
import { CoinShower, EmptyState } from '@/components/widgets';
import { LESSONS } from '@/data/learn';
import { useStore } from '@/store/app-store';
import { colors, space } from '@/theme';

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function LessonPlayer() {
  const params = useLocalSearchParams<{ lesson?: string | string[] }>();
  const id = first(params.lesson);
  const lesson = LESSONS.find((l) => l.id === id);
  const { state, actions } = useStore();
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);
  const [alreadyDone] = useState(() => !!id && state.rewards.lessonsDone.includes(id));

  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/learn');
    }, 2200);
    return () => clearTimeout(t);
  }, [finished]);

  if (!lesson) {
    return (
      <Screen header={<Header title="Learn" />}>
        <EmptyState title="Lesson not found" body="Even our patience couldn’t find this one." cta="Back to Learn" onCta={() => router.replace('/learn')} mood="thinking" />
      </Screen>
    );
  }

  const total = lesson.cards.length;
  const card = lesson.cards[Math.min(i, total - 1)];
  const last = i >= total - 1;

  const finish = () => {
    if (finished) return;
    actions.completeLesson(lesson.id);
    tap('success');
    setFinished(true);
  };

  if (finished) {
    return (
      <View style={{ flex: 1 }}>
        <Screen header={<Header title={lesson.title} />} contentStyle={{ alignItems: 'center', paddingTop: space.xl }}>
          <Sprout size={170} mood="excited" pose="cheer" prop="sparkles" />
          <Gap h={space.lg} />
          <T v="h1" center>
            Lesson done!
          </T>
          <Gap h={space.sm} />
          <T v="body" center>
            {alreadyDone ? 'Nice refresher. You already earned points for this one.' : 'You earned 20 points. Heading back to Learn…'}
          </T>
          {!alreadyDone ? <Badge label="+20 pts" color={colors.earnSoft} fg={colors.earn} style={{ alignSelf: 'center', marginTop: space.md }} /> : null}
        </Screen>
        <CoinShower count={12} />
      </View>
    );
  }

  return (
    <Screen
      header={<Header title={lesson.title} />}
      footer={
        <Row gap={space.md}>
          <Button title="Back" kind="secondary" disabled={i === 0} onPress={() => setI((x) => Math.max(0, x - 1))} style={{ flex: 1 }} />
          <Button title={last ? 'Finish' : 'Next'} kind={last ? 'sun' : 'primary'} onPress={() => (last ? finish() : setI((x) => Math.min(total - 1, x + 1)))} style={{ flex: 2 }} />
        </Row>
      }>
      <View accessibilityLabel={`Card ${i + 1} of ${total}`} style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: space.sm }}>
        {lesson.cards.map((_, k) => (
          <View
            key={k}
            style={{
              width: k === i ? 22 : 10,
              height: 10,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: colors.navy,
              backgroundColor: k <= i ? colors.blue : colors.paper,
            }}
          />
        ))}
      </View>
      <Gap h={space.lg} />
      <Card style={{ alignItems: 'center', paddingVertical: space.xl }}>
        <Sprout key={i} size={150} mood={card.mood ?? 'happy'} pose={card.mood === 'excited' ? 'cheer' : card.mood === 'thinking' ? 'idle' : 'point'} />
        <Gap h={space.md} />
        <T v="label">
          {i + 1} of {total}
        </T>
        <Gap h={space.xs} />
        <T v="h2" center>
          {card.title}
        </T>
        <Gap h={space.sm} />
        <T v="body" center>
          {card.body}
        </T>
      </Card>
    </Screen>
  );
}
