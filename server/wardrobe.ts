import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createPlanAndMarkDirty,
  createWardrobeItem,
  listWardrobeItemsForUser,
  listWearHistoryForUser,
  markAllGarmentsClean,
  removeWardrobeItem,
} from "./db";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const categories = ["tops", "bottoms", "outerwear", "shoes", "accessories", "one-piece", "activewear", "other"] as const;
const formalities = ["casual", "smart-casual", "business", "formal", "active"] as const;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const itemAnalysisSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "wardrobe_item_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        category: { type: "string", enum: categories },
        primaryColor: { type: "string" },
        seasons: { type: "string" },
        formality: { type: "string", enum: formalities },
      },
      required: ["name", "category", "primaryColor", "seasons", "formality"],
      additionalProperties: false,
    },
  },
};

const outfitSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "weather_outfit_recommendation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        itemIds: { type: "array", items: { type: "integer" } },
        rationale: { type: "string" },
        layerNote: { type: "string" },
        finishingTouch: { type: "string" },
      },
      required: ["title", "itemIds", "rationale", "layerNote", "finishingTouch"],
      additionalProperties: false,
    },
  },
};

type ItemAnalysis = {
  name: string;
  category: (typeof categories)[number];
  primaryColor: string;
  seasons: string;
  formality: (typeof formalities)[number];
};

function fallbackDetails(fileName: string): ItemAnalysis {
  const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
  return {
    name: cleanName ? cleanName.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Untitled garment",
    category: "other",
    primaryColor: "Unknown",
    seasons: "all-season",
    formality: "casual",
  };
}

async function preferredModel() {
  try {
    const { data } = await listLLMModels();
    return data.find((model) => model.id === "gemini-3-flash-preview")?.id
      ?? data.find((model) => model.id === "gpt-5-mini")?.id
      ?? data[0]?.id;
  } catch {
    return undefined;
  }
}

async function analyzeGarment(imageUrl: string, fileName: string): Promise<ItemAnalysis> {
  try {
    const response = await invokeLLM({
      model: await preferredModel(),
      messages: [
        {
          role: "system",
          content: "You catalog one garment photo for a private wardrobe. Identify the main wearable item, not the model or background. Use practical men's wardrobe naming. When uncertain, choose category other, seasons all-season, and formality casual. Return only the requested JSON.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this image. Original file name: ${fileName}` },
            { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
          ],
        },
      ],
      response_format: itemAnalysisSchema,
      maxTokens: 400,
    });
    const responseContent = response.choices[0]?.message?.content;
    const parsed = JSON.parse(typeof responseContent === "string" ? responseContent : "{}");
    if (!categories.includes(parsed.category) || !formalities.includes(parsed.formality)) return fallbackDetails(fileName);
    return parsed as ItemAnalysis;
  } catch {
    return fallbackDetails(fileName);
  }
}

async function storeImage(userId: number, fileName: string, mimeType: string, bytes: Buffer) {
  if (bytes.length > 8 * 1024 * 1024) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Choose an image smaller than 8 MB." });
  }
  const extension = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  return storagePut(`${userId}/closet/${nanoid()}-${safeName || "garment"}.${extension}`, bytes, mimeType);
}

