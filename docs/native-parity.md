# Expo native parity and review guide

Reference: the current web pages, components, service calls, validation, and timer logic, checked against backend routes and schemas. The older README's native inventory was incomplete.

## Feature checklist

“Implemented” describes code available for review, not a claim that every device scenario has been exercised.

| Web feature / native destination | Implementation | Review status |
| --- | --- | --- |
| Login, registration, protected navigation, logout | Implemented | SecureStore credentials; shared refresh operation; expiry and failure tests |
| Session restoration and refresh rotation | Implemented | Atomic secure credential write, transient failure retry, stale-cookie protection |
| Home, Train, Workouts, profile and admin navigation | Implemented | Native stack and tabs; account changes reset private routes |
| Profile update, password change, account deletion | Implemented | Inline forms, validation, confirmation, API integration |
| Public and authenticated exercise library | Implemented | Search, personal exercise view, pagination, muscles/type/equipment/difficulty filters, name/popular/personal sorting, persisted browse state |
| Exercise details and custom exercise CRUD | Implemented | Instructions, media links, original male/female muscle artwork rendered as native SVG |
| Muscle selection, cardio inclusion, draft review | Implemented | Same muscle groups, legs expansion, backend defaults and training configuration |
| Exercise addition, removal, replacement and ordering | Implemented | Arrow controls; supersets move together; backend history prefill retained |
| Strength weights/reps, sets, warmups and completion | Implemented | Stable set IDs, decimal entry, first-invalid-field focus, serialized autosave, account-scoped recovery |
| Supersets and rest rules | Implemented | Shared grouping, pairing, and paired-set rest calculations |
| Workout duration and rest controls | Implemented | Timestamp recovery, pause/resume/reset, saved rest duration |
| Continuous cardio and interval workouts | Implemented | Shared configuration validation, rounds, work/rest, no final rest, manual and automatic completion |
| Finish, results, history, deletion and repeat | Implemented | Shared completion transaction handles a lost response without blindly repeating completion |
| Shared/personal templates and categories | Implemented | Details, create/edit/delete/start, ordered planned sets, rest/notes, mixed training formats, local editor recovery |
| Administration | Implemented | Counts, search/pagination, role/status management, exercise/template/session CRUD; ownership remains server controlled |
| English/Swedish and light/dark preferences | Implemented | Reuses web catalogs plus native labels; localized exercise content, dates, numbers and known errors |
| Accessibility and small-screen behavior | Implemented; validation partial | Safe areas, scrolling, keyboard avoidance, labels, selected/disabled states, error/phase announcements, text scaling and reduced-motion navigation; screen-reader/device matrix remains manual |
| Sound, haptics, foreground/background notifications | Implemented; platform-limited | Timestamp-based events, cancellation/replacement identities, bounded native notification schedule; locked-screen hardware checks remain manual |
| Exact visual/screen-by-screen parity on iOS and Android | Partial | Theme and original artwork reused; native controls/layouts need the device review below |
| iOS runtime and physical-device verification | Blocked in this Windows environment | iOS bundle export is available; Xcode/iOS hardware and physical Android review are still required |

## Platform differences and known limits

