# Wearwise Action Items

## Completed

- [x] Assign and retain stable numerical database IDs for every wardrobe item.
- [x] Persist a clean-or-dirty laundry state on every garment.
- [x] Exclude dirty garments from AI outfit recommendations.
- [x] Add an **Add to plan** flow that saves a dated outfit and marks exactly its garment IDs dirty.
- [x] Add a **Laundry** reset that marks the entire closet clean.
- [x] Keep a durable wear-history record with item snapshots and expose it as versioned, downloadable JSON.
- [x] Keep the existing secure server-side AI stylist for cataloging and weather-aware outfit suggestions.

## Next after this release

- [ ] Add bulk ZIP import with duplicate detection and an approval screen.
- [ ] Add manual garment editing for category, color, and laundry state.
- [ ] Add a calendar view and a selector for existing planned outfits.
- [ ] Optionally configure a dedicated OpenAI API key for ChatGPT-only inference instead of the managed multi-model AI service.
