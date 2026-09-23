import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createPlanAndMarkDirty: vi.fn(),
  createWardrobeItem: vi.fn(),
  listWardrobeItemsForUser: vi.fn(),
  listWearHistoryForUser: vi.fn(),
  markAllGarmentsClean: vi.fn(),
  removeWardrobeItem: vi.fn(),
}));
const llmMocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
  listLLMModels: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/llm", () => llmMocks);
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { wardrobeRouter } from "./wardrobe";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function caller() {
  const user: AuthenticatedUser = {
    id: 7,
    openId: "wear-test-user",
    email: "wear@test.example",
    name: "Wear Test",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return wardrobeRouter.createCaller({ user } as TrpcContext);
}

beforeEach(() => vi.clearAllMocks());

describe("wardrobe planning", () => {
  it("records a dated plan and delegates marking exact items dirty", async () => {
    dbMocks.createPlanAndMarkDirty.mockResolvedValue({ outfitId: 81, snapshot: [{ id: 11, name: "Navy tee" }] });

    const result = await caller().plan({
      title: "Navy tee and shorts",
      itemIds: [11, 12],
      rationale: "Easy everyday look.",
      occasion: "Everyday",
      planDate: "2026-09-23",
    });

    expect(result).toEqual({ success: true, outfitId: 81, snapshot: [{ id: 11, name: "Navy tee" }] });
    expect(dbMocks.createPlanAndMarkDirty).toHaveBeenCalledWith(7, expect.objectContaining({ itemIds: [11, 12], planDate: "2026-09-23" }));
  });

  it("exposes export-ready history JSON and supports laundry reset", async () => {
    dbMocks.listWearHistoryForUser.mockResolvedValue([{ planId: 1, planDate: "2026-09-23", items: [] }]);

    const history = await caller().history();
    const laundry = await caller().laundry();

    expect(history.version).toBe("wearwise.wear-history/v1");
    expect(history.entries).toHaveLength(1);
    expect(laundry).toEqual({ success: true });
    expect(dbMocks.markAllGarmentsClean).toHaveBeenCalledWith(7);
  });

  it("never offers a dirty garment to the AI stylist", async () => {
    dbMocks.listWardrobeItemsForUser.mockResolvedValue([
      { id: 1, name: "Clean tee", category: "tops", primaryColor: "Navy", seasons: "all-season", formality: "casual", laundryStatus: "clean" },
      { id: 2, name: "Clean shorts", category: "bottoms", primaryColor: "Khaki", seasons: "summer", formality: "casual", laundryStatus: "clean" },
      { id: 3, name: "Dirty tee", category: "tops", primaryColor: "Black", seasons: "all-season", formality: "casual", laundryStatus: "dirty" },
    ]);
    llmMocks.listLLMModels.mockResolvedValue({ data: [{ id: "gpt-5-mini" }] });
    llmMocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ title: "Clean look", itemIds: [1, 2], rationale: "Good", layerNote: "Light", finishingTouch: "Cap" }) } }] });

    const suggestion = await caller().suggest({ temperature: 70, condition: "Clear skies", occasion: "Weekend" });

    expect(suggestion.itemIds).toEqual([1, 2]);
    expect(llmMocks.invokeLLM.mock.calls[0]?.[0].messages[1].content).not.toContain("Dirty tee");
  });
});
