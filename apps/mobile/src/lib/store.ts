import { useSyncExternalStore } from 'react';
import type { DetectedKitItem, EquipmentId, Focus, Goal, Level, Plan, PlannedExercise, Region, WorkoutLog } from '@roamlift/core';
import { load, save } from './storage';

export interface Gym {
  /** Google place id when picked from the map; absent for a private spot. */
  placeId?: string;
  name: string;
  address?: string;
  kit: EquipmentId[];
}

export interface Profile {
  goal: Goal;
  level: Level;
  minutes: number;
  daysPerWeek: number;
  /** 0 = single session. */
  weeks: number;
  focus: Focus;
  avoid: Region[];
}

export interface SetLog {
  done: boolean[];
  weight?: string;
  reps?: string;
}

export interface State {
  gym: Gym | null;
  /** Latest scan result, shown on the confirm screen. */
  detected: { items: DetectedKitItem[]; unknown: string[] } | null;
  profile: Profile;
  plan: Plan | null;
  seed: number;
  excluded: string[];
  week: number;
  /** key `${week}:${sessionKey}:${exerciseId}` */
  logs: Record<string, SetLog>;
  /** Today-only swaps and reorders, key `${week}:${sessionKey}`. The plan itself is untouched. */
  sessionOrder: Record<string, PlannedExercise[]>;
  recentGyms: Gym[];
  /** Finished workouts, newest last. Kept forever on the phone; the free tier shows the last 30 days. */
  history: WorkoutLog[];
  /** Set from the store subscription once the paywall ships. */
  isPro: boolean;
  /** When the current plan was built, so old history doesn't count toward this plan's weeks. */
  planStartedAt: string;
}

const KEY = 'roamlift.v1';

const initial: State = {
  gym: null,
  detected: null,
  profile: { goal: 'general', level: 1, minutes: 45, daysPerWeek: 3, weeks: 4, focus: 'balanced', avoid: [] },
  plan: null,
  seed: 1,
  excluded: [],
  week: 1,
  logs: {},
  sessionOrder: {},
  recentGyms: [],
  history: [],
  isPro: false,
  planStartedAt: '',
};

let state: State = load(KEY, initial);
const listeners = new Set<() => void>();

export function getState(): State {
  return state;
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)): void {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  save(KEY, { ...state, detected: null });
  listeners.forEach((l) => l());
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => select(state),
    () => select(state),
  );
}

export function rememberGym(gym: Gym): void {
  setState((s) => ({
    gym,
    recentGyms: [gym, ...s.recentGyms.filter((g) => (g.placeId ?? g.name) !== (gym.placeId ?? gym.name))].slice(0, 8),
  }));
}
