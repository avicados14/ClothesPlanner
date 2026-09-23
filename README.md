# Wearwise

Wearwise is a weather-aware wardrobe planner whose source and deployment workflow live in this GitHub repository. The current GitHub Pages application uses **Supabase** for private email sign-in, per-user garment records, private image storage, synchronized laundry state, and wear history across devices.

## Current product behavior

- **Private synchronized closet:** Sign in using the same email on every device to access one private wardrobe.
- **Private garment photos:** Images live in a non-public Supabase Storage bucket and are accessed only through time-limited signed URLs after authentication.
- **Stable garment numbers:** Every garment has a user-scoped numerical ID that remains attached to plans and laundry status.
- **Laundry-aware planning:** Adding a look to a plan marks precisely those garments dirty across devices. **Run laundry** restores all garments to clean.
- **Planning history:** Dated outfit plans retain immutable garment snapshots and export as JSON.
- **Golden, Colorado weather:** The browser requests Fahrenheit conditions from Open-Meteo, then the local stylist chooses from clean items.
- **School occasion:** School, Everyday, Office, Date night, Weekend, and Travel are available planning contexts.

## Privacy boundary

GitHub Pages contains the application shell and public client configuration only. Private garment images, history, and clean/dirty state are not embedded in the deployed app. Supabase Row Level Security ensures that an authenticated person can only read and write their own rows and storage files.

No OpenAI/ChatGPT key is currently used in browser code. A future AI recommendation feature must run in a server-side Supabase Edge Function with a replacement OpenAI key stored as a secret. See [AI_INTEGRATION.md](AI_INTEGRATION.md).

## First-time migration

1. Open the GitHub Pages application.
2. Select **Sign in** and enter your email. Open the magic link in the email on the same device.
3. Select **Import starter closet** to copy the existing starter catalog into your private account.
4. Use **Add photo** for new garments. Use the same sign-in on another device to confirm synchronization.

The old browser-only export remains useful as a backup. The app will provide an account import path for existing local backups as part of the next migration increment.

## Repository layout

| Path | Purpose |
| --- | --- |
| `pages/` | GitHub Pages frontend. It uses Supabase Auth, Database, and Storage from browser JavaScript. |
| `.github/workflows/ci.yml` | Verifies the code and deploys `pages/` to GitHub Pages. |
| `MULTI_DEVICE_SETUP.md` | Account configuration, RLS, private storage, and secure ChatGPT roadmap. |
| `AI_INTEGRATION.md` | Requirements for adding server-side ChatGPT recommendations safely. |

## Security notes

The Supabase publishable key in the static application is intentionally public and safe only because RLS is enabled on every private table and storage bucket. Never add a Supabase service-role key, database password, or OpenAI key to GitHub Pages, Git history, or browser JavaScript.
