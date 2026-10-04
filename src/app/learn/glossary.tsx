import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card, Gap, Header, Row, Screen, T } from '@/components/ui';
import { EmptyState } from '@/components/widgets';
import { GLOSSARY, TermId } from '@/data/learn';
import { colors, fonts, radius, space, sticker } from '@/theme';

const ENTRIES = (Object.keys(GLOSSARY) as TermId[]).map((id) => ({ id, ...GLOSSARY[id] }));

export default function Glossary() {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ENTRIES;
    return ENTRIES.filter((e) => e.term.toLowerCase().includes(needle) || e.plain.toLowerCase().includes(needle));
  }, [q]);

  return (
    <Screen header={<Header title="Glossary" />}>
      <Row gap={space.sm} style={[{ backgroundColor: colors.paper, borderRadius: radius.pill, paddingHorizontal: space.lg, marginTop: space.sm }, sticker(3)]}>
        <Icon name="search" size={20} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search a word, like “target”"
          placeholderTextColor={colors.faint}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel="Search the glossary"
          style={{ flex: 1, minHeight: 48, fontFamily: fonts.body, fontSize: 16, color: colors.ink }}
        />
      </Row>
      <Gap h={space.lg} />

      {list.length === 0 ? (
        <EmptyState title="No match yet" body="Try a shorter word, or ask us at hello@paytience.app." mood="thinking" />
      ) : (
        list.map((e) => (
          <Card key={e.id} style={{ marginBottom: space.md }}>
            <T v="h3">{e.term}</T>
            <Gap h={space.xs} />
            <T v="body">{e.plain}</T>
            {e.curious ? (
              <View style={{ marginTop: space.sm, backgroundColor: colors.skyBottom, borderRadius: radius.sm, padding: space.sm }}>
                <T v="small">
                  <T v="smallBold">For the curious: </T>
                  {e.curious}
                </T>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
