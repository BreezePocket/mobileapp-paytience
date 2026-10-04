import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkyBackground } from '@/components/Art';
import { Icon, IconName } from '@/components/Icon';
import { Sprout, SproutMood, SproutPose, SproutProp } from '@/components/Sprout';
import { useStore } from '@/store/app-store';
import { colors, fonts, MAX_WIDTH, radius, space, sticker } from '@/theme';

export function tap(kind: 'light' | 'medium' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/* ------------------------------------------------------------------ text */

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyBold' | 'small' | 'smallBold' | 'tiny' | 'money' | 'label';
const VARIANTS: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.navy },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.navy },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 27, color: colors.navy },
  h3: { fontFamily: fonts.displayMedium, fontSize: 18, lineHeight: 23, color: colors.navy },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.ink },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.muted },
  smallBold: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 19, color: colors.ink },
  tiny: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted },
  money: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.navy, fontVariant: ['tabular-nums'] },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted },
};

export function T({ v = 'body', color, center, style, ...rest }: TextProps & { v?: Variant; color?: string; center?: boolean }) {
  return <Text {...rest} style={[VARIANTS[v], color ? { color } : null, center ? { textAlign: 'center' } : null, style]} />;
}

/* ---------------------------------------------------------------- layout */

/** One line, only when something is wrong with the live connection. */
function StatusBanner() {
  const { state, actions } = useStore();
  const { status, health } = state.market;
  const msg =
    status === 'offline'
      ? 'Can’t reach PAYtience. Check your connection. Tap to retry.'
      : health && (health.mm_count === 0 || !health.mm_pubkey)
        ? 'Our partners are napping. Look around; offers will be back soon.'
        : health?.dry_run
          ? 'Preview mode: you can see offers but can’t start deals right now.'
          : state.syncError;
  if (!msg) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => actions.refresh()} style={styles.banner}>
      <Text style={styles.bannerText}>{msg}</Text>
    </Pressable>
  );
}


