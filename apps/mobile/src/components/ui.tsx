import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useTheme } from '../lib/theme';

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(footer ? 28 : 10), gap: space(4) }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space(4), paddingBottom: Math.max(insets.bottom, space(4)), backgroundColor: t.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function H1({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontSize: 28, fontWeight: '800', color: t.ink, letterSpacing: -0.5 }}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink }}>{children}</Text>;
}

export function P({ children, muted, small }: { children: ReactNode; muted?: boolean; small?: boolean }) {
  const t = useTheme();
  return <Text style={{ fontSize: small ? 13 : 15, lineHeight: small ? 18 : 21, color: muted ? t.muted : t.ink }}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontSize: 12, fontWeight: '700', color: t.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{children}</Text>;
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme();
  const base: ViewStyle = { backgroundColor: t.card, borderRadius: 14, padding: space(4), gap: space(2), borderWidth: StyleSheet.hairlineWidth, borderColor: t.line };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [base, style, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Button({ title, onPress, kind = 'primary', busy, disabled }: { title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'quiet'; busy?: boolean; disabled?: boolean }) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.accent : kind === 'secondary' ? t.card : 'transparent';
  const fg = kind === 'primary' ? t.onAccent : t.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderRadius: 12,
        minHeight: 50,
        paddingHorizontal: space(4),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: kind === 'secondary' ? 1 : 0,
        borderColor: t.line,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      {busy ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontSize: 16, fontWeight: '700' }}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: space(3.5),
        minHeight: 40,
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: selected ? t.ink : t.card,
        borderWidth: 1,
        borderColor: selected ? t.ink : t.line,
      }}
    >
      <Text style={{ color: selected ? t.bg : t.ink, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, wrap, gap = 2 }: { children: ReactNode; wrap?: boolean; gap?: number }) {
  return <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap: space(gap), alignItems: 'center' }}>{children}</View>;
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.accentSoft, borderRadius: 12, padding: space(3), borderLeftWidth: 4, borderLeftColor: tone === 'warn' ? t.warn : t.accent }}>
      <P small>{children}</P>
    </View>
  );
}
