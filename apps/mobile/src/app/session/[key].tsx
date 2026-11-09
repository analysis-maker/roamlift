import { demoVideoUrl, getExercise, getSwaps, setsForWeek, type PlannedExercise } from '@roamlift/core';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { DemoThumb, ExerciseDemo } from '../../components/ExerciseDemo';
import { RestTimer, type RestState } from '../../components/RestTimer';
import { Button, Card, H2, Label, Notice, P, Row, Screen } from '../../components/ui';
import { setState, useStore, type SetLog } from '../../lib/store';
import { space, useTheme } from '../../lib/theme';

export default function SessionScreen() {
  const t = useTheme();
  const { key } = useLocalSearchParams<{ key: string }>();
  const plan = useStore((s) => s.plan);
  const week = useStore((s) => s.week);
  const gym = useStore((s) => s.gym);
  const profile = useStore((s) => s.profile);
  const logs = useStore((s) => s.logs);
  const order = useStore((s) => s.sessionOrder);
  const [rest, setRest] = useState<RestState | null>(null);
  // undefined = nothing chosen yet, so the first exercise starts open.
  const [open, setOpen] = useState<string | null | undefined>(undefined);
  const [swapFor, setSwapFor] = useState<PlannedExercise | null>(null);

  const session = plan?.sessions.find((s) => s.key === key);
  if (!plan || !session) {
    return <Screen><P>That session isn't in your current plan.</P><Button title="Home" onPress={() => router.replace('/')} /></Screen>;
  }

  const rule = plan.weeks[week - 1];
  const dayKey = `${week}:${session.key}`;
  const list = order[dayKey] ?? session.exercises;
  const setList = (next: PlannedExercise[]) => setState((s) => ({ sessionOrder: { ...s.sessionOrder, [dayKey]: next } }));
  const logKey = (e: PlannedExercise) => `${dayKey}:${e.exerciseId}`;
  const updateLog = (e: PlannedExercise, patch: Partial<SetLog>) =>
    setState((s) => ({ logs: { ...s.logs, [logKey(e)]: { ...{ done: [] as boolean[] }, ...s.logs[logKey(e)], ...patch } } }));
  const lastWeek = (e: PlannedExercise) => logs[`${week - 1}:${session.key}:${e.exerciseId}`];

  const tapSet = (e: PlannedExercise, i: number) => {
    const done = [...(logs[logKey(e)]?.done ?? [])];
    done[i] = !done[i];
    updateLog(e, { done });
    if (done[i] && e.restSec > 0) setRest({ endsAt: Date.now() + e.restSec * 1000, label: e.name });
  };

  const doLater = (e: PlannedExercise) => setList([...list.filter((x) => x !== e), e]);

  const applySwap = (from: PlannedExercise, toId: string) => {
    const ex = getExercise(toId);
    setList(list.map((x) => (x === from ? { ...x, exerciseId: ex.id, name: ex.name, pattern: ex.pattern, note: `Swapped in for ${from.name} today.` } : x)));
    setSwapFor(null);
  };

  const swaps = swapFor
    ? getSwaps({ exerciseId: swapFor.exerciseId, kit: gym?.kit ?? [], level: profile.level, avoid: profile.avoid, inSession: list.map((x) => x.exerciseId) })
    : [];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: session.title }} />
      <Screen>
        {plan.weeks.length > 1 && rule ? <Notice><Text style={{ fontWeight: '700' }}>Week {week}: {rule.title}. </Text>{rule.note}</Notice> : null}
        <P muted small>Warm up 5 minutes, then one light practice set before the first big lift. Tap a set when it's done to start your rest.</P>

        {list.map((e) => {
          const ex = getExercise(e.exerciseId);
          const sets = setsForWeek(e, rule);
          const log = logs[logKey(e)];
          const prev = lastWeek(e);
          const expanded = (open === undefined ? list[0]?.exerciseId : open) === e.exerciseId;
          return (
            <Card key={e.exerciseId}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityHint="Shows the demo and form cues" onPress={() => setOpen(expanded ? null : e.exerciseId)}
                style={{ flexDirection: 'row', gap: space(3), alignItems: 'center' }}>
                {!expanded ? <DemoThumb exerciseId={e.exerciseId} /> : null}
                <View style={{ flex: 1 }}>
                  <H2>{e.name}</H2>
                  <P muted small>
                    {e.pattern === 'conditioning' ? e.reps : `${sets} sets x ${e.reps}`}{e.restSec ? ` · rest ${e.restSec}s` : ''}{e.tempo ? ` · ${e.tempo}` : ''}
                  </P>
                  {e.note ? <Text style={{ color: t.warn, fontSize: 12 }}>{e.note}</Text> : null}
                  {!expanded ? <Text style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>Tap for demo and cues</Text> : null}
                </View>
              </Pressable>

              {expanded ? (
                <View style={{ gap: space(1), paddingVertical: space(1) }}>
                  <ExerciseDemo exerciseId={e.exerciseId} name={e.name} />
                  {ex.cues.map((c) => <P key={c} small>• {c}</P>)}
                  <P muted small>Works: {ex.muscles.join(', ')}</P>
                </View>
              ) : null}

              {e.pattern !== 'conditioning' ? (
                <Row wrap>
                  {Array.from({ length: sets }, (_, i) => {
                    const on = !!log?.done?.[i];
                    return (
                      <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`Set ${i + 1}`} onPress={() => tapSet(e, i)}
                        style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.accent : 'transparent', borderWidth: 2, borderColor: on ? t.accent : t.line }}>
                        <Text style={{ color: on ? t.onAccent : t.ink, fontWeight: '800' }}>{on ? '✓' : i + 1}</Text>
                      </Pressable>
                    );
                  })}
                </Row>
              ) : (
                <Button kind="secondary" title={log?.done?.[0] ? 'Done ✓' : 'Mark done'} onPress={() => updateLog(e, { done: [!log?.done?.[0]] })} />
              )}

              {e.pattern !== 'conditioning' ? (
                <Row>
                  <View style={{ flex: 1 }}>
                    <Label>Weight used</Label>
                    <TextInput
                      value={log?.weight ?? ''}
                      onChangeText={(v) => updateLog(e, { weight: v })}
                      placeholder={prev?.weight ? `Last week ${prev.weight}` : 'e.g. 12 kg or pin 5'}
                      placeholderTextColor={t.muted}
                      style={{ color: t.ink, borderBottomWidth: 1, borderBottomColor: t.line, paddingVertical: space(2), fontSize: 16 }}
                    />
                  </View>
                </Row>
              ) : null}

              <Row wrap gap={4}>
                <Pressable accessibilityRole="button" onPress={() => setSwapFor(e)} hitSlop={8}><Text style={{ color: t.ink, fontWeight: '700' }}>Machine taken?</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => doLater(e)} hitSlop={8}><Text style={{ color: t.muted }}>Do later</Text></Pressable>
                <Pressable accessibilityRole="link" onPress={() => Linking.openURL(demoVideoUrl(ex))} hitSlop={8}><Text style={{ color: t.muted }}>Watch demo</Text></Pressable>
              </Row>
            </Card>
          );
        })}

        <Button title="Finish workout" onPress={() => router.replace('/')} />
        <View style={{ height: 96 }} />
      </Screen>

      <RestTimer rest={rest} onClose={() => setRest(null)} />

      <Modal visible={!!swapFor} animationType="slide" transparent onRequestClose={() => setSwapFor(null)}>
        <Pressable style={{ flex: 1, backgroundColor: '#0008' }} onPress={() => setSwapFor(null)} accessibilityLabel="Close" />
        <View style={{ backgroundColor: t.bg, padding: space(4), paddingBottom: space(10), gap: space(3), borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <H2>Instead of {swapFor?.name}</H2>
          <P muted small>Same sets and reps, using kit that's free right now. Just for today.</P>
          {swaps.length === 0 ? <P>No good swap here. Try “Do later” and come back to it.</P> : null}
          {swaps.map((s) => (
            <Card key={s.exercise.id} onPress={() => swapFor && applySwap(swapFor, s.exercise.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: space(3) }}>
              <DemoThumb exerciseId={s.exercise.id} width={64} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontWeight: '700', fontSize: 16 }}>{s.exercise.name}</Text>
                <P muted small>{s.reason}</P>
              </View>
            </Card>
          ))}
          <Button kind="quiet" title="Cancel" onPress={() => setSwapFor(null)} />
        </View>
      </Modal>
    </View>
  );
}