- The app is React Native, without a WebView, DOM, browser storage or browser notification code. Web source changes only re-export shared pure helpers; web screens/styles are preserved.
- Native uses secure Bearer/refresh credentials. Explicit native headers enable token responses and body-based refresh/revocation. Browser cookies and response shapes retain their existing behavior. Native Bearer authentication takes precedence over incidental platform cookies.
- Exercise ordering uses accessible arrow buttons instead of browser drag-and-drop. Native alerts provide destructive confirmations. Android back dismisses local selection/editor views before leaving their parent screen.
- Templates use a native editor with account-scoped local recovery rather than reproducing the web's draft URL sequence. Saving still uses the existing template contracts. In-progress local template edits are not synchronized across devices.
- A native notification schedule contains at most **60 future events**, retaining final completion when a longer interval plan exceeds this window. Intermediate events beyond the window are omitted while the app stays suspended; returning to the app refreshes future scheduling. Foreground timing remains complete. This is a deliberate limitation, not full background phase-alert parity for arbitrarily long plans.
- Notifications are scheduled while JavaScript is awake and suppressed while foregrounded; the same shared timeline produces foreground audio/haptics. Resume reconciles timestamps without replaying missed phase sounds. Pause, reset, replacement, removal, finish, abandonment and logout invalidate schedules.
- Delivery is best effort: permission denial, Android exact-alarm settings/battery restrictions, notification channels, silent/Focus modes and OS throttling can affect sound, vibration or timing. Native notification failure does not stop timer recovery. See [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) and [Apple local notification guidance](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/SchedulingandHandlingLocalNotifications.html).
- Known application messages are translated. Unknown server errors use a translated fallback rather than exposing internal diagnostics. User-authored names/descriptions remain user content. Deep nested administrative validation and full VoiceOver/TalkBack behavior require manual review.
- Workout recovery requires the API to validate draft ownership/status. It is not a full offline workout mode. Template editor recovery and exercise browse preferences are local only.

## Run and build

From the repository root:

```powershell
npm.cmd ci
npm.cmd run dev:backend
```

In a separate terminal, configure `apps/native/.env` from `.env.example` with an API origin reachable from the phone. URLs must not include `/api`. `EXPO_PUBLIC_API_URL` is public configuration, not a secret.

```dotenv
# Android emulator calling the development computer:
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
# For a physical phone, use your computer's reachable LAN address instead.
# Use an HTTPS API origin for release/production deployments.
```

```powershell
npm.cmd run dev:native
```

Use a build of this app for native configuration and locked-screen acceptance testing. Expo Go is useful for initial UI checks but does not validate this app's final native permissions/configuration.

```powershell
Set-Location apps/native
npx.cmd expo run:android --device
# On macOS with Xcode and an iOS simulator/device:
npx expo run:ios --device
```

Android requires a suitable JDK (17 is the standard Expo/RN setup), Android SDK and emulator/device. iOS requires macOS/Xcode; physical device signing uses your Apple development account. Package/bundle identifiers are `com.workoutapp.mobile`; choose identifiers you control before store distribution. No store signing, EAS project or production credentials are configured by this change. No APNs/FCM credentials are required for these local notification schedules.

For Android notification testing, enable notifications in Profile, allow system permission, and check the app's “Alarms & reminders” special access where available. Denial leaves the foreground timer usable. Notification/channel setting changes may require opening system settings. Sound/vibration/notification/rest preferences are account scoped; language, theme, body model and keep-awake are device preferences.

Existing backend environment/database requirements remain: `MONGODB_URI`, `JWT_SECRET`, optional `DB_NAME`/`PORT`, and a transaction-capable MongoDB deployment for account/admin operations. Use a normal registered account, and an existing database-authorized admin for administration. No real credentials are included here.

## Automated checks

```powershell
npm.cmd run typecheck --workspace=native
npm.cmd run lint --workspace=native
npm.cmd run test --workspace=native
npm.cmd run test --workspace=web
npm.cmd run test --workspace=backend
npm.cmd run build:web
npm.cmd run build:backend
Set-Location apps/native
npx.cmd expo install --check
npx.cmd expo config --type public
npx.cmd --yes expo-doctor
npm.cmd run export -- --output-dir .expo/review
```

Validation results are recorded after the final run below. Tests use fixtures/stubs; they do not verify a production database, store signing or OS delivery guarantees.

For isolated Android UI review without MongoDB, run `node apps/native/tests/mockApi.cjs` from the root and start Metro with `EXPO_PUBLIC_API_URL=http://10.0.2.2:5107`. The in-memory server uses synthetic data and never touches the real backend. Its login accepts test values; use `native-review@example.test` and `review12345`. This server is test tooling only and must not be deployed. Its supported routes are deliberately limited to the review flows.

## Remaining device acceptance checklist

