// Runtime feature flags.
//
// iTrackHabit v1 ships offline-only: there are no accounts and no server.
// On-device SQLite is the source of truth, and every remote call
// short-circuits immediately so the UI never waits on a network timeout.
//
// This is a constant rather than an env-var lookup because the shipped UI
// assumes it: the sign-in, sync, and social surfaces have been removed. Do
// not flip this to `false` without restoring a real backend and those
// screens — a half-enabled state shows users features that cannot work.

export const LOCAL_ONLY = true as const;
