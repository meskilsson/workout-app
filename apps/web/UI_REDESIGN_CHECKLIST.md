# Web UI completion inventory

Reference: the user-supplied three-screen strength-training image. Direction: minimal pastel blue/yellow surfaces, compact typography, outline icons, green completion and red destructive actions. Earlier Yoga/FitHero references are superseded.

All 21 existing page components and their route variants were inspected. Static pages have no page-data loading/empty state; their authentication bootstrap uses route-specific skeletons. User, draft and timer services are unchanged.

| Status | Page | Routes | Presentation and states reviewed |
| --- | --- | --- | --- |
| Complete | Home | `/; /homepage` | Start/resume panels and minimal destination list; guest alias retained. |
| Complete | Log in | `/login` | Compact form, autocomplete, error and pending feedback. |
| Complete | Create account | `/signup` | Compact form; field errors associated with inputs. |
| Complete | Choose muscles | `/workout-select; ?purpose=template` | Compact keyboard-operable selection cards with check indicators. |
| Complete | Choose/edit/add exercises | `/exercise-select/:draftId` | Search, grouping, existing/selected states, paging and pending action. |
| Complete | Review workout / template | `/workout-summary/:draftId` | Flat summary; dedicated accessible drag handle; save-template dialog. |
| Complete | Active workout | `/workout/:draftId` | Approved row/input structure retained; completion, menus, remove/end/abandon dialogs and errors reviewed. |
| Complete | Workout result | `/workout-result/:sessionId` | Flat summary, recorded rows and one descriptive muscle profile. |
| Complete | Exercise library | `/library` | Compact cards, search, pagination and creation action. |
| Complete | Exercise details | `/exercises/:id` | Compact readable metadata, instructions, image and muscle profile. |
| Complete | Create exercise | `/create-exercise` | Consistent form and labeled muscle checkbox groups. |
| Complete | Edit exercise | `/edit-exercise/:id` | Same form language; populated, fetching, failed and saving states. |
| Complete | Public templates | `/templates/pre-made` | Minimal list cards and clear actions; guest start action remains disabled. |
| Complete | My templates | `/templates/my` | Minimal cards; start/edit/delete actions and confirmation feedback. |
| Complete | Public template details | `/templates/pre-made/templates-details/:id` | Single-column exercise list, flat metadata, expandable technique, planned sets and muscle figure. |
| Complete | My template details | `/templates/my/templates-details/:id` | Same detail presentation and access behavior. |
| Complete | Create template | `/templates/create` | Compact three-step introduction with accurate template wording. |
| Complete | Profile | `/profile` | Real account information; removed nonfunctional future-statistic placeholders. |
| Complete | History | `/profile/workouts` | Compact dated session cards and recorded-exercise preview. |
| Complete | Session details | `/profile/workouts/:id` | Readable session summary, duration, recorded sets and muscle profile. |
| Complete | My exercises | `/profile/exercises` | Compact management cards; edit/delete controls and confirmation feedback. |
| Complete | Settings | `/profile/settings` | Account/password forms, body-model preference, logout and account deletion. |

`/templates` redirects to `/templates/pre-made`; `/homepage` retains its public-route behavior. Protected and public guards remain in place.

## Layout and shared-component inventory

| Surface | Completion |
| --- | --- |
| Layout / Footer | Document scrolling, safe-area footer and isolated active-workout rest timer preserved. |
| Navbar | Compact desktop links, mobile menu/dock, accessible names and theme selector. Dock omitted from active workouts. |
| AccountLayout | Lightweight account navigation, wrapping mobile links, nested pages reviewed. |
| TemplatesLayout | Lightweight template navigation; redundant introductory container removed; guest restrictions preserved. |
| Card / Box | Flat pastel surfaces, restrained borders; interactive cards support Enter/Space. |
| Button / Icon | Shared semantic variants and Lucide outlines; green End Workout and red destructive actions retained. |
| Input | Rectangular controls; labels/errors associated programmatically, readable mobile text and visible focus. |
| Modal | Labeled modal dialog, focus containment/restoration, Escape and existing pending guards; visible-viewport scrolling retained. |
| UpdateAccountForm / ChangePasswordForm | Consistent fields; explicit error/success styling and announcements; password autocomplete. |
| ThemeSelect / BodyModelSelect / MuscleDummy | Light/dark preference and body preference preserved; lighter-red primary and darker-red secondary muscles with descriptions/legend. |
| WebWorkoutProvider recovery | Temporary verification failure now uses a centered, readable recovery surface; existing saved-progress and retry logic unchanged. |
| WorkoutDurationTimer / RestTimer / WebRestTimerProvider | Existing presentation and state behavior retained; no timer/persistence refactor. |
| LoadingState / Skeleton / AppLoadingSkeleton | Route-specific placeholder shapes; busy region, announcement, hidden decoration and reduced-motion behavior. |
| LoadingPredator | Public component API retained for button pending feedback; ornamental animation replaced with a simple indicator. |
| LoadingWheel | Removed unused component and stylesheet. |

## Validation

Browser checks use an isolated Edge profile and intercept all API requests. Fixtures cover populated routes in both modes at 375 and 1440 px, guest routes, applicable skeleton/error/empty states, dialogs, keyboard selection, pending forms and paused-workout restoration. Screenshots are stored in the OS temporary directory as `complete-*.png`.

Run: `npm.cmd run build:web`, theme/muscle/persistence Node suites, focused ESLint, and `node apps/web/tests/browserUiCheck.cjs` (Edge path can be set with `UI_BROWSER_PATH`).

Real iPhone Safari browser bars, keyboard geometry, safe-area hardware, pinch zoom and VoiceOver still require device testing. Live backend integration and real account mutations are deliberately not exercised by mock browser tests.

Final results:
- Web production build passed. Vite retains its existing >500 kB chunk warning.
- 9 theme/contrast/muscle tests and 33 persistence regressions passed.
- Focused lint passed. Files with known baseline findings were checked with only `react-hooks/set-state-in-effect` / `react-refresh/only-export-components` excluded as applicable; unrestricted source lint still reports the same 9 pre-existing findings.
- Every route/alias and workout/template variant passed populated checks in light and dark mode at 375 and 1440 px, including guest browsing.
- Applicable asynchronous routes passed skeleton, error and empty checks in both modes.
- Final layout refinements passed additional 320 px portrait and 844 x 390 landscape checks. Library figures are asserted to neither overlap headings nor exceed their cards.
- Keyboard selection, menus, modal focus/restore/Escape, template-save errors, pending login/create/edit controls, password validation, and abandonment failure were checked. Both workout actions disable while abandonment is pending; failed abandonment retains the set inputs.
- Theme switching/reload retains checked sets and paused workout/rest timers. Reduced-motion skeleton behavior and background refresh retaining content passed.
- Temporary restoration failure/retry passed at mobile and desktop widths in both modes, retaining saved progress and restoring a checked set.
- Mock-only previews: `workout-ui-previews.html` in the OS temporary directory, with matching `complete-*.png` files. No real account/workout mutations were made.
