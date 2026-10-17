# Web workout timers and notifications

## Setup

The web app owns strength rest and cardio timing above routed exercise cards.
Native/Expo continues using its existing timer hook. No native files changed.

1. Generate VAPID credentials once from the repository root:

   ```powershell
   npm exec --workspace=backend -- web-push generate-vapid-keys
   ```

2. Set these **backend** environment variables (keep the private key out of Git):

   ```dotenv
   WEB_PUSH_VAPID_PUBLIC_KEY=<generated public key>
   WEB_PUSH_VAPID_PRIVATE_KEY=<generated private key>
   WEB_PUSH_SUBJECT=mailto:your-real-contact@example.com
   ```

   Keep the keys stable across deployments. Rotating keys requires devices to
   unsubscribe/re-enable notifications. The authenticated `/api/timer-push/config`
   endpoint exposes only the public key and whether configuration is present.

3. Use the existing MongoDB connection. Allow collection/index creation for
   `timersubscriptions`, `timerschedules`, `timerpushjobs`, and `timerpushreceipts`.
   Unique compound indexes are required for revision/lease coordination; TTL
   indexes remove jobs and receipts after retention. No Redis or paid account is
   needed. Run an always-on backend (`npm run start --workspace=backend`), not a
   request-only/serverless process that sleeps. If production disables automatic
   MongoDB indexes, create the indexes declared in `models/TimerPush.ts` before
   enabling this feature. Multiple backend processes share atomic MongoDB leases.

4. Deploy the web app over HTTPS, including `/timer-sw.js` and
   `/manifest.webmanifest` at the origin root. Do not cache the worker indefinitely
   in your reverse proxy. The worker does not cache application or authentication
   responses. Keep the existing backend CORS allowlist and credentialed requests
   configured for the actual web origin. Allow outbound HTTPS to browser push
   services from the backend. No automatic permission request occurs.

5. In a workout, open the existing rest-duration/settings control and choose
   **Enable background alerts**. On iPhone/iPad, first add the app to the Home
   Screen, launch that install, then enable alerts. Denied permissions must be
   changed in browser/OS settings; the app does not repeatedly prompt.

VAPID credentials were absent from the inspected local backend environment.
Live delivery, production MongoDB index creation, and real locked-screen sound
and vibration have **not** been verified.

## Timing and delivery contract

- Rest uses an absolute end timestamp. Cardio uses a start timestamp plus elapsed
  active time. Their separate state machines share event identities and cue
  delivery. Work/rest boundaries use the same configuration/timeline as rendering.
  No rest follows the final round. Continuous cardio has a final completion cue.
- State is scoped to authenticated user and draft. Existing rest/cardio snapshots
  migrate lazily to `:web-timers`; existing workout-duration storage is unchanged.
  Valid draft restoration still goes through the existing backend verification.
- Navigation leaves the timer owner mounted. Reload restores running or paused
  progress. Visibility, focus, pageshow and a small reconciliation poll bring the
  state up to date. Display clocks are local to timer components; the provider
  does not publish high-frequency countdown updates.
- Foreground alerts are eligible for **1.5 seconds** after a boundary. Only the
  latest fresh boundary is considered after suspension. Reload never plays old
  sounds. Work-end, rest-end and final cues use soft two-note chimes rooted at 660, 880 and 1100 Hz respectively.
  Each chime plays twice over approximately 0.9 seconds; it is an Apple-inspired
  synthesis, not an Apple recording or the device's selected system sound.
  A user gesture initializes/resumes audio, including Safari's interrupted state.
  No sound is queued while audio is suspended. Commands cancel current voices.
- Modern browsers use Web Locks to serialize cross-tab commands and an IndexedDB
  transaction to claim each audible event across tabs and the service worker.
  If IndexedDB is unavailable, foreground alerts fail closed to avoid duplicate
  sounds. Without Web Locks, cross-tab command ordering is best effort. Normal
  timestamps still govern reconciliation.
- Explicitly enabled push targets this browser profile's subscription. Timers
  synchronize full future schedules after commands, and retry after reconnection
  or temporary failures while the app remains open. The backend leases durable
  jobs, validates the user, active owned workout, exercise membership, revision,
  subscription and foreground receipts before sending. Rest starts independently
  of set-save latency; a failed save retains local completion and existing retry
  feedback. Superset rest rules remain in use.
- Foreground delivery persists an event acknowledgment. Push waits roughly one
  second for that acknowledgment (less for short phases); its maximum freshness
  horizon is **5 seconds**, shortened to the next phase boundary for interval cues.
  Scheduler polling, network and OS delivery add latency. TTL is bounded by the
  remaining freshness window. Scheduling is not a precision alarm service.
