import type { Focus, Goal, Level, Region } from '@roamlift/core';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button, Chip, Label, P, Row, Screen } from '../components/ui';
import { buildPlan } from '../lib/plan';
import { setState, useStore, type Profile } from '../lib/store';
import { space } from '../lib/theme';

const GOALS: [Goal, string][] = [['general', 'Stay fit'], ['muscle', 'Build muscle'], ['strength', 'Get stronger'], ['fat_loss', 'Lose fat']];
const LEVELS: [Level, string][] = [[1, 'New to lifting'], [2, 'Some experience'], [3, 'Experienced']];
const MINUTES = [20, 30, 45, 60, 75];
const LENGTHS: [number, string][] = [[0, 'Just today'], [1, '1 week'], [2, '2 weeks'], [4, '4 weeks'], [6, '6 weeks']];
const DAYS = [2, 3, 4, 5, 6];
const FOCUS: [Focus, string][] = [['balanced', 'Balanced'], ['upper', 'Upper body'], ['lower', 'Legs'], ['glutes', 'Glutes'], ['arms_shoulders', 'Arms and shoulders']];
const AREAS: [Region, string][] = [['knee', 'Knees'], ['lower_back', 'Lower back'], ['shoulder', 'Shoulders'], ['wrist', 'Wrists'], ['elbow', 'Elbows'], ['hip', 'Hips']];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: space(2) }}>
      <Label>{title}</Label>
      <Row wrap>{children}</Row>
    </View>
  );
}

export default function Goals() {
  const p = useStore((s) => s.profile);
  const set = (patch: Partial<Profile>) => setState((s) => ({ profile: { ...s.profile, ...patch } }));
  const singleSession = p.weeks === 0;

  return (
    <Screen footer={<Button title="Build my plan" onPress={() => { buildPlan(); router.push('/plan'); }} />}>
      <Group title="Goal">{GOALS.map(([v, l]) => <Chip key={v} label={l} selected={p.goal === v} onPress={() => set({ goal: v })} />)}</Group>
      <Group title="Experience">{LEVELS.map(([v, l]) => <Chip key={v} label={l} selected={p.level === v} onPress={() => set({ level: v })} />)}</Group>
      <Group title="Minutes per session">{MINUTES.map((m) => <Chip key={m} label={`${m}`} selected={p.minutes === m} onPress={() => set({ minutes: m })} />)}</Group>
      <Group title="How long">{LENGTHS.map(([v, l]) => <Chip key={v} label={l} selected={p.weeks === v} onPress={() => set({ weeks: v })} />)}</Group>
      {!singleSession ? (
        <Group title="Days per week">{DAYS.map((d) => <Chip key={d} label={`${d}`} selected={p.daysPerWeek === d} onPress={() => set({ daysPerWeek: d })} />)}</Group>
      ) : null}
      {singleSession || p.daysPerWeek <= 2 ? (
        <Group title="Focus">{FOCUS.map(([v, l]) => <Chip key={v} label={l} selected={p.focus === v} onPress={() => set({ focus: v })} />)}</Group>
      ) : null}
      <Group title="Go easy on">
        {AREAS.map(([v, l]) => (
          <Chip key={v} label={l} selected={p.avoid.includes(v)} onPress={() => set({ avoid: p.avoid.includes(v) ? p.avoid.filter((a) => a !== v) : [...p.avoid, v] })} />
        ))}
      </Group>
      <P muted small>Roamlift gives general fitness guidance, not medical advice. If something hurts, stop and see a professional.</P>
    </Screen>
  );
}