1. On iOS and Android, register; exercise invalid email/name/username/password and duplicate-account responses. Log in, restart, rotate an expired access token, retry a network outage, log out and switch accounts. Confirm no prior account's drafts/routes remain.
2. Browse/filter/page exercises in both languages. Open details and both body models; create, edit and delete a personal exercise, including API failures and long text.
3. Build strength, cardio-only and mixed workouts. Check default plans, add/remove/replace/reorder, warmups, supersets, decimal weights, invalid reps, saving failures, and keyboard focus at the bottom of a small screen.
4. Check strength completion/rest rules, pause/resume/reset and cardio options. Background and force-close during work/rest; reopen and verify timeline/checked sets. Do not expect historical sounds to replay.
5. Enable/deny notifications. Lock the device across short work/rest boundaries. Test pause/reset/replacement/logout cancellation, silent/Focus modes, Android exact-alarm access and battery restrictions, and plans exceeding 60 scheduled events.
6. Finish a mixed workout, retry a lost completion response, view history/result, repeat and delete. Verify actual versus planned cardio values and warmup/superset markers against the real API.
7. Create/edit/cancel/recover/delete a personal template in every category; check planned weights/reps/rest/notes and start shared/personal templates. Check confirmation before replacing an existing workout.
8. With a real admin, verify resource counts/details/CRUD, personal-resource ownership, referenced deletion rejection, role changes, deactivation/restoration, self-change prevention and last-admin protection against a replica-set database.
9. Review every screen with large text, keyboard, safe areas, Android back, reduced motion, VoiceOver and TalkBack, light/dark, English/Swedish, and a small/large phone. Exact visual equivalence remains a review item.

## Final verification record

- Native TypeScript (including unused-symbol checks) and lint: passed.
- Native logic tests: 9 passing (recovery, configuration integrity, timestamps, notification cancellation/budget, session renewal, set validation and localized validation/custom-content protection).
- Web tests: 116 passing, including shared completion recovery, superset and timer behavior.
- Backend tests: 59 passing, including native refresh/logout and Bearer precedence.
- Web and backend builds: passed.
- Expo Doctor: 18/18 checks passed after aligning SDK 54 patch dependencies and fixing the application ID.
- iOS/Android Hermes exports: passed; output is under `apps/native/.expo/final-review`.
- Existing web browser checker: library/workout/history/session details passed at 375px in both themes.
- Web lint: three existing Fast Refresh errors in untouched `AuthContext.tsx`, `BodyModelContext.tsx` and `ThemeContext.tsx`.
- Android Pixel 8 / Expo Go SDK 54 fixture review: login field errors and first-field focus, login/secure session restoration, native Home/Train rendering, decimal weight/reps entry and autosave, checked-set rest, cardio background timestamp recovery, workout completion and saved result verified with ADB/screenshots. The saved fixture contained 42.5 kg x 10 reps and a five-second, two-round automatic interval completion. This was a focused rendered workflow check, not a comprehensive UI automation suite. Screenshots are in `apps/native/.expo/native-ui-review` and `.expo/review-*.png`.
- Physical Android, iOS runtime, native development-build/locked-screen delivery, full screen-reader and real MongoDB acceptance: not verified here.

## Expo SDK 57 upgrade verification

- Upgraded to Expo 57.0.30 / React Native 0.86.3 with SDK-compatible Expo modules and TypeScript 6.0.
- Aligned workspace React and React DOM to 19.2.3.
- Migrated legacy splash configuration to the expo-splash-screen plugin and removed obsolete newArchEnabled / edgeToEdgeEnabled flags.
- Expo dependency check and Expo Doctor: passed (21/21).
- Native typecheck, lint and 9 logic tests: passed. Web tests: 116 passed.
- Android and iOS Hermes exports: passed, under apps/native/.expo/sdk57-check.
- Web production build: passed.
- SDK 57 device runtime and locked-screen acceptance still require manual testing; the SDK 54 fixture review above is historical.
- Stop the previous Metro server and restart from the repository root with `npm.cmd run start --workspace=native -- --clear` before reconnecting Expo Go for SDK 57.
