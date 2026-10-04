import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Badge, Card, Gap, Header, Row, Screen, SectionTitle, SproutSays, T } from '@/components/ui';
import { LESSONS, QUIZ } from '@/data/learn';
import { useStore } from '@/store/app-store';
import { colors, radius, space } from '@/theme';

const RISK_ID = 'what-can-go-wrong';

export default function LearnHub() {
  const { state } = useStore();
  const done = state.rewards.lessonsDone;
  const quizBest = state.rewards.quizBest;
  const doneCount = LESSONS.filter((l) => done.includes(l.id)).length;

  return (
    <Screen header={<Header title="Learn" />}>
      <SproutSays mood="happy" pose="point" prop="sparkles">
        <T v="bodyBold">Little lessons, one minute each.</T>
        <T v="small">Take your time. Every lesson you finish earns 20 points.</T>
      </SproutSays>

      <Row style={{ justifyContent: 'space-between', marginTop: space.lg }}>
        <T v="label">Lessons</T>
        <T v="smallBold" color={colors.muted}>
          {doneCount}/{LESSONS.length} done
        </T>
      </Row>
      <Gap h={space.sm} />

      {LESSONS.map((l) => {
        const isDone = done.includes(l.id);
        const risk = l.id === RISK_ID;
        return (
          <Card
            key={l.id}
            color={risk ? colors.warnSoft : colors.paper}
            onPress={() => router.push({ pathname: '/learn/[lesson]', params: { lesson: l.id } })}
            style={{ marginBottom: space.md }}>
            <Row gap={space.md}>
              <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: risk ? colors.coin : colors.blueSoft, borderWidth: 2, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                <T v="h2">{l.emoji}</T>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                {risk ? <Badge label="Read this first" color={colors.coin} /> : null}
                <T v="bodyBold">{l.title}</T>
                <T v="small">
                  {l.minutes} min · {l.cards.length} cards
                </T>
              </View>
              {isDone ? (
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sprout, borderWidth: 2, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={16} color="#fff" />
                  </View>
                  <T v="tiny">Done</T>
                </View>
              ) : (
                <Badge label="+20 pts" color={colors.earnSoft} fg={colors.earn} />
              )}
            </Row>
          </Card>
        );
      })}

      <SectionTitle title="Look things up" />
      <Card onPress={() => router.push('/learn/quiz')} color={colors.cream} style={{ marginBottom: space.md }}>
        <Row gap={space.md}>
          <Icon name="sparkle" size={28} color={colors.blue} />
          <View style={{ flex: 1 }}>
            <T v="bodyBold">Quick quiz</T>
            <T v="small">
              {QUIZ.length} questions · {quizBest == null ? 'up to +60 pts' : `Best score ${quizBest}/${QUIZ.length}`}
            </T>
          </View>
          {quizBest == null ? <Badge label="+pts" color={colors.earnSoft} fg={colors.earn} /> : <Icon name="chevron" size={18} color={colors.muted} />}
        </Row>
      </Card>
      <Card onPress={() => router.push('/learn/glossary')} style={{ marginBottom: space.md }}>
        <Row gap={space.md}>
          <Icon name="book" size={28} color={colors.blue} />
          <View style={{ flex: 1 }}>
            <T v="bodyBold">Glossary</T>
            <T v="small">Every word we use, in plain English.</T>
          </View>
          <Icon name="chevron" size={18} color={colors.muted} />
        </Row>
      </Card>
      <Card onPress={() => router.push('/learn/faq')} style={{ marginBottom: space.md }}>
        <Row gap={space.md}>
          <Icon name="info" size={28} color={colors.blue} />
          <View style={{ flex: 1 }}>
            <T v="bodyBold">Questions & answers</T>
            <T v="small">Can I lose money? Can I cancel? Is this real?</T>
          </View>
          <Icon name="chevron" size={18} color={colors.muted} />
        </Row>
      </Card>
    </Screen>
  );
}
