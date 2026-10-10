# Web TanStack migration

The web app now uses TanStack Query for server state and TanStack Router for routing. The existing service functions remain the HTTP layer. Backend and native code are outside this migration.

## Inventory and progress

| Area | Pages/components | Status |
| --- | --- | --- |
| Query infrastructure | main, queryClient | Done: one client, no automatic retries, no window-focus refetch |
| Authentication | AuthContext, LoginPage, SignupPage | Done: current-user query; login, signup, logout mutations; cache cleanup on identity changes |
| Template lists/actions | TemplatesPage, MyTemplatesPage | Done: cancellable queries; start/edit/delete mutations; user-scoped private keys; deletion cache update/invalidation |
| Template details/editor | TemplatesDetailsPage, CreateTemplatePage, WorkoutSummaryPage | Done: details and summary draft queries; start/reorder/training/template-save mutations; local editable forms retained. CreateTemplatePage is presentation only. |
| Exercise browsing | LibraryPage, ExerciseDetailsPage, ProfileExercisesPage | Done: cancellable scoped queries, pagination/search/sort keys, retained data while refreshing |
| Exercise editing | CreateExercisePage, EditExercisePage | Done: create/update/delete mutations and invalidation; editor initializes local inputs once per user/exercise |
| Workout building | WorkoutSelectPage, ExerciseSelectPage | Done: creation and exercise selection mutations; draft/dependent exercise/library queries; selection remains local. |
| Active workout/restoration | WorkoutPage, WebWorkoutProvider | Done: fresh imperative draft queries and restoration query; sets/training/reorder/remove/abandon/completion mutations. Explicit autosave coordination, snapshots, timeouts and recovery retained. |
| Workout history/results | ProfileWorkoutsPage, WorkoutHistoryDetailPage, WorkoutResultPage | Done: scoped list/detail queries, dependent muscle queries, repeat/delete mutations |
| Account settings | UpdateAccountForm, ChangePasswordForm, ProfileSettingsPage | Done: update/password/delete mutations; local account inputs preserved across auth updates |
| Administration | AdminPage, AdminEditor and admin service actions | Done: scoped/filter-keyed cancellable queries, imperative detail queries, write mutations and resource invalidation |
| Presentation only | Homepage, ProfilePage, layouts, route guards | Existing behavior retained through AuthContext |
| Routing | App, navigation helpers, nested layouts and guards | Done: TanStack route tree and navigation; React Router dependency removed; URLs, guards, search and history state retained |

## Conventions

- Include the authenticated user ID in private query keys. Never persist the Query cache to browser storage; workout snapshots remain independently managed.
- Cancel old requests and remove cached resource/mutation data when identity changes. Preserve the observed auth query so login/logout updates reach route guards immediately.
- Pass query cancellation signals through service reads. A cancelled request must not repopulate an old user's cache.
- Use initial skeletons only without query data. Keep existing data visible on background refresh/failure and retain accessible busy/error feedback.
- Default mutation retries are disabled: creating workouts, completing sessions and destructive actions must not repeat automatically.
- Keep window-focus refetch disabled to preserve existing mobile behavior. Stale reads refresh on reconnect, route remount and explicit invalidation. The active workout uses explicit fresh Query reads inside its existing local hydration/save flow.
- Template lists remain stale on remount; migrated writes invalidate relevant lists/details.
- Keep local input/form values outside the query cache. Do not replace unsaved workout edits with refetched server data.

## First-batch validation

Run the web production build, focused ESLint for changed source files, and the Query cache/finish-workout/request-timeout/persistence regression tests. AuthContext retains its existing context-hook export; its pre-existing fast-refresh lint exception is checked separately.

The browser harness uses mocked API data and an isolated Edge profile. Real iPhone Safari behavior and live-backend authentication still require device/integration checks.

