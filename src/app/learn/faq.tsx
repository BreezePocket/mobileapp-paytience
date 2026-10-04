import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Card, Gap, Header, Row, Screen, SproutSays, T, tap } from '@/components/ui';
import { FAQ } from '@/data/learn';
import { colors, radius, space } from '@/theme';

export default function FaqScreen() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen header={<Header title="Help & FAQ" />}>
      <SproutSays mood="thinking" pose="idle">
        Good questions. Tap one to see the answer.
      </SproutSays>
      <Gap h={space.md} />
      {FAQ.map((f, i) => {
        const isOpen = open === i;
        return (
          <Card key={f.q} style={{ marginBottom: space.md, padding: 0 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => {
                tap();
                setOpen(isOpen ? null : i);
              }}
              style={{ padding: space.lg }}>
              <Row gap={space.md}>
                <T v="bodyBold" style={{ flex: 1 }}>
                  {f.q}
                </T>
                <View style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}>
                  <Icon name="chevron" size={18} color={colors.muted} />
                </View>
              </Row>
              {isOpen ? (
                <T v="body" style={{ marginTop: space.sm }}>
                  {f.a}
                </T>
              ) : null}
            </Pressable>
          </Card>
        );
      })}
      <View style={{ backgroundColor: colors.warnSoft, borderRadius: radius.md, borderWidth: 2, borderColor: colors.navy, padding: space.md, marginTop: space.sm }}>
        <T v="small" color={colors.ink}>
          Upfront pay isn’t guaranteed and prices can move against you. Not financial advice. Only lock what you’re comfortable trading at your price.
        </T>
      </View>
      <Gap h={space.md} />
      <T v="small" center>
        Still stuck? Write to hello@paytience.app
      </T>
    </Screen>
  );
}
