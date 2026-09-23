# Wearwise

Wearwise is a private, weather-aware digital wardrobe planner. Add photographs of real clothing from a phone or computer, import direct product image links, and use the server-side stylist to create an outfit from the pieces you own.

## First release

- **Personal wardrobe**: Manus OAuth keeps each wardrobe private, while images are stored securely in project storage rather than the database.
- **Photo and product-link import**: Add a garment from a device image or a public, direct image URL. AI suggests a practical name, category, color, season, and formality.
- **Weather-aware styling**: Use device location to obtain current conditions in **Fahrenheit**, then request a look for everyday wear, the office, a date night, weekend, or travel.
- **Responsive workspace**: The experience is designed for a phone first but remains comfortable on a larger screen.

## GitHub Pages companion

The repository publishes a static wardrobe companion from `pages/` to GitHub Pages. It contains the supplied Threadbeast crop set, displays weather in Fahrenheit, supports client-side category filtering, and can generate a simple local outfit prompt.

GitHub Pages is a static hosting platform. The full authenticated Wearwise product—including secure user uploads, private database records, sign-in, and the server-side AI stylist—continues to require the managed application host. The GitHub Pages view is deliberately a read-only public companion, not a replacement for the private app.

## Architecture

The private application uses Vite, React, TypeScript, Tailwind CSS, Express, tRPC, Drizzle, MySQL/TiDB, Manus OAuth, protected S3-compatible project storage, and a server-side built-in LLM. The web client never receives the database or AI credentials.

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
