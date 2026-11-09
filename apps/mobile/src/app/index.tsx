import { EQUIPMENT } from '@roamlift/core';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, H1, H2, Label, P, Screen } from '../components/ui';
import { backendReady } from '../lib/api';
import { rememberGym, setState, useStore, type Gym } from '../lib/store';
import { space } from '../lib/theme';

function kitSummary(gym: Gym) {
  const names = gym.kit.filter((id) => id !== 'bodyweight').map((id) => EQUIPMENT[id].label);
  return names.length ? names.slice(0, 4).join(', ') + (names.length > 4 ? ` +${names.length - 4} more` : '') : 'Bodyweight only';
}

export default function Home() {
  const gym = useStore((s) => s.gym);
  const plan = useStore((s) => s.plan);
  const week = useStore((s) => s.week);
  const recent = useStore((s) => s.recentGyms);
  const history = useStore((s) => s.history);

  const startFresh = () => {
    setState({ gym: { name: 'My spot', kit: [] }, detected: null });
    router.push('/scan');
  };

  return (
    <Screen>
      <View style={{ gap: space(1) }}>
        <H1>Any gym, anywhere.</H1>
        <P muted>Snap the kit in the room and get a plan built around it.</P>
      </View>

      {plan && gym ? (
        <Card>
          <Label>Training at</Label>
          <H2>{gym.name}</H2>
          <P muted small>{kitSummary(gym)}</P>
          <View style={{ gap: space(2), marginTop: space(2) }}>
            {plan.sessions.map((s) => (
              <Button key={s.key} kind="secondary" title={`${s.title}  ·  ~${s.estimatedMinutes} min`} onPress={() => router.push(`/session/${s.key}`)} />
            ))}
            <Button kind="quiet" title={`View plan${plan.weeks.length > 1 ? ` (week ${week} of ${plan.weeks.length})` : ''}`} onPress={() => router.push('/plan')} />
          </View>
        </Card>
      ) : null}

      <View style={{ gap: space(2) }}>
        <Button title="Find gyms near me" onPress={() => router.push('/nearby')} disabled={!backendReady} />
        <Button kind="secondary" title="Scan a new spot" onPress={startFresh} />
        <Button kind="quiet" title="Pick my kit by hand" onPress={() => { setState({ gym: { name: 'My spot', kit: [] }, detected: null }); router.push('/kit'); }} />
        {history.length ? <Button kind="quiet" title={`Progress · ${history.length} workout${history.length > 1 ? 's' : ''}`} onPress={() => router.push('/history')} /> : null}
        {!backendReady ? <P muted small>Offline mode: scanning and the gym map turn on once the backend is connected. Manual kit and plans work now.</P> : null}
      </View>

      {recent.length ? (
        <View style={{ gap: space(2) }}>
          <Label>Recent gyms</Label>
          {recent.map((g) => (
            <Card key={g.placeId ?? g.name} onPress={() => { rememberGym(g); setState({ detected: null }); router.push('/kit'); }}>
              <H2>{g.name}</H2>
              <P muted small>{kitSummary(g)}</P>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
