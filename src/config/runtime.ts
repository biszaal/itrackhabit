// Runtime feature flags.
//
// Set LOCAL_ONLY=true to run the app fully offline with no Supabase or
// backend API calls. SQLite remains the source of truth (it already is —
// the app is offline-first), but all sync attempts and remote API hits
// short-circuit immediately so the UI doesn't wait for network timeouts.
//
// Override via the EXPO_PUBLIC_LOCAL_ONLY env var, e.g.
//   EXPO_PUBLIC_LOCAL_ONLY=false npm start

const envFlag = process.env.EXPO_PUBLIC_LOCAL_ONLY;

export const LOCAL_ONLY: boolean =
  envFlag === undefined ? true : envFlag === 'true' || envFlag === '1';
