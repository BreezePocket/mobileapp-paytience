import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/Icon';
import { tap } from '@/components/ui';
import { useStore } from '@/store/app-store';
import { colors, fonts, MAX_WIDTH, sticker } from '@/theme';

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'earn', label: 'Earn', icon: 'earn' },
  { name: 'deals', label: 'Deals', icon: 'deals' },
  { name: 'rewards', label: 'Rewards', icon: 'rewards' },
  { name: 'me', label: 'Me', icon: 'me' },
];

type BarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
};

function TabBar({ state, navigation }: BarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, sticker(4)]}>
        {state.routes.map((route, i) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === i;
          const isEarn = tab.name === 'earn';
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                tap();
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }}
              style={styles.item}>
              <View
                style={[
                  styles.iconWrap,
                  focused && { backgroundColor: isEarn ? colors.coin : colors.blueSoft },
                  isEarn && !focused && { backgroundColor: '#FFF3CC' },
                ]}>
                <Icon name={tab.icon} size={22} color={colors.navy} strokeWidth={focused ? 2.8 : 2.2} />
              </View>
              <Text style={[styles.label, { color: focused ? colors.navy : colors.muted }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { state } = useStore();
  if (!state.onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...(props as unknown as BarProps)} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 6, alignItems: 'center' },
  bar: { flexDirection: 'row', backgroundColor: colors.paper, borderRadius: 26, paddingVertical: 6, paddingHorizontal: 4, width: '100%', maxWidth: MAX_WIDTH },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: { width: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bodyBold, fontSize: 11 },
});
