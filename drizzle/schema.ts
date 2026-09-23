import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const wardrobeItems = mysqlTable("wardrobeItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: mysqlEnum("category", ["tops", "bottoms", "outerwear", "shoes", "accessories", "one-piece", "activewear", "other"]).default("other").notNull(),
  primaryColor: varchar("primaryColor", { length: 64 }).default("Unknown").notNull(),
  seasons: varchar("seasons", { length: 120 }).default("all-season").notNull(),
  formality: mysqlEnum("formality", ["casual", "smart-casual", "business", "formal", "active"]).default("casual").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const savedOutfits = mysqlTable("savedOutfits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 160 }).notNull(),
  itemIds: text("itemIds").notNull(),
  rationale: text("rationale"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const outfitPlans = mysqlTable("outfitPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  outfitId: int("outfitId").references(() => savedOutfits.id),
  planDate: varchar("planDate", { length: 10 }).notNull(),
  occasion: varchar("occasion", { length: 120 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WardrobeItem = typeof wardrobeItems.$inferSelect;
export type InsertWardrobeItem = typeof wardrobeItems.$inferInsert;
