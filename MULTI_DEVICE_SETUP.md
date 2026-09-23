# Secure Multi-Device Wearwise Setup

## Recommended architecture

Use **GitHub** for the Wearwise source code and GitHub Pages frontend, then add **Supabase** as the private data layer. Supabase provides sign-in, a PostgreSQL database, private image storage, and server-side Edge Functions. This preserves the current browser-first interface while allowing the same account to use one synchronized closet from a phone, tablet, or computer.

> GitHub Pages remains a static frontend. The Supabase client URL and publishable key may appear in frontend code because access is protected by Row Level Security (RLS). The service-role key and OpenAI API key must remain server-side secrets only. [1][2]

| Responsibility | Service | Data visibility |
| --- | --- | --- |
| Source code and deployment workflow | GitHub repository | Controlled by repository visibility and collaborators |
| Web interface | GitHub Pages | Public application shell; no private wardrobe data bundled into it |
| Sign-in, database, and image storage | Supabase | Private per authenticated user through RLS policies |
| Weather | Open-Meteo browser request | Forecast request only; no closet data required |
| ChatGPT recommendations, if enabled later | Supabase Edge Function + OpenAI | OpenAI key held only as an Edge Function secret |

## What to do now

### 1. Create a Supabase account and project

Create an account at [Supabase](https://supabase.com/) with an email or GitHub login. Create one project named **Wearwise** and select the region closest to you. Keep the database password in a password manager; do not paste it into GitHub, the website, or a chat.

### 2. Choose the simplest sign-in method

Start with **email magic-link sign-in**. It is the lowest-friction way to access the same wardrobe from multiple devices: enter the same email on each device and open the link that arrives in the inbox. GitHub or Google sign-in can be added later if preferred.

In Supabase **Authentication → URL Configuration**, set both values to the exact GitHub Pages address:

```text
Site URL: https://avicados14.github.io/ClothesPlanner/
Redirect URL: https://avicados14.github.io/ClothesPlanner/**
```

Supabase requires the post-sign-in `redirectTo` address to match its configured redirect allow list; use the precise production URL for the primary site. [3]

### 3. Connect Supabase to the build

After the project exists, enable the **Supabase** connection in this task and authorize it with your Supabase account. I can then create the database schema, private storage bucket, RLS policies, and migration without you sharing the database password or service-role key.

The implementation will create the following user-scoped entities:

| Entity | Contents |
| --- | --- |
| `wardrobe_items` | Stable garment ID, category, color, clean/dirty state, and private image path |
| `outfit_plans` | Planned date, occasion, notes, and immutable garment snapshot |
| `wear_history` | Export-ready history view derived from saved plans |
| `wardrobe` storage bucket | Private clothing images organized by authenticated user ID |

Every table and bucket policy will restrict access to the authenticated owner using `auth.uid()`. Supabase RLS policies act as row-level authorization rules, and storage access policies can similarly restrict a user to their own object folder. [1][2]

### 4. Migrate the local browser closet

Open the current GitHub Pages app and choose **Plan → Download JSON**. Keep the downloaded `wearwise.local-backup/v1` file. Once private sign-in is live, the app will offer an import screen that uploads that backup to the user’s private account and moves any included local photo data into the private storage bucket.

### 5. Add ChatGPT only after the secure service is live

First revoke the OpenAI key previously pasted into chat. Then create a new OpenAI Platform API key only when the Supabase backend is ready. Store it in the **Supabase Edge Function secret manager** as `OPENAI_API_KEY`; never commit it to GitHub or expose it in JavaScript.

The Edge Function will verify the user session, fetch only that user’s **clean** garments, call OpenAI, and return the outfit recommendation. Supabase Edge Functions can read deployed secrets, while service/secret credentials must not be exposed in browser code. [4]

## What I will build after Supabase is connected

I will replace browser-only IndexedDB persistence with authenticated synchronization, retain the stable numerical garment IDs and laundry rules, migrate the existing JSON backup format, create private image storage, add RLS policy tests, and add a server-side ChatGPT recommendation function only after the new API key is safely stored as a function secret.

## Security checklist

- Do not paste database passwords, Supabase service-role keys, or OpenAI API keys into chat, GitHub issues, commits, or browser settings.
- Keep the GitHub repository private if the source code or documentation is not intended to be public.
- Use a private Supabase storage bucket with user-folder RLS policies.
- Use the public Supabase client key only with RLS enabled; it is not a substitute for a secret key.
- Use the JSON backup before switching browsers or devices until the secure migration is complete.

## Sources

[1] [Supabase, *Row Level Security*](https://supabase.com/docs/guides/database/postgres/row-level-security)

[2] [Supabase, *Storage Access Control*](https://supabase.com/docs/guides/storage/security/access-control)

[3] [Supabase, *Redirect URLs*](https://supabase.com/docs/guides/auth/redirect-urls)

[4] [Supabase, *Environment Variables and Edge Function Secrets*](https://supabase.com/docs/guides/functions/secrets)
