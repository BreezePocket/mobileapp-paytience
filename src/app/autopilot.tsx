import { Text, View } from 'react-native';

import { Button, Card, Chip, Gap, Header, Row, Screen, SectionTitle, SproutSays, T } from '@/components/ui';
import { AssetIcon } from '@/components/widgets';
import { getAsset } from '@/data/assets';
import { fmtDay } from '@/domain/format';
import { useNow, useStore } from '@/store/app-store';
import { colors, radius, space } from '@/theme';

const DAY = 86_400_000;
const CYCLE_ANCHOR = new Date(2026, 8, 17).getTime(); // cycles every 14 days from here
const CYCLE = 14 * DAY;

type Plan = { key: string; symbol: string; title: string; rate: string; line: string };
const PLANS: Plan[] = [
  { key: 'autopilot:gold', symbol: 'PAXG', title: 'Gold', rate: '~8% a year', line: 'Slow and steady. Gold usually moves gently.' },
  { key: 'autopilot:tesla', symbol: 'TSLAon', title: 'Tesla', rate: '~14% a year', line: 'Bumpier price, so the pay has been bigger.' },
  { key: 'autopilot:hynix', symbol: 'HYNIXon', title: 'SK Hynix', rate: '~12% a year', line: 'Memory chips for the AI boom.' },
];
const SOON = ['WBTC', 'WETH', 'NVDAon', 'AAPLon', 'SPYon', 'XAGon'];

function nextCycle(now: number): number {
  const n = Math.floor((now - CYCLE_ANCHOR) / CYCLE) + 1;
  return CYCLE_ANCHOR + n * CYCLE;
}

function PreviewTag() {
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: colors.warnSoft, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.navy, paddingHorizontal: 8, paddingVertical: 2 }}>
      <T v="tiny" color={colors.warn} style={{ fontWeight: '800' }}>
        Preview · not live yet
      </T>
    </View>
  );
}

export default function Autopilot() {
  const { state, actions } = useStore();
  const now = useNow(60_000);
  const next = nextCycle(now);

  return (
    <Screen header={<Header title="Autopilot" />}>
      <SproutSays mood="thinking" prop="sign" size={80}>
        <T v="bodyBold">Autopilot is a preview.</T>
        <T v="small">Nothing here is live yet. Tap Notify me and I’ll tell you when it opens.</T>
      </SproutSays>

      <SectionTitle title="How it would work" />
      <Card style={{ gap: space.sm }}>
        <Row gap={space.md}>
          <Text style={{ fontSize: 24 }}>🔁</Text>
          <T v="body" style={{ flex: 1 }}>
            Every 14 days, a target 3–7% above today.
          </T>
        </Row>
        <Row gap={space.md}>
          <Text style={{ fontSize: 24 }}>🗓️</Text>
          <T v="body" style={{ flex: 1 }}>
            Next round would start {fmtDay(next)}.
          </T>
        </Row>
        <Row gap={space.md}>
          <Text style={{ fontSize: 24 }}>🧾</Text>
          <T v="body" style={{ flex: 1 }}>
            No deposit or withdrawal fees · 0.5% a year.
          </T>
        </Row>
        <Gap h={space.xs} />
        <T v="label">What to do with the pay</T>
        <View style={{ opacity: 0.5 }} pointerEvents="none" accessibilityState={{ disabled: true }}>
          <Row gap={space.sm}>
            <Chip label="Grow my coins" selected />
            <Chip label="Pay me cash" />
          </Row>
        </View>
        <T v="tiny">Not available in the preview.</T>
      </Card>

      <SectionTitle title="Plans" />
      {PLANS.map((p) => {
        const on = state.notifyMe.includes(p.key);
        return (
          <Card key={p.key} style={{ marginBottom: space.md, gap: space.sm }}>
            <Row gap={space.md}>
              <AssetIcon asset={getAsset(p.symbol)} size={48} />
              <View style={{ flex: 1, gap: 4 }}>
                <T v="h3">{p.title}</T>
                <PreviewTag />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="h3" color={colors.earn}>
                  {p.rate}
                </T>
                <T v="tiny">in past tests</T>
              </View>
            </Row>
            <T v="small">{p.line}</T>
            <Button title={on ? 'We’ll let you know' : 'Notify me'} icon={on ? 'check' : 'bell'} kind={on ? 'secondary' : 'primary'} small onPress={() => actions.toggleNotify(p.key)} />
          </Card>
        );
      })}

      <SectionTitle title="Coming soon" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {SOON.map((sym) => {
          const a = getAsset(sym);
          const key = `autopilot:${sym.toLowerCase()}`;
          const on = state.notifyMe.includes(key);
          return (
            <Card key={sym} flat style={{ width: '47%', flexGrow: 1, alignItems: 'center', gap: 6, padding: space.md }}>
              <AssetIcon asset={a} size={40} />
              <T v="smallBold" center>
                {a?.name ?? sym}
              </T>
              <T v="tiny" center>
                Coming soon · Preview
              </T>
              <Chip label={on ? 'Notifying' : 'Notify me'} selected={on} onPress={() => actions.toggleNotify(key)} />
            </Card>
          );
        })}
      </View>

      <SectionTitle title="Why gold?" />
      <Card style={{ gap: space.sm }}>
        <T v="body">• People have trusted gold for thousands of years.</T>
        <T v="body">• Its price usually moves gently, so surprises are smaller.</T>
        <T v="body">• The pay is smaller than bumpier assets, and that’s the trade-off.</T>
      </Card>

      <SectionTitle title="Is this for me?" />
      <Card style={{ gap: space.sm }}>
        <T v="body">🙂 You already hold gold, stocks or coins and plan to keep them a while.</T>
        <T v="body">🙂 You’d be fine selling a little higher than today.</T>
        <T v="body">🤔 Not for you if you need your money back before the end date.</T>
      </Card>

      <Gap h={space.lg} />
      <T v="small" center>
        Past results don’t predict future results.
      </T>
      <Gap h={space.sm} />
      <T v="tiny" center>
        Upfront pay isn’t guaranteed and prices can move against you. Not financial advice. Only lock what you’re comfortable trading at your price.
      </T>
    </Screen>
  );
}
