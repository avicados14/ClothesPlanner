# Local-First Wearwise on GitHub Pages

The GitHub Pages edition of Wearwise is the active personal wardrobe experience. It is a static site that runs entirely in the browser. The public starter catalog is versioned in this repository under `pages/`; all new clothing photos, generated local numerical IDs, clean-or-dirty laundry state, and wear history are stored in the browser’s IndexedDB database.

## Data boundaries

| Data | Storage location | Sent to a server? |
| --- | --- | --- |
| Starter garment images | This GitHub repository and GitHub Pages | Public repository assets only |
| Added garment photos | IndexedDB in the browser that imported them | No |
| Garment IDs and metadata | IndexedDB in the browser | No |
| Laundry status and dated outfit history | IndexedDB in the browser | No |
| JSON backup files | Downloaded to the user’s device | No |
| Weather | Browser request to Open-Meteo for Golden, Colorado or device location | Yes, only the forecast request |
| ChatGPT/OpenAI key | Not supported in the GitHub Pages edition | No key is stored or used |

> **Important:** Browser-local data is specific to each browser profile and device. Clearing browser data, using private/incognito mode, or changing devices can remove access to the local closet unless a JSON backup has been exported.

## Backup and move to another device

Open **Plan → Download JSON** to create a portable backup containing items, image data, laundry state, and wear history. On the other device, open the same GitHub Pages site and choose **Restore JSON**. Restore intentionally replaces the local closet in that browser after confirmation.

## Current privacy posture

The GitHub Pages application contains no OpenAI key, Manus token, server-side database request, image upload endpoint, or authentication request. Its code can be developed directly in this repository. The previously created managed backend is not used by GitHub Pages or by this local-first interface.

## Future secure upgrade

For cross-device synchronization or ChatGPT recommendations, a separate secure service is required because a public static site cannot protect an API key. The local backup format is versioned as `wearwise.local-backup/v1` so a future service can import it without changing the closet model. That upgrade should use a server-side secret manager, a private per-user database, and an `OPENAI_API_KEY` that never reaches browser JavaScript or the Git history.

## Working on the project from GitHub

The deployed static application is contained in the `pages/` folder. The GitHub Actions workflow verifies the repository and publishes that folder to GitHub Pages. Local garment photos are intentionally not committed automatically; export a JSON backup if you want to move a personal local wardrobe between browsers or devices.
