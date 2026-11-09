import { goHome } from '../lib/nav';
import { PATTERN_NAMES, visibleHistory, weeklySets, weekStreak } from '@roamlift/core';
import { Text, View } from 'react-native';
import { Button, Card, H2, Label, P, Row, Screen } from '../components/ui';
import { useStore } from '../lib/store';
import { space, useTheme } from '../lib/theme';

/** Roughly 10 to 20 hard sets a week per muscle group is a common growth target. */
const WEEKLY_TARGET = 10;

export default function History() {
  const t = useTheme();
  const all = useStore((s) => s.history);
  const isPro = useStore((s) => s.isPro);
  const week = useStore((s) => s.week);
  const plan = useStore((s) => s.plan);
  const logs = visibleHistory(all, isPro);
  const hidden = all.length - logs.length;
  const sets = weeklySets(all);
  const streak = weekStreak(all);
  const latest = logs[0];

  if (!all.length) {
    return (
      <Screen>
        <H2>No workouts yet</H2>
        <P muted>Finish a session and it shows up here, wherever you trained.</P>
        <Button title="Home" onPress={() => goHome()} />
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="Done" onPress={() => goHome()} />}>
      {latest && Date.now() - new Date(latest.date).getTime() < 10 * 60e3 ? (
        <Card style={{ borderColor: t.good, borderWidth: 1 }}>
          <Label>Saved</Label>
          <H2>{latest.sessionTitle} at {latest.gymName}</H2>
          <P muted small>
            {latest.entries.reduce((n, e) => n + e.setsDone, 0)} sets done.
            {plan && plan.weeks.length > 1 ? ` You're on week ${week} of ${plan.weeks.length}.` : ''}
          </P>
        </Card>
      ) : null}

      <Row gap={3}>
        <Card style={{ flex: 1 }}>
          <Label>Week streak</Label>
          <Text style={{ color: t.ink, fontSize: 32, fontWeight: '800' }}>{streak}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Label>Workouts</Label>
          <Text style={{ color: t.ink, fontSize: 32, fontWeight: '800' }}>{all.length}</Text>
        </Card>
      </Row>

      {sets.length ? (
        <Card>
          <Label>Sets in the last 7 days</Label>
          {sets.map((s) => (
            <View key={s.pattern} style={{ gap: space(1) }} accessible accessibilityLabel={`${PATTERN_NAMES[s.pattern]}: ${s.sets} sets`}>
              <Row>
                <Text style={{ color: t.ink, flex: 1, fontSize: 14 }}>{PATTERN_NAMES[s.pattern]}</Text>
                <Text style={{ color: t.muted, fontSize: 14, fontVariant: ['tabular-nums'] }}>{s.sets}</Text>
              </Row>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: t.line }}>
                <View style={{ height: 6, borderRadius: 3, width: `${Math.min(100, (s.sets / WEEKLY_TARGET) * 100)}%`, backgroundColor: t.accent }} />
              </View>
            </View>
          ))}
          <P muted small>Bars fill at {WEEKLY_TARGET} sets, a solid weekly dose for most goals.</P>
        </Card>
      ) : null}

      <Label>Workouts</Label>
      {logs.map((l) => (
        <Card key={l.id}>
          <Row>
            <View style={{ flex: 1 }}><H2>{l.sessionTitle}</H2></View>
            <P muted small>{new Date(l.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</P>
          </Row>
          <P muted small>{l.gymName} · week {l.week}</P>
          {l.entries.filter((e) => e.setsDone > 0).map((e) => (
            <Text key={e.exerciseId} style={{ color: t.ink, fontSize: 14 }}>
              {e.name} <Text style={{ color: t.muted }}>{e.setsDone}/{e.setsPlanned}{e.weight ? ` · ${e.weight}` : ''}{e.reps ? ` x ${e.reps}` : ''}</Text>
            </Text>
          ))}
        </Card>
      ))}
      {hidden > 0 ? <P muted small>{hidden} older workout{hidden > 1 ? 's are' : ' is'} saved on this phone. Pro shows your full history.</P> : null}
    </Screen>
  );
}
