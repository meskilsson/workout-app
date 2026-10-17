import { trainingTotalSeconds, type TrainingConfig, type CardioTimerState } from '@workout-app/shared';

export type TimerCue = 'rest-end' | 'work-end' | 'activity-end';
export type TimerEvent = { id: string; at: number; cue: TimerCue; exerciseId?: string };
export const ALERT_FRESHNESS_MS = 1500;

// The same absolute boundaries drive rendering, foreground cues and push jobs.
export function cardioEvents(runId: string, state: CardioTimerState, config: TrainingConfig, exerciseId: string): TimerEvent[] {
    if (state.status !== 'running' || state.startedAt === null) return [];
    const origin = state.startedAt - state.elapsedMs;
    const total = trainingTotalSeconds(config) * 1000;
    const result: TimerEvent[] = [];
    const add = (offset: number, cue: TimerCue) => {
        if (offset > state.elapsedMs) result.push({ id: `${runId}:${offset}`, at: origin + offset, cue, exerciseId });
    };
    if (config.format === 'intervals') {
        for (let round = 0; round < config.rounds - 1; round++) {
            const workEnd = (round * (config.workSeconds + config.restSeconds) + config.workSeconds) * 1000;
            // With zero rest, one cue marks the immediate next work interval.
            add(workEnd, 'work-end');
            if (config.restSeconds) add(workEnd + config.restSeconds * 1000, 'rest-end');
        }
    }
    add(total, 'activity-end');
    return result;
}

export function latestFreshEvent(events: TimerEvent[], after: number, now: number): TimerEvent | undefined {
    return events.filter(event => event.at > after && event.at <= now && now - event.at <= ALERT_FRESHNESS_MS)
        .sort((a, b) => b.at - a.at)[0];
}
