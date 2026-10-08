# Cardio and interval workouts

The current equivalents of CreateWorkout and Workout.tsx are WorkoutSelectPage, ExerciseSelectPage, WorkoutSummaryPage, and WorkoutPage. Native configuration and performance live in StartWorkoutScreen and TrainingActivity.

## Configure an assault bike session

1. Choose Cardio in the workout builder, optionally alongside muscle groups. Choosing Abs and Cardio includes both core exercises and cardio activities; combined selection uses an OR filter before pagination and is retained in the draft.
2. Select Assault Bike / Air Bike in the existing exercise library.
3. In the workout summary, choose Intervals and enter 8 rounds, work 0 minutes 30 seconds, rest 1 minute 30 seconds. Save configuration.
4. Start the workout, then press Start cardio on the bike card. The timer runs work and rest automatically, with no rest after the last work phase. Total: 14 minutes 30 seconds.
5. Pause/resume, reset, or complete manually as needed. End Workout saves actual elapsed time and completed rounds. Native uses Save completion before Finish workout.

Continuous cardio supports planned duration and optional target distance in m, km, or mi. Activities and training format are independent. Existing strength entries, including entries without a training field, retain sets/reps/weight behavior. Cardio can be added to mixed workouts through the existing selection flow. Templates, template edit drafts, repeated sessions, results, and history retain or show the configuration. Administrative template/session editors preserve and edit cardio configuration; completed session edits require explicit actual elapsed time.

## Timing and persistence

Timing derives from timestamps, not callback counts. A running session includes time spent with the tab inactive or device locked and reconciles all elapsed phases on return. A pause freezes elapsed time. Starting another cardio exercise pauses the previous one. Completing a strength set pauses cardio before starting strength rest. The manual strength rest controls are unavailable while cardio is running.

Web snapshots use the existing owner/draft storage scope and are validated against the saved configuration. Running sessions continue by elapsed timestamp across refresh or navigation; paused sessions remain paused. Component listeners and intervals are removed on unmount. Completion, abandonment, and logout clean up snapshots and prevent late writes. Local storage must be available for refresh restoration. Multi-tab simultaneous control is not synchronized.

The native prototype has no existing persisted timer progress. Its timers reconcile on AppState changes while mounted, but restart at Ready after a screen is unmounted or the app process restarts. Saved plans and saved completion data remain in the backend. Native configuration currently follows the screen's existing create/start flow rather than providing a separate restore screen.

Browsers and mobile operating systems can suspend JavaScript. Timestamp reconciliation works when execution resumes; background execution and sounds are not guaranteed. No new background sound or vibration behavior is added.

## Validation and database steps

Configuration durations are integer seconds: work and continuous duration must be 1–21,600 seconds, rest 0–21,600 seconds, rounds an integer 1–100, and total session duration at most 86,400 seconds. Optional distance must be finite, positive, at most 1,000,000 units, and paired with a supported unit. Frontend and backend share these rules. Completion data is distinct from the planned configuration and must match actual elapsed time; configuring a session never completes it.

MongoDB changes are additive optional embedded fields; no data migration or reset is required. Legacy records remain strength. To add new catalogue entries to an existing database, run the existing idempotent seed command with the correct backend database environment:

```sh
npm run seed:exercises --workspace=backend
```

The seed adds Assault Bike / Air Bike, Running / Treadmill, SkiErg, and Custom Cardio Activity, alongside the existing Stationary Bike, Rowing Machine, Elliptical, and Jump Rope entries. It also updates the existing seeded catalogue according to its established behavior. The database seed is not automatically run by the UI or this implementation.

## Verification

Use the existing backend and web test commands, backend/web builds, and native TypeScript check. New tests cover validation, legacy strength, mixed model roundtrips, owned configuration updates, template start/edit/save, repeat sessions, totals, single rounds, zero rest, delayed phases, pause/resume/reset, manual and automatic completion, and snapshot cleanup.

Run `node apps/web/tests/cardioBrowserCheck.cjs` after building web for mocked-API headless Edge checks at 375px and 1440px, including configuration edits, save gating, pause across refresh, delayed callbacks, exclusive timer ownership, navigation cleanup, and manual completion. The real database and physical mobile device are not covered by this harness.

Completed checks: backend build, web production build, native TypeScript check, 18 backend tests, 53 web tests, cardio browser/lifecycle checks at phone and desktop sizes, existing admin browser checks, targeted lint, and whitespace checks all passed. Timer screenshots were inspected at both sizes. Full web lint still reports nine pre-existing hook/refresh-rule errors in existing pages and contexts. Vite retains its large-bundle warning. No database seed, live database integration run, physical-device test, staging, commit, push, or deployment was performed.