The explicit retry/refetch settings were reviewed against [TanStack Query's documented defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).

## Second-batch validation

- Web build and focused lint cover migrated exercise, history/results, settings, shared query helpers and pagination.
- Query regression tests cover filter/user key isolation, cancellation, cache invalidation and account cleanup alongside existing workout/cardio persistence tests.
- Browser page checks cover the migrated pages in light/dark modes at 375px and 1440px, with applicable skeleton/error/empty states.
- The query-migration browser phase uses mutable mock data to verify an unsaved exercise name survives a real reconnect refetch, exercise edits/deletions invalidate a previously cached library, and session deletion updates history. No real user data is changed.
- Mobile emulation now includes touch input. The library's existing compound search-input rule was corrected to preserve a minimum 16px font size.

## Third batch

Template details now share cancellable, account/source-scoped queries with dependent exercise queries. Missing IDs produce an error instead of an indefinite skeleton; cached details remain visible if a refresh fails. Workout selection uses mutation pending state. Summary start/reorder/template-save actions use mutations without automatic retries; existing local order, rollback, form values and confirmation behavior remain. Template saves invalidate public/private lists and details only while the originating account is still signed in.

Draft queries have zero stale/cache retention time and disable reconnect/focus refetch. Active hydration and final status verification use imperative fetchQuery calls to validate the backend; local progress is never hydrated from a persisted Query cache.

Third-batch validation: production build, focused ESLint and all 69 web regression tests pass. Mocked Edge checks cover seven template/setup routes in both themes at 375px and 1440px, plus applicable initial loading/error/empty states. Real iPhone Safari and live-backend writes still require integration testing.

## Completed migration

All existing web API consumers now use Query queries, imperative fetchQuery, or mutations; services remain the HTTP layer. Component state still owns inputs, dialogs, local workout progress and transaction coordination. In particular, completion drains autosave, checks server status, saves final values, submits completion once and recovers a lost response without replaying completion. These semantics are independent of the mutation observer's lifetime.

The stable root TanStack route owns theme/auth/workout providers, preserving provider state across child navigation. Shared navigation helpers delegate to TanStack Router for links, redirects, history state, search strings and browser back/forward; they are not a second router. Route guards remain reactive to AuthContext. Admin access checks also remain enforced by the backend.

No backend, shared timer or native files are changed. Browser checks use mocked data and isolated profiles; real Safari keyboard/browser bars and live-backend authentication require manual integration testing.

## Final validation

- Production web build passes (existing large-chunk advisory remains).
- Focused ESLint passes for migrated pages, routes, query helpers, providers, forms and services. The existing AuthContext mixed hook/component export is checked with its existing fast-refresh rule exception; a whole-source lint run also reports the pre-existing BodyModelContext and ThemeContext mixed-export errors.
- All 72 web regression tests pass, including request cancellation, fresh backend draft verification and user-scoped admin cache cleanup.
- Mocked Edge checks cover all main/nested routes in light/dark at 375px and 1440px, plus applicable skeleton/error/empty states. Admin checks cover every section and access guards.
- Interaction checks cover keyboard/dialog focus, pending failures, paused duration/rest restoration after reload, reduced motion, retained refresh data and narrow mobile layouts.
- The workout-migration phase checks client-side navigation/back, checked sets, paused timers, ordered final saves, exactly one completion request, lost-response recovery and abandonment cleanup.
- Cardio checks cover setup/selection, unsaved selection on reconnect, interval configuration, delayed phases, exclusive timer ownership, pause/reload/resume and navigation restoration. The mock now keeps draft status independent of the current URL, matching backend behavior.
- Recovery and query-migration phases verify temporary failures retain progress, retry restores checked sets, unsaved edits survive refresh, and writes invalidate previously cached pages.

Real iPhone Safari browser bars/keyboard/background suspension, live authentication cookies and backend/database integration remain manual. No real user data is changed by these checks.

Routing APIs follow the [TanStack code-based routing documentation](https://tanstack.com/router/latest/docs/routing/code-based-routing).