export const wardrobeRouter = router({
  /** Lists all individually numbered garments and their clean/dirty availability. */
  list: protectedProcedure.query(({ ctx }) => listWardrobeItemsForUser(ctx.user.id)),

  remove: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => removeWardrobeItem(ctx.user.id, input.id).then(() => ({ success: true }))),

  upload: protectedProcedure
    .input(z.object({
      fileName: z.string().min(1).max(160),
      imageData: z.string().min(32),
    }))
    .mutation(async ({ ctx, input }) => {
      const match = input.imageData.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a JPG, PNG, WEBP, or GIF image." });
      const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
      const bytes = Buffer.from(match[2], "base64");
      const stored = await storeImage(ctx.user.id, input.fileName, mimeType, bytes);
      const details = await analyzeGarment(stored.url, input.fileName);
      await createWardrobeItem({ userId: ctx.user.id, imageUrl: stored.url, imageKey: stored.key, ...details });
      return { ...details, imageUrl: stored.url, laundryStatus: "clean" as const };
    }),

  importImage: protectedProcedure
    .input(z.object({ imageUrl: z.string().url().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      let imageUrl: URL;
      try { imageUrl = new URL(input.imageUrl); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a full direct image URL." }); }
      if (!/^https?:$/.test(imageUrl.protocol) || ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(imageUrl.hostname)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Use a public http or https image URL." });
      }
      const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000), redirect: "follow" });
      const mimeType = response.headers.get("content-type")?.split(";")[0] || "";
      if (!response.ok || !mimeType.startsWith("image/")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That link did not return a usable image. Paste a direct image link instead." });
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      const filename = imageUrl.pathname.split("/").pop()?.split("?")[0] || "imported-garment";
      const stored = await storeImage(ctx.user.id, filename, mimeType, bytes);
      const details = await analyzeGarment(stored.url, filename);
      await createWardrobeItem({ userId: ctx.user.id, imageUrl: stored.url, imageKey: stored.key, ...details });
      return { ...details, imageUrl: stored.url, laundryStatus: "clean" as const };
    }),

  /** Suggests outfits exclusively from clean garments. */
  suggest: protectedProcedure
    .input(z.object({
      temperature: z.number().min(-40).max(140),
      condition: z.string().min(1).max(100),
      occasion: z.string().min(1).max(100),
      request: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const allItems = await listWardrobeItemsForUser(ctx.user.id);
      const items = allItems.filter((item) => item.laundryStatus === "clean");
      if (items.length < 2) {
        const dirtyCount = allItems.length - items.length;
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: dirtyCount ? "Not enough clean garments for a new look. Run laundry to make your worn pieces available again." : "Add at least two garments before asking for an outfit.",
        });
      }
      const catalog = items.map((item) => `#${item.id} | ${item.name} | ${item.category} | ${item.primaryColor} | ${item.seasons} | ${item.formality}`).join("\n");
      try {
        const response = await invokeLLM({
          model: await preferredModel(),
          messages: [
            {
              role: "system",
              content: "You are Wearwise, a concise personal stylist. Build a wearable, weather-appropriate outfit from ONLY supplied clean catalog items. The wardrobe owner is male; offer grounded contemporary menswear, without stereotypes or invented items. Prioritize a complete look (top, bottom, shoes if available), color harmony, and realistic layering. Avoid repeating an item ID. Return only requested JSON.",
            },
            {
              role: "user",
              content: `Weather: ${input.temperature}°F, ${input.condition}. Occasion: ${input.occasion}. Personal note: ${input.request || "None"}.\n\nClean wardrobe catalog:\n${catalog}`,
            },
          ],
          response_format: outfitSchema,
          maxTokens: 700,
        });
        const responseContent = response.choices[0]?.message?.content;
        const result = JSON.parse(typeof responseContent === "string" ? responseContent : "{}");
        const allowedIds = new Set(items.map((item) => item.id));
        const itemIds = Array.from(new Set((result.itemIds || []).filter((id: unknown) => typeof id === "number" && allowedIds.has(id))));
        if (itemIds.length < 2) throw new Error("Insufficient matching items");
        return { ...result, itemIds };
      } catch {
        const preferred = items.filter((item) => item.formality === "smart-casual" || item.formality === "casual").slice(0, 3);
        return {
          title: "Easy, weather-ready base",
          itemIds: preferred.length >= 2 ? preferred.map((item) => item.id) : items.slice(0, 3).map((item) => item.id),
          rationale: "A simple combination drawn only from the clean pieces you have already cataloged.",
          layerNote: input.temperature < 59 ? "Bring your warmest outer layer before heading out." : "Keep the silhouette light and comfortable.",
          finishingTouch: "Adjust with your preferred watch, bag, or cap.",
        };
      }
    }),

  /** Creates a dated wear-history entry and marks its exact garment IDs dirty. */
  plan: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(160),
      itemIds: z.array(z.number().int().positive()).min(2).max(8).refine((ids) => new Set(ids).size === ids.length, "Choose each garment only once."),
      rationale: z.string().max(1500).default(""),
      occasion: z.string().min(1).max(100),
      note: z.string().max(500).optional(),
      planDate: z.string().regex(datePattern, "Use a YYYY-MM-DD date."),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createPlanAndMarkDirty(ctx.user.id, input);
        return { success: true as const, ...result };
      } catch (error) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "This outfit could not be planned." });
      }
    }),

  /** One explicit reset for the whole closet after a laundry load. */
  laundry: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllGarmentsClean(ctx.user.id);
    return { success: true as const };
  }),

  /** Versioned, export-ready JSON that refreshes every time a plan is added. */
  history: protectedProcedure.query(async ({ ctx }) => ({
    version: "wearwise.wear-history/v1",
    generatedAt: new Date().toISOString(),
    entries: await listWearHistoryForUser(ctx.user.id),
  })),
});
