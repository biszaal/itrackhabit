# iTrackHabit — App Store listing

The listing copy is no longer maintained here. `store.json` in the repo root is
the source of truth: it is pulled from and pushed to App Store Connect with
`eas metadata:pull` / `eas metadata:push`, so it cannot drift from what is
actually live.

- **Listing copy** (title, subtitle, description, keywords, URLs, age rating,
  review contact) — `../store.json`
- **App Review notes** — `app-review-notes.md`, mirrored into
  `store.json` under `apple.review.notes`
- **Privacy policy** — <https://www.biszaaltech.com/apps/itrackhabit/privacy>,
  copied in `../PRIVACY_POLICY.md`
- **Screenshots** — live in App Store Connect; `eas metadata:pull` writes them
  to `store/`, which is gitignored rather than duplicated in the repo

This file previously described optional cloud sync, sharing progress with
friends, and a premium tier. None of those exist — the app is offline-only with
no account and no paid tier — and that copy had reached the live listing. When
changing what the app does, update `store.json` and push it, so the store and
the privacy policy stay in step.
