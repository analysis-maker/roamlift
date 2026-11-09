import { EQUIPMENT, EQUIPMENT_IDS, type EquipmentId } from '@roamlift/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, H2, Label, Notice, P, Screen } from '../components/ui';
import { shareGymKit } from '../lib/api';
import { rememberGym, useStore } from '../lib/store';
import { space, useTheme } from '../lib/theme';

const GROUPS: { key: string; title: string }[] = [
  { key: 'free', title: 'Free weights and small kit' },
  { key: 'bench', title: 'Benches' },
  { key: 'rack', title: 'Racks' },
  { key: 'bodyweight', title: 'Bars' },
  { key: 'machine', title: 'Machines' },
  { key: 'cardio', title: 'Cardio' },
];

function Tick({ id, on, note, onToggle }: { id: EquipmentId; on: boolean; note?: string; onToggle: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onToggle}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space(3), minHeight: 48, paddingVertical: space(1) }}
    >
      <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {on ? <Text style={{ color: t.onAccent, fontWeight: '900' }}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.ink, fontSize: 16 }}>{EQUIPMENT[id].label}</Text>
        {note ? <Text style={{ color: t.muted, fontSize: 13 }}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function Kit() {
  const gym = useStore((s) => s.gym);
  const detected = useStore((s) => s.detected);
  const [kit, setKit] = useState<Set<EquipmentId>>(new Set(gym?.kit ?? []));
  const [saving, setSaving] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const seen = useMemo(() => new Map((detected?.items ?? []).map((i) => [i.id, i])), [detected]);
  const toggle = (id: EquipmentId) => setKit((k) => { const n = new Set(k); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const save = async () => {
    if (!gym) return;
    const next = { ...gym, kit: [...kit] };
    rememberGym(next);
    setSaving(true);
    setShareError(null);
    try {
      await shareGymKit(next);
      router.push('/goals');
    } catch {
      setShareError('Saved on this phone, but the gym map could not be updated. It will not stop your plan.');
      router.push('/goals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={`Use these ${kit.size} items`} onPress={save} busy={saving} />}>
      <View style={{ gap: space(1) }}>
        <H2>{gym?.name ?? 'Your spot'}</H2>
        <P muted>{detected ? 'Here is what we spotted. Untick anything wrong and add what we missed.' : 'Tick everything you can use here. Bodyweight moves are always included.'}</P>
      </View>
      {gym?.placeId ? <P muted small>Your confirmed list is added to the shared gym map so the next person here skips the scan.</P> : null}
      {shareError ? <Notice tone="warn">{shareError}</Notice> : null}

      {detected?.items.length ? (
        <Card>
          <Label>Spotted in your photos</Label>
          {detected.items.map((i) => (
            <Tick key={i.id} id={i.id} on={kit.has(i.id)} onToggle={() => toggle(i.id)}
              note={[i.confidence < 0.6 ? 'Not sure, please check' : null, i.weightRange, i.count ? `x${i.count}` : null].filter(Boolean).join(' · ') || undefined} />
          ))}
          {detected.unknown.length ? <P muted small>Also seen, not used for plans: {detected.unknown.join(', ')}</P> : null}
        </Card>
      ) : null}

      {GROUPS.map((g) => {
        const ids = EQUIPMENT_IDS.filter((id) => EQUIPMENT[id].group === g.key && id !== 'bodyweight' && !seen.has(id));
        if (!ids.length) return null;
        return (
          <Card key={g.key}>
            <Label>{detected ? `Add: ${g.title}` : g.title}</Label>
            {ids.map((id) => <Tick key={id} id={id} on={kit.has(id)} onToggle={() => toggle(id)} />)}
          </Card>
        );
      })}
    </Screen>
  );
}
