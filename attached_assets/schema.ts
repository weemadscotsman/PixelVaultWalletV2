export const staking_pools = pgTable("staking_pools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  apy: numeric("apy").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});