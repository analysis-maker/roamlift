# Roamlift

Snap the gym, confirm the kit, get a plan. Every confirmed scan is saved to a shared gym map, so the next traveller at that hotel, condo or gym skips the scan.

## What's in here

| Path | What it is |
| --- | --- |
| `packages/core` | Plan engine, 89-exercise library, "machine taken" swaps, scan clean-up. Pure TypeScript, fully tested. |
| `apps/mobile` | Expo (SDK 58) app for iOS and Android: home, near me, scan, confirm kit, goals, plan, train. |
| `supabase/migrations` | Shared gym map, scan counter, pro flag, row-level security. |
| `supabase/functions/detect-equipment` | Photos to equipment list via Claude vision. Photos are not stored. Free-tier scan limit lives here. |
| `supabase/functions/places-nearby` | Google Places (New) nearby search joined with kit already on the map. |

## Run it on your phone today (no backend needed)

1. Install Node 22 and the **Expo Go** app on your phone.
2. `npm install` in this folder.
3. `npm run mobile`, then scan the QR code with your phone camera.

Without a backend the app runs in offline mode: pick kit by hand, build plans, train, swap. Scanning and the gym map switch on once step 4 is done.

## Turn on scanning and the gym map

1. Create a Supabase project. In Authentication, turn on **Anonymous sign-ins**.
2. `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. Set function secrets:
   ```
   npx supabase secrets set ANTHROPIC_API_KEY=... GOOGLE_MAPS_API_KEY=... FREE_SCANS_PER_MONTH=10
   npx supabase functions deploy detect-equipment
   npx supabase functions deploy places-nearby
   ```
   In Google Cloud, enable **Places API (New)**, restrict the key to it, and set a budget alert.
4. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and add the project URL and publishable key.

## Ship to the stores

Builds and uploads run in the cloud with EAS, so no Mac is needed.

```
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform all
```

Before the first build, change `bundleIdentifier` and `package` in `app.json` to an id you own.

## Checks

`npm test` runs the engine tests. `npm run typecheck` checks the engine and the app. CI runs both plus a Deno check of the edge functions on every push.

## Not built yet

- Animated exercise demos (each exercise links to real-person videos for now)
- Paywall and RevenueCat (the `profiles.is_pro` flag and scan limit are ready for it)
- Video pan scanning, Apple Health and Google Health Connect
