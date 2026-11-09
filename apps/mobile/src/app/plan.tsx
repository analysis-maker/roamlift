import { setsForWeek } from '@roamlift/core';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Chip, H2, Label, Notice, P, Row, Screen } from '../components/ui';
import { getState, setState, useStore } from '../lib/store';
import { buildPlan } from '../lib/plan';
import { space, useTheme } from '../lib/theme';

export default function PlanScreen() {
  const t = useTheme();
  const plan = useStore((s) => s.plan);
  const week = useStore((s) => s.week);
  const gym = useStore((s) => s.gym);

  if (!plan) {
    return (
      <Screen>
        <P>No plan yet.</P>
        <Button title="Set my goals" onPress={() => router.replace('/goals')} />
      </Screen>
    );
  }

  const rule = plan.weeks[week - 1];
  const dislike = (id: string) => {
    setState((s) => ({ excluded: [...new Set([...s.excluded, id])] }));
    buildPlan(getState().seed);
  };

  return (
    <Screen
      footer={
        <View style={{ gap: space(2) }}>
          <Label>Happy with it?</Label>
          <Row>
            <View style={{ flex: 1 }}><Button title="Yes, let's go" onPress={() => router.push(`/session/${plan.sessions[0].key}`)} /></View>
            <View style={{ flex: 1 }}><Button kind="secondary" title="Shuffle" onPress={() => buildPlan(getState().seed + 1)} /></View>
          </Row>
        </View>
      }
    >
      <View style={{ gap: space(1) }}>
        <H2>{gym?.name ?? 'Your plan'}</H2>
        <P muted small>
          {plan.sessions.length} session{plan.sessions.length > 1 ? 's' : ''}{plan.weeks.length > 1 ? ` a week for ${plan.weeks.length} weeks` : ''}. Tap “Not for me” on any exercise to swap it out for good.
        </P>
      </View>

      {plan.weeks.length > 1 ? (
        <View style={{ gap: space(2) }}>
          <Row wrap>{plan.weeks.map((w) => <Chip key={w.week} label={`Week ${w.week}`} selected={w.week === week} onPress={() => setState({ week: w.week })} />)}</Row>
          {rule ? <Notice><Text style={{ fontWeight: '700' }}>{rule.title}. </Text>{rule.note}</Notice> : null}
        </View>
      ) : null}

      {plan.notes.map((n) => <Notice key={n} tone="warn">{n}</Notice>)}

      {plan.sessions.map((s) => (
        <Card key={s.key}>
          <Row>
            <View style={{ flex: 1 }}><H2>{s.title}</H2></View>
            <P muted small>~{s.estimatedMinutes} min</P>
          </Row>
          {s.exercises.map((e) => (
            <View key={e.exerciseId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: space(2), borderTopWidth: 1, borderTopColor: t.line, gap: space(2) }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontSize: 16, fontWeight: '600' }}>{e.name}</Text>
                <Text style={{ color: t.muted, fontSize: 13 }}>
                  {e.pattern === 'conditioning' ? e.reps : `${setsForWeek(e, rule)} x ${e.reps}`}{e.tempo ? ` · ${e.tempo}` : ''}
                </Text>
                {e.note ? <Text style={{ color: t.warn, fontSize: 12 }}>{e.note}</Text> : null}
              </View>
              <Pressable accessibilityRole="button" onPress={() => dislike(e.exerciseId)} hitSlop={8}>
                <Text style={{ color: t.muted, fontSize: 13, textDecorationLine: 'underline' }}>Not for me</Text>
              </Pressable>
            </View>
          ))}
          <Button kind="secondary" title={`Start ${s.title}`} onPress={() => router.push(`/session/${s.key}`)} />
        </Card>
      ))}
    </Screen>
  );
}
