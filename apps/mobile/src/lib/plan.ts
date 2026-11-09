import { generatePlan } from '@roamlift/core';
import { getState, setState } from './store';

/** Build (or rebuild) the plan from the saved profile and the current gym. */
export function buildPlan(seed = getState().seed): void {
  const { profile, gym, excluded } = getState();
  const plan = generatePlan({
    kit: gym?.kit ?? [],
    goal: profile.goal,
    level: profile.level,
    minutes: profile.minutes,
    daysPerWeek: profile.daysPerWeek,
    length: profile.weeks === 0 ? { kind: 'session' } : { kind: 'weeks', weeks: profile.weeks },
    focus: profile.focus,
    avoid: profile.avoid,
    excludeIds: excluded,
    seed,
  });
  setState({ plan, seed, week: 1, sessionOrder: {} });
}
