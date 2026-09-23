# Wearwise

Wearwise is a **local-first, weather-aware wardrobe planner** published from this GitHub repository. The active application is the GitHub Pages site built from `pages/`. It keeps private wardrobe additions, laundry status, and planned-outfit history in the browser’s IndexedDB database rather than a hosted account or remote database.

## What the GitHub Pages app does

- Starts with the public visual catalog stored in this repository.
- Assigns a stable numerical ID to every garment, including new local photo imports.
- Stores browser-added images, clean/dirty status, and dated outfit history locally in IndexedDB.
- Produces deterministic, weather-aware looks from clean pieces only.
- Marks planned garments as dirty and excludes them from later recommendations until **Run laundry** is selected.
- Exports and restores the entire local closet as `wearwise.local-backup/v1` JSON.
- Uses Fahrenheit weather for Golden, Colorado by default, with an optional device-location refresh.

## Privacy boundary

The GitHub Pages edition does **not** use hosted authentication, a remote database, cloud file storage, or an OpenAI/ChatGPT key. New garment photos and planning history do not upload to GitHub Pages or any backend. See [the local-first architecture guide](LOCAL_FIRST.md) for the exact data boundary, backup instructions, and the route to a future secure server-based upgrade.

## Repository layout

| Path | Purpose |
| --- | --- |
| `pages/` | Self-contained static GitHub Pages application and public starter catalog. |
| `.github/workflows/ci.yml` | Type-checks, tests, builds, and deploys the `pages/` directory to GitHub Pages. |
| `LOCAL_FIRST.md` | Data-location, backup, restore, and future-upgrade guidance. |
| `AI_INTEGRATION.md` | Secure ChatGPT/OpenAI requirements for a future server-backed upgrade. |

## Local preview

```bash
python3 -m http.server 4173 --directory pages
```

Then visit `http://127.0.0.1:4173` in a browser. The browser will create its own isolated local closet. Use the built-in JSON backup before clearing browser data or moving to a different device.

## Future capabilities

The repository retains earlier prototype code for a managed server-backed version, but the deployed Pages application does not call it. A future privacy-preserving upgrade can import the same JSON backup format into a separate secure API and database if cross-device sync or direct ChatGPT recommendations become necessary.
