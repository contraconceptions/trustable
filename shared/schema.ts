import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordId: varchar("discord_id").notNull().unique(),
  username: text("username").notNull(),
  discriminator: varchar("discriminator", { length: 4 }),
  avatarUrl: text("avatar_url"),
  totalRatings: integer("total_ratings").notNull().default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const servers = pgTable("servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordServerId: varchar("discord_server_id").notNull().unique(),
  name: text("name").notNull(),
  iconUrl: text("icon_url"),
  memberCount: integer("member_count").default(0),
  totalRatings: integer("total_ratings").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ratedUserId: varchar("rated_user_id").notNull().references(() => users.id),
  raterUserId: varchar("rater_user_id").notNull().references(() => users.id),
  serverId: varchar("server_id").notNull().references(() => servers.id),
  rating: integer("rating").notNull(), // 1-3 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rateLimits = pgTable("rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  targetUserId: varchar("target_user_id").notNull().references(() => users.id),
  lastRatedAt: timestamp("last_rated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ratingsGiven: many(ratings, { relationName: "rater" }),
  ratingsReceived: many(ratings, { relationName: "rated" }),
  rateLimitsAsUser: many(rateLimits, { relationName: "user" }),
  rateLimitsAsTarget: many(rateLimits, { relationName: "target" }),
}));

export const serversRelations = relations(servers, ({ many }) => ({
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  ratedUser: one(users, {
    fields: [ratings.ratedUserId],
    references: [users.id],
    relationName: "rated",
  }),
  raterUser: one(users, {
    fields: [ratings.raterUserId],
    references: [users.id],
    relationName: "rater",
  }),
  server: one(servers, {
    fields: [ratings.serverId],
    references: [servers.id],
  }),
}));

export const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
  user: one(users, {
    fields: [rateLimits.userId],
    references: [users.id],
    relationName: "user",
  }),
  targetUser: one(users, {
    fields: [rateLimits.targetUserId],
    references: [users.id],
    relationName: "target",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServerSchema = createInsertSchema(servers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().min(1).max(3),
});

export const insertRateLimitSchema = createInsertSchema(rateLimits).omit({
  id: true,
  lastRatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Server = typeof servers.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;

// Additional types for API responses
export type UserWithRatings = User & {
  ratingsReceived: (Rating & { raterUser: User; server: Server })[];
  ratingsGiven: (Rating & { ratedUser: User; server: Server })[];
};

export type DashboardStats = {
  totalUsers: number;
  totalRatings: number;
  activeServers: number;
  averageRating: number;
};

export type RecentRating = Rating & {
  ratedUser: User;
  raterUser: User;
  server: Server;
};

export type TopRatedUser = User & {
  rank: number;
  serverCount: number;
};
