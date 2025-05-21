import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const staking_pools = pgTable("staking_pools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  apy: numeric("apy").notNull(),
  created_at: timestamp("created_at").defaultNow()
});