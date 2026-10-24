// Public by design: the publishable key ships inside every build and can only
// call submit_feedback() and ping() (see supabase/migrations). These are
// constants rather than env vars because EAS builds don't upload the
// gitignored .env files.
export const FEEDBACK_API = {
  url: 'https://abpyvxtteulfyhprmaad.supabase.co/rest/v1/rpc/submit_feedback',
  publishableKey: 'sb_publishable_nICy1-CokF8dhTEUIBiJEQ_RbEmtOdD',
  timeoutMs: 10_000,
};

export const STORE_REVIEW_URL: Record<
  'ios' | 'android',
  { primary: string; fallback: string | null }
> = {
  ios: {
    primary: 'https://apps.apple.com/app/id6751805707?action=write-review',
    fallback: null,
  },
  android: {
    primary: 'market://details?id=com.biszaal.itrackhabit',
    fallback: 'https://play.google.com/store/apps/details?id=com.biszaal.itrackhabit',
  },
};
