import { useEffect, useState } from 'react';
import { Pressable, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useTheme } from '../lib/theme';

export interface RestState {
  endsAt: number;
  label: string;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;

/** Floating countdown. Uses wall-clock time so it stays right if the app is backgrounded. */
export function RestTimer({ rest, onClose }: { rest: RestState | null; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!rest) return;
    let buzzed = false;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (!buzzed && n >= rest.endsAt) {
        buzzed = true;
        Vibration.vibrate([0, 250, 120, 250]);
      }
    }, 250);
    return () => clearInterval(id);
  }, [rest]);

  if (!rest) return null;
  const left = Math.ceil((rest.endsAt - now) / 1000);
  const done = left <= 0;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute', left: space(4), right: space(4), bottom: Math.max(insets.bottom, space(4)),
        backgroundColor: done ? t.good : t.ink, borderRadius: 16, padding: space(4),
        flexDirection: 'row', alignItems: 'center', gap: space(3),
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.bg, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>{done ? 'Go, next set' : `Rest · ${rest.label}`}</Text>
        <Text style={{ color: t.bg, fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{done ? '0:00' : fmt(left)}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onClose} style={{ borderWidth: 1, borderColor: t.bg, borderRadius: 10, paddingHorizontal: space(4), minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: t.bg, fontWeight: '700' }}>{done ? 'Close' : 'Skip'}</Text>
      </Pressable>
    </View>
  );
}
