import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { Button, Card, H2, Label, Notice, P, Row, Screen } from '../components/ui';
import { mapsUrl, nearbyPlaces, type NearbyPlace } from '../lib/api';
import { rememberGym, setState } from '../lib/store';
import { space, useTheme } from '../lib/theme';

function scannedLabel(p: NearbyPlace) {
  if (!p.kit?.length || !p.lastScannedAt) return 'No kit on file yet. Be the first to scan it.';
  const date = new Date(p.lastScannedAt);
  const months = (Date.now() - date.getTime()) / (30 * 864e5);
  const when = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `Kit on file, ${p.kit.length} items · scanned ${when}${p.scans && p.scans > 1 ? ` · ${p.scans} scans` : ''}${months > 6 ? ' · may be out of date' : ''}`;
}

export default function Nearby() {
  const t = useTheme();
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location is off. Turn it on, or scan a spot without the map.');
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setPlaces(await nearbyPlaces(pos.coords.latitude, pos.coords.longitude));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    })();
  }, []);

  const choose = (p: NearbyPlace) => {
    const gym = { placeId: p.placeId, name: p.name, address: p.address, kit: p.kit ?? [] };
    rememberGym(gym);
    setState({ detected: null });
    router.push(p.kit?.length ? '/kit' : '/scan');
  };

  return (
    <Screen>
      <P muted>Gyms, hotels and apartment buildings around you. Pick one to load its kit, or scan it if nobody has yet.</P>
      {error ? <Notice tone="warn">{error}</Notice> : null}
      {!places && !error ? <ActivityIndicator color={t.accent} style={{ marginTop: space(8) }} /> : null}
      {places?.length === 0 ? <Notice>Nothing found nearby. Use “Scan a new spot” on the home screen instead.</Notice> : null}
      {places?.map((p) => (
        <Card key={p.placeId} onPress={() => choose(p)}>
          <Label>{p.kind === 'gym' ? 'Gym' : 'Hotel or apartment'}</Label>
          <H2>{p.name}</H2>
          {p.address ? <P muted small>{p.address}</P> : null}
          <P small>{scannedLabel(p)}</P>
          <View style={{ marginTop: space(1) }}>
            <Row>
              <Button kind="quiet" title="Directions" onPress={() => Linking.openURL(mapsUrl(p))} />
            </Row>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
