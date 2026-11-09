import { setsForWeek, type PlannedExercise, type WorkoutLog } from '@roamlift/core';
import { getState, setState } from './store';

/**
 * Save today's session to history. Moves the plan on a week once every
 * session in the current week has been done at least once.
 * Returns null when nothing was ticked, so an empty tap doesn't pollute history.
 */
export function finishWorkout(sessionKey: string, list: PlannedExercise[]): WorkoutLog | null {
  const s = getState();
  const plan = s.plan;
  const session = plan?.sessions.find((x) => x.key === sessionKey);
  if (!plan || !session) return null;
  const rule = plan.weeks[s.week - 1];
  const dayKey = `${s.week}:${sessionKey}`;

  const entries = list.map((e) => {
    const log = s.logs[`${dayKey}:${e.exerciseId}`];
    const reps = log?.reps ? parseInt(log.reps, 10) : undefined;
    return {
      exerciseId: e.exerciseId,
      name: e.name,
      pattern: e.pattern,
      setsPlanned: setsForWeek(e, rule),
      setsDone: (log?.done ?? []).filter(Boolean).length,
      weight: log?.weight?.trim() || undefined,
      reps: Number.isFinite(reps) ? reps : undefined,
      target: e.reps,
    };
  });
  if (!entries.some((e) => e.setsDone > 0)) return null;

  const workout: WorkoutLog = {
    id: `${Date.now()}`,
    date: new Date().toISOString(),
    gymName: s.gym?.name ?? 'My spot',
    placeId: s.gym?.placeId,
    sessionKey,
    sessionTitle: session.title,
    week: s.week,
    entries,
  };

  const history = [...s.history, workout];
  const doneThisWeek = new Set(history.filter((h) => h.date >= s.planStartedAt && h.week === s.week && plan.sessions.some((p) => p.key === h.sessionKey)).map((h) => h.sessionKey));
  const weekComplete = plan.sessions.every((p) => doneThisWeek.has(p.key));
  const week = weekComplete && s.week < plan.weeks.length ? s.week + 1 : s.week;
  // Clear today's ticks so the session can be repeated fresh.
  const logs = Object.fromEntries(Object.entries(s.logs).filter(([k]) => !k.startsWith(`${dayKey}:`)));
  const sessionOrder = { ...s.sessionOrder };
  delete sessionOrder[dayKey];
  setState({ history, week, logs, sessionOrder });
  return workout;
}