- Pause/reset/replacement advance the revision. Completion/abandonment prevent
  delivery through the authoritative draft status. Logout revokes the device's
  subscription and jobs before clearing cookies. Local authority records and
  notification dismissal reduce stale delivery even if a cancellation cannot
  reach the server immediately.

## Explicit limitations

- A page, service worker, installed PWA, or notification permission does not itself
  schedule a reliable local alarm. A suspended/closed page needs the backend and
  a delivered push. No silent audio loops or background-execution workarounds are
  used. Wake lock only keeps a visible workout screen awake when the OS permits;
  it is released when hidden/ended and reacquired on return if still enabled.
- There is no guaranteed delivery time, offline delivery, or guaranteed custom
  sound/haptic behavior. Safari does not expose the Vibration API. Notification
  sound/haptics use OS settings, including Focus, mute, battery saver and user
  notification preferences. Desktop browser shutdown behavior also varies.
- iPhone/iPad Web Push requires an eligible Home Screen web app (iOS/iPadOS 16.4+).
  An ordinary Safari tab can show accurate recovered time but cannot promise a
  locked-screen alarm. Android installed PWAs and supported desktop browsers can
  receive push when suspended/closed, subject to the browser/OS and connection.
- A cancelled request cannot retract a message already handed to a push service.
  Foreground acknowledgments can also race with a send. The worker shares event
  claims and local revision records. Apple requires every received push to display
  a notification, so late/cancelled/already-claimed in-flight pushes are shown
  **silently** (obsolete ones use neutral “open your workout” wording), rather than
  silently dropping messages and risking permission revocation. A duplicate
  visible notification remains possible; tags are an additional hint, not a lock.
- An offline pause/cancel cannot immediately update backend authority. A local
  revision can silence a received obsolete push, but cannot undo an OS sound that
  has already occurred. Closing the page before a new schedule reaches the server
  cannot create an unsent job. Subscription revocation/expiry requires re-enabling
  alerts; keys rotated on the server may require clearing the old subscription in
  browser site settings. Backend restarts recover pending jobs still within their
  window; a crash during handoff can lose delivery rather than replay an old alert.
- Device identity means a browser profile, shared by its tabs; separate installs
  or devices have separate subscriptions. Clearing site data removes local state
  and may require enabling notifications again. Shared-device logout cancellation
  uses the existing refresh-session cookie and the web device header; native
  logout requests without that header keep their existing behavior.

## Verification and real-device checklist

Automated checks cover timer expiry, pause/resume, rapid replacement, cancellation,
stale cue recovery, zero-rest/single-round/final transitions, reload, owner isolation,
cross-tab revision handling and cleared-snapshot late writes. Backend tests mock
MongoDB and transport to exercise leases, short TTLs, revision rejection, active
draft checks, acknowledgment races and device revocation. They are not live push
integration tests. The mocked browser phase is:

```powershell
$env:UI_CHECK_PHASE='web-timers'
node apps/web/tests/browserUiCheck.cjs
```

It checks immediate rest under delayed saves, route-independent cardio, paused
restoration, final cues, real IndexedDB cross-tab claims, settings and overflow in
both themes at mobile/desktop widths. Audio is mocked; it does not test speakers.

On **iPhone Safari**, **iPhone Home Screen**, and **Android Chrome/PWA**, test:

1. Foreground: explicitly enable alerts, complete a set, test pause/resume/reset
   and rapid replacement, including a superset and a failed/offline save. Confirm
   no duplicate cue and that checked sets remain after reload.
2. Cardio: short multi-round intervals, zero rest, one round and continuous cardio.
   Check phase/round/countdown against each sound. Navigate away/back, reload paused,
   and return after several elapsed phases; never hear a burst of missed cues.
3. With configured push: enable only from settings, deny once, revoke in OS settings,
   then restore permission/re-enable. Check ordinary Safari's installation guidance.
4. For both timer types: switch apps, minimize, lock the screen, close the app, then
   repeat offline and with Focus/battery saver enabled. Record actual delivery delay,
   sound and haptics; none are assumed to work solely from desktop emulation.
5. Pause/reset/replace immediately before expiry, complete/abandon the workout, and
   log out. Test two tabs and another user on the same browser. Watch for stale or
   duplicated alerts, including already-in-flight pushes and silent fallback notices.
6. Enable wake lock; close settings, navigate, hide/return, and finish the workout.
   Verify lock reacquisition/release, safe areas, landscape and keyboard reachability.
7. Restart the backend before a scheduled deadline and disconnect it briefly. Check
   job recovery, expiry policy and inline sync-failure feedback on reconnect.

Official platform references:

- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- https://webkit.org/blog/16535/meet-declarative-web-push/
- https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- https://www.rfc-editor.org/rfc/rfc8030 (TTL and delivery semantics)
- https://github.com/web-push-libs/web-push (transport options and VAPID setup)
