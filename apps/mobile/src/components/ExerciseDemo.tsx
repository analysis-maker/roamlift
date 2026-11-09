import { demoFrame, demoFrameAt, frameViewBox, VIEWBOX, type DemoFrame, type Role } from '@roamlift/core';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { space, useTheme, type Theme } from '../lib/theme';

function palette(t: Theme): Record<Role, string> {
  return { floor: t.line, prop: t.muted, cable: t.muted, band: t.good, far: t.muted, body: t.ink, hot: t.accent, weight: t.ink };
}

const FADE: Partial<Record<Role, number>> = { prop: 0.45, far: 0.4, floor: 1 };

function Shapes({ frame, colors }: { frame: DemoFrame; colors: Record<Role, string> }) {
  return (
    <>
      {frame.shapes.map((s, i) => {
        const o = s.o ?? FADE[s.role] ?? 1;
        if (s.k === 'line') return <Line key={i} x1={s.p1[0]} y1={s.p1[1]} x2={s.p2[0]} y2={s.p2[1]} stroke={colors[s.role]} strokeOpacity={o} strokeWidth={s.w} strokeLinecap="round" />;
        if (s.k === 'circle') {
          return s.stroke
            ? <Circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.r} fill="none" stroke={colors[s.role]} strokeOpacity={o} strokeWidth={s.stroke} />
            : <Circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.r} fill={colors[s.role]} fillOpacity={o} />;
        }
        return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={2} fill={colors[s.role]} fillOpacity={o} />;
      })}
    </>
  );
}

/** Small still of the end position, for lists. */
export function DemoThumb({ exerciseId, width = 72 }: { exerciseId: string; width?: number }) {
  const t = useTheme();
  const frame = useMemo(() => demoFrameAt(exerciseId, 1, false), [exerciseId]);
  if (!frame) return null;
  return (
    <View style={{ width, height: width * 0.86, borderRadius: 10, backgroundColor: t.bg, overflow: 'hidden' }} accessible={false}>
      <Svg width="100%" height="100%" viewBox={frameViewBox(frame)}><Shapes frame={frame} colors={palette(t)} /></Svg>
    </View>
  );
}

/**
 * Looping demo of one rep: slow on the lowering half, faster on the lift,
 * working muscles glowing hardest at the hard end. Tap to pause.
 * Starts paused on a still frame when the phone asks for reduced motion.
 */
export function ExerciseDemo({ exerciseId, name }: { exerciseId: string; name: string }) {
  const t = useTheme();
  const [ms, setMs] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => reduce && setPaused(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = 0;
    const start = Date.now() - ms;
    const tick = () => {
      const now = Date.now();
      if (now - last > 33) { last = now; setMs(now - start); } // ~30 fps is plenty and easy on the battery
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, exerciseId]);

  const frame = paused && ms === 0 ? demoFrameAt(exerciseId, 1, false) : demoFrame(exerciseId, ms);
  if (!frame) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name} demonstration. ${paused ? 'Paused, tap to play.' : 'Playing, tap to pause.'}`}
      onPress={() => setPaused((p) => !p)}
      style={{ backgroundColor: t.bg, borderRadius: 12, overflow: 'hidden' }}
    >
      <View style={{ width: '100%', aspectRatio: 200 / 172 }}>
        <Svg width="100%" height="100%" viewBox={VIEWBOX}><Shapes frame={frame} colors={palette(t)} /></Svg>
      </View>
      <View style={{ position: 'absolute', top: space(2), left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
        <Text style={{ color: t.accent, fontWeight: '800', fontSize: 13, letterSpacing: 0.4 }}>{paused ? 'Paused' : frame.label}</Text>
      </View>
      <Text style={{ position: 'absolute', bottom: space(1.5), right: space(2.5), color: t.muted, fontSize: 11 }}>{paused ? 'Tap to play' : 'Tap to pause'}</Text>
    </Pressable>
  );
}
