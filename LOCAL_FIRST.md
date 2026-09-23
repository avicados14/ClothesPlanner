# Local-First Migration Notes

Wearwise began as a browser-only GitHub Pages application. That mode used IndexedDB to keep added garments, laundry status, and history on one browser profile. The current release has moved to authenticated Supabase synchronization so the same private wardrobe can follow the same signed-in person across devices.

## Migration status

| Capability | Browser-only edition | Current Supabase edition |
| --- | --- | --- |
| Add garment photos | IndexedDB on one device | Private Supabase Storage bucket |
| Garment metadata and laundry | IndexedDB on one device | Per-user database rows with RLS |
| Wear history | IndexedDB on one device | Per-user database rows with RLS |
| Device sync | Manual JSON export and restore | Automatic after email magic-link sign-in |
| Recommendation API key | Not supported securely | Reserved for a future server-side Edge Function |

## Existing local backups

Keep any downloaded `wearwise.local-backup/v1` files. They remain useful as an offline backup during the transition. The new account import flow will accept those backups in a follow-up migration step; in the meantime, the starter-catalog importer and private photo upload cover a clean new account.

## Security boundary

The legacy browser-only approach was useful when no remote service was connected. The current system retains the same privacy goal through authenticated access controls: private rows and private image files are restricted to the account that owns them. GitHub Pages does not bundle private photos, plans, or storage credentials.

For deployment and account setup details, see [MULTI_DEVICE_SETUP.md](MULTI_DEVICE_SETUP.md).
