# Wearwise

Wearwise is a private, weather-aware digital wardrobe planner. Add photographs of real clothing from a phone or computer, import direct product image links, and use the server-side stylist to create an outfit from the pieces you own.

## First release

- **Personal wardrobe**: Manus OAuth keeps each wardrobe private, while images are stored securely in project storage rather than the database.
- **Photo and product-link import**: Add a garment from a device image or a public, direct image URL. AI suggests a practical name, category, color, season, and formality.
- **Weather-aware styling**: Use device location to obtain current conditions from Open-Meteo, then request a look for everyday wear, the office, a date night, weekend, or travel.
- **Responsive workspace**: The experience is designed for a phone first but remains comfortable on a larger screen.

## Architecture

The project uses Vite, React, TypeScript, Tailwind CSS, Express, tRPC, Drizzle, MySQL/TiDB, Manus OAuth, protected S3-compatible project storage, and a server-side built-in LLM. The web client never receives the database or AI credentials.

## Local development

```bash
pnpm install
pnpm dev
```

The managed WebDev runtime injects the database, OAuth, storage, and LLM environment variables. For normal development within Manus, open the project preview instead of manually setting those values.

## Quality checks

```bash
pnpm check
pnpm test
pnpm build
python3 /home/ubuntu/wearwise_smoke.py
```

## Deliberately next

The database already includes tables for saved outfits and planned outfit dates, but the first release focuses on cataloging and immediate weather-aware recommendations. Folder/bulk import, editable item metadata, saving generated outfits, a calendar, packing lists, and a native mobile client can now build on this foundation.

> GitHub Pages is not used for the running product because it can only host static files. Wearwise requires a server to protect per-user data, handle image storage, invoke the AI stylist, and authenticate users. GitHub Actions performs source checks and builds; Manus WebDev hosts the complete application.
