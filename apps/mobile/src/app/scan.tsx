import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, TextInput, View } from 'react-native';
import { Button, Label, Notice, P, Row, Screen } from '../components/ui';
import { backendReady, detectEquipment, type ScanImage } from '../lib/api';
import { setState, useStore } from '../lib/store';
import { space, useTheme } from '../lib/theme';

const MAX_PHOTOS = 10;

const MAX_SIDE = 1024;

/** Web: decode, scale the long side to MAX_SIDE and re-encode as JPEG with a plain canvas. */
async function prepareWeb(uri: string): Promise<ScanImage> {
  const img = new window.Image();
  img.src = uri;
  await img.decode();
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  if (!w0 || !h0) throw new Error('Could not read one of the photos.');
  const k = Math.min(1, MAX_SIDE / Math.max(w0, h0));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w0 * k));
  canvas.height = Math.max(1, Math.round(h0 * k));
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
  if (!data) throw new Error('Could not read one of the photos.');
  return { data, mediaType: 'image/jpeg' };
}

/** Shrink each photo before upload: faster, cheaper, and plenty for spotting a cable stack. */
async function prepare(uri: string): Promise<ScanImage> {
  if (Platform.OS === 'web') return prepareWeb(uri);
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: MAX_SIDE });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  if (!out.base64) throw new Error('Could not read one of the photos.');
  return { data: out.base64, mediaType: 'image/jpeg' };
}

export default function Scan() {
  const t = useTheme();
  const gym = useStore((s) => s.gym);
  const [name, setName] = useState(gym?.name ?? 'My spot');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fromMap = !!gym?.placeId;

  const add = (uris: string[]) => setPhotos((p) => [...p, ...uris].slice(0, MAX_PHOTOS));

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError('Camera access is off. Pick photos from your library instead.'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
    if (!res.canceled) add(res.assets.map((a) => a.uri));
  };

  const pickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: true, selectionLimit: MAX_PHOTOS - photos.length, quality: 0.8 });
    if (!res.canceled) add(res.assets.map((a) => a.uri));
  };

  const identify = async () => {
    setBusy(true);
    setError(null);
    try {
      const images: ScanImage[] = [];
      for (const uri of photos) images.push(await prepare(uri)); // one at a time keeps phone memory low
      const detected = await detectEquipment(images);
      setState((s) => ({ detected, gym: { ...(s.gym ?? { kit: [] }), name: name.trim() || 'My spot', kit: detected.items.filter((i) => i.checked).map((i) => i.id) } }));
      router.push('/kit');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const manual = () => {
    setState((s) => ({ detected: null, gym: { ...(s.gym ?? { kit: [] }), name: name.trim() || 'My spot' } }));
    router.push('/kit');
  };

  return (
    <Screen
      footer={
        <View style={{ gap: space(2) }}>
          <Button title={busy ? 'Reading your photos…' : `Identify the kit${photos.length ? ` (${photos.length})` : ''}`} onPress={identify} busy={busy} disabled={!photos.length || !backendReady} />
          <Button kind="quiet" title="Skip, pick kit by hand" onPress={manual} />
        </View>
      }
    >
      {!fromMap ? (
        <View style={{ gap: space(1.5) }}>
          <Label>Name this spot</Label>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Hotel gym, Bangkok"
            placeholderTextColor={t.muted}
            style={{ backgroundColor: t.card, color: t.ink, borderRadius: 12, padding: space(3.5), fontSize: 16, borderWidth: 1, borderColor: t.line }}
          />
        </View>
      ) : null}

      <P muted>Take a few wide shots that cover the whole room, then close-ups of racks and machines. Up to {MAX_PHOTOS} photos. Keep other people out of frame.</P>
      {!backendReady ? <Notice>Scanning needs the backend, which isn't connected yet. Pick your kit by hand for now.</Notice> : null}
      {error ? <Notice tone="warn">{error}</Notice> : null}

      <Row>
        <View style={{ flex: 1 }}><Button kind="secondary" title="Take photo" onPress={takePhoto} disabled={photos.length >= MAX_PHOTOS} /></View>
        <View style={{ flex: 1 }}><Button kind="secondary" title="From library" onPress={pickPhotos} disabled={photos.length >= MAX_PHOTOS} /></View>
      </Row>

      {photos.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(2) }}>
          {photos.map((uri, i) => (
            <Pressable key={uri + i} accessibilityLabel="Remove photo" onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}>
              <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 10, backgroundColor: t.line }} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {photos.length ? <P muted small>Tap a photo to remove it.</P> : null}
    </Screen>
  );
}