export function Screen({
  children,
  scroll = true,
  floor = false,
  clouds = true,
  padded = true,
  footer,
  header,
  contentStyle,
  tabs = false,
}: {
  tabs?: boolean;
  children: ReactNode;
  scroll?: boolean;
  floor?: boolean;
  clouds?: boolean;
  padded?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const inner = [
    { paddingHorizontal: padded ? space.lg : 0, paddingBottom: tabs ? 120 + insets.bottom : footer ? space.lg : space.xxl + insets.bottom, width: '100%' as const, maxWidth: MAX_WIDTH, alignSelf: 'center' as const },
    contentStyle,
  ];
  return (
    <View style={{ flex: 1, backgroundColor: colors.skyBottom }}>
      <SkyBackground floor={floor} clouds={clouds} />
      <View style={{ paddingTop: insets.top }}>{header}</View>
      <StatusBanner />
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={inner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: insets.bottom + space.md, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

/** Top bar with a back button, title and optional right slot. */
export function Header({ title, right, onBack, close }: { title?: string; right?: ReactNode; onBack?: () => void; close?: boolean }) {
  return (
    <View style={styles.header}>
      <IconButton
        icon={close ? 'close' : 'back'}
        label={close ? 'Close' : 'Back'}
        onPress={() => {
          if (onBack) onBack();
          else if (router.canGoBack()) router.back();
          else router.replace('/');
        }}
      />
      <T v="h3" style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
        {title}
      </T>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function IconButton({ icon, onPress, label, size = 40, bg = colors.paper }: { icon: IconName; onPress: () => void; label: string; size?: number; bg?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      hitSlop={8}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        sticker(pressed ? 0 : 2),
        pressed && { transform: [{ translateY: 2 }] },
      ]}>
      <Icon name={icon} size={size * 0.5} />
    </Pressable>
  );
}

export function Card({ children, style, onPress, color = colors.paper, flat }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; color?: string; flat?: boolean }) {
  const base: StyleProp<ViewStyle> = [{ backgroundColor: color, borderRadius: radius.lg, padding: space.lg }, flat ? { borderWidth: 2, borderColor: colors.navy } : sticker(4), style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [base, pressed && !flat && [sticker(1), { transform: [{ translateY: 3 }] }]]}>
      {children}
    </Pressable>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'sun' | 'danger';
const BTN: Record<ButtonKind, { bg: string; fg: string }> = {
  primary: { bg: colors.blue, fg: '#fff' },
  secondary: { bg: colors.paper, fg: colors.navy },
  sun: { bg: colors.coin, fg: colors.navy },
  ghost: { bg: 'transparent', fg: colors.navy },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const c = BTN[kind];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      disabled={off}
      onPress={() => {
        tap('medium');
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: off && kind !== 'ghost' ? '#C9D6E6' : c.bg },
        kind === 'ghost' ? null : sticker(pressed || off ? 0 : 4),
        pressed && kind !== 'ghost' && { transform: [{ translateY: 4 }] },
        style,
      ]}>
      {loading ? <ActivityIndicator color={c.fg} /> : icon ? <Icon name={icon} size={small ? 16 : 20} color={off ? colors.muted : c.fg} /> : null}
      <Text style={[styles.btnText, small && { fontSize: 15 }, { color: off ? colors.muted : c.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[styles.chip, selected ? { backgroundColor: colors.navy } : { backgroundColor: colors.paper }]}>
      {icon}
      <Text style={[styles.chipText, { color: selected ? '#fff' : colors.navy }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, color = colors.blueSoft, fg = colors.navy, style }: { label: string; color?: string; fg?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Row({ children, gap = space.sm, style, center = true }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; center?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: center ? 'center' : 'flex-start', gap }, style]}>{children}</View>;
}

export function Gap({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

export function Divider() {
  return <View style={{ height: 2, backgroundColor: colors.border, marginVertical: space.md, borderRadius: 1 }} />;
}

/** Sprout with a speech bubble. */
export function SproutSays({
  children,
  mood = 'happy',
  pose = 'idle',
  prop,
  size = 84,
  side = 'left',
}: {
  children: ReactNode;
  mood?: SproutMood;
  pose?: SproutPose;
  prop?: SproutProp;
  size?: number;
  side?: 'left' | 'right';
}) {
  const bubble = (
    <View style={[styles.bubble, sticker(3)]}>
      <View style={[styles.bubbleTail, side === 'left' ? { left: -9 } : { right: -9, transform: [{ rotate: '180deg' }] }]} />
      {typeof children === 'string' ? <T v="body">{children}</T> : children}
    </View>
  );
  return (
    <Row gap={space.sm} style={{ alignItems: 'flex-end' }}>
      {side === 'left' && <Sprout size={size} mood={mood} pose={pose} prop={prop} />}
      <View style={{ flex: 1, marginBottom: size * 0.35 }}>{bubble}</View>
      {side === 'right' && <Sprout size={size} mood={mood} pose={pose} prop={prop} />}
    </Row>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.md }}>
      <T v="h2">{title}</T>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <T v="smallBold" color={colors.blue}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </Row>
  );
}

export function ListRow({ icon, title, subtitle, onPress, right }: { icon?: ReactNode; title: string; subtitle?: string; onPress?: () => void; right?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: colors.skyBottom }]}>
      {icon}
      <View style={{ flex: 1 }}>
        <T v="bodyBold">{title}</T>
        {subtitle ? <T v="small">{subtitle}</T> : null}
      </View>
      {right ?? <Icon name="chevron" size={18} color={colors.muted} />}
    </Pressable>
  );
}

export function ProgressBar({ value, color = colors.sprout, height = 12 }: { value: number; color?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: '#E4EDF5', borderWidth: 2, borderColor: colors.navy, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color, borderRightWidth: value > 0 && value < 1 ? 2 : 0, borderColor: colors.navy }} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.warnSoft, borderBottomWidth: 2, borderTopWidth: 2, borderColor: colors.navy, paddingHorizontal: space.lg, paddingVertical: 6 },
  bannerText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.warn, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  btn: { minHeight: 56, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.xl },
  btnSmall: { minHeight: 42, paddingHorizontal: space.lg },
  btnText: { fontFamily: fonts.display, fontSize: 18 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.navy },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.navy },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11 },
  bubble: { backgroundColor: colors.paper, borderRadius: radius.lg, padding: space.md },
  bubbleTail: { position: 'absolute', bottom: 14, width: 0, height: 0, borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: colors.navy },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.sm, borderRadius: radius.md },
});
