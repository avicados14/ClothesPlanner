import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertWardrobeItem, outfitPlans, savedOutfits, users, wardrobeItems } from "../drizzle/schema";
import { ENV } from "./_core/env";

export type OutfitSnapshotItem = {
  id: number;
  name: string;
  category: string;
  primaryColor: string;
  imageUrl: string;
};

export type PlannedOutfitInput = {
  title: string;
  itemIds: number[];
  rationale: string;
  occasion: string;
  note?: string;
  planDate: string;
};

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listWardrobeItemsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wardrobeItems).where(eq(wardrobeItems.userId, userId)).orderBy(desc(wardrobeItems.createdAt));
}

export async function createWardrobeItem(item: InsertWardrobeItem) {
  const db = await getDb();
  if (!db) throw new Error("Your wardrobe is temporarily unavailable. Please try again.");
  await db.insert(wardrobeItems).values(item);
}

export async function removeWardrobeItem(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Your wardrobe is temporarily unavailable. Please try again.");
  await db.delete(wardrobeItems).where(and(eq(wardrobeItems.userId, userId), eq(wardrobeItems.id, itemId)));
}

/** Atomically records a dated outfit and makes every selected garment unavailable until laundry. */
export async function createPlanAndMarkDirty(userId: number, plan: PlannedOutfitInput) {
  const db = await getDb();
  if (!db) throw new Error("Your wardrobe is temporarily unavailable. Please try again.");

  return db.transaction(async (tx) => {
    const selectedItems = await tx.select().from(wardrobeItems).where(and(
      eq(wardrobeItems.userId, userId),
      inArray(wardrobeItems.id, plan.itemIds),
    ));
    if (selectedItems.length !== plan.itemIds.length) throw new Error("One or more selected garments no longer belong to your closet.");
    const unavailable = selectedItems.find((item) => item.laundryStatus !== "clean");
    if (unavailable) throw new Error(`${unavailable.name} is marked dirty. Run laundry before planning it again.`);

    const snapshot: OutfitSnapshotItem[] = selectedItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      primaryColor: item.primaryColor,
      imageUrl: item.imageUrl,
    }));
    const result = await tx.insert(savedOutfits).values({
      userId,
      title: plan.title,
      itemIds: JSON.stringify(plan.itemIds),
      itemSnapshot: JSON.stringify(snapshot),
      rationale: plan.rationale,
    }).$returningId();
    const outfitId = result[0]?.id;
    if (!outfitId) throw new Error("The outfit could not be saved.");

    await tx.insert(outfitPlans).values({
      userId,
      outfitId,
      planDate: plan.planDate,
      occasion: plan.occasion,
      note: plan.note || null,
    });
    await tx.update(wardrobeItems).set({ laundryStatus: "dirty" }).where(and(
      eq(wardrobeItems.userId, userId),
      inArray(wardrobeItems.id, plan.itemIds),
    ));

    return { outfitId, snapshot };
  });
}

/** Marks every garment in a user's closet clean in one explicit laundry action. */
export async function markAllGarmentsClean(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Your wardrobe is temporarily unavailable. Please try again.");
  const result = await db.update(wardrobeItems).set({ laundryStatus: "clean", lastLaunderedAt: new Date() }).where(eq(wardrobeItems.userId, userId));
  return result;
}

/** Returns immutable plan records; snapshots stay readable even if a garment is later edited or removed. */
export async function listWearHistoryForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    planId: outfitPlans.id,
    planDate: outfitPlans.planDate,
    occasion: outfitPlans.occasion,
    note: outfitPlans.note,
    plannedAt: outfitPlans.createdAt,
    outfitId: savedOutfits.id,
    title: savedOutfits.title,
    itemIds: savedOutfits.itemIds,
    itemSnapshot: savedOutfits.itemSnapshot,
    rationale: savedOutfits.rationale,
  }).from(outfitPlans).innerJoin(savedOutfits, eq(outfitPlans.outfitId, savedOutfits.id)).where(eq(outfitPlans.userId, userId)).orderBy(desc(outfitPlans.planDate), desc(outfitPlans.createdAt));

  return rows.map((row) => ({
    ...row,
    itemIds: parseJsonArray<number>(row.itemIds),
    items: parseJsonArray<OutfitSnapshotItem>(row.itemSnapshot),
  }));
}

function parseJsonArray<T>(value: string | null): T[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}
