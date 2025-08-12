import { 
  users, 
  servers, 
  ratings, 
  rateLimits,
  type User, 
  type InsertUser,
  type Server,
  type InsertServer,
  type Rating,
  type InsertRating,
  type RateLimit,
  type InsertRateLimit,
  type DashboardStats,
  type RecentRating,
  type TopRatedUser,
  type UserWithRatings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  
  // Server operations
  getServer(id: string): Promise<Server | undefined>;
  getServerByDiscordId(discordServerId: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: string, server: Partial<InsertServer>): Promise<Server>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByUser(userId: string): Promise<Rating[]>;
  getRecentRatings(limit?: number): Promise<RecentRating[]>;
  
  // Rate limiting
  createRateLimit(rateLimit: InsertRateLimit): Promise<RateLimit>;
  getRateLimit(userId: string, targetUserId: string): Promise<RateLimit | undefined>;
  updateRateLimit(userId: string, targetUserId: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<DashboardStats>;
  getTopRatedUsers(limit?: number): Promise<TopRatedUser[]>;
  getUserWithRatings(userId: string): Promise<UserWithRatings | undefined>;
  
  // Rate limiting check
  canUserRate(userId: string, targetUserId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getServer(id: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server || undefined;
  }

  async getServerByDiscordId(discordServerId: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.discordServerId, discordServerId));
    return server || undefined;
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const [server] = await db.insert(servers).values(insertServer).returning();
    return server;
  }

  async updateServer(id: string, updateData: Partial<InsertServer>): Promise<Server> {
    const [server] = await db
      .update(servers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(servers.id, id))
      .returning();
    return server;
  }

  async createRating(insertRating: InsertRating): Promise<Rating> {
    const [rating] = await db.insert(ratings).values(insertRating).returning();
    
    // Update user's average rating and total ratings
    const userRatings = await db
      .select({ avg: sql<number>`avg(${ratings.rating})`, count: sql<number>`count(*)` })
      .from(ratings)
      .where(eq(ratings.ratedUserId, insertRating.ratedUserId));

    if (userRatings[0]) {
      await db
        .update(users)
        .set({
          averageRating: Number(userRatings[0].avg).toFixed(2),
          totalRatings: Number(userRatings[0].count),
          updatedAt: new Date()
        })
        .where(eq(users.id, insertRating.ratedUserId));
    }

    // Update server's total ratings
    await db
      .update(servers)
      .set({
        totalRatings: sql`${servers.totalRatings} + 1`,
        updatedAt: new Date()
      })
      .where(eq(servers.id, insertRating.serverId));

    return rating;
  }

  async getRatingsByUser(userId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.ratedUserId, userId));
  }

  async getRecentRatings(limit: number = 10): Promise<RecentRating[]> {
    return await db
      .select({
        id: ratings.id,
        ratedUserId: ratings.ratedUserId,
        raterUserId: ratings.raterUserId,
        serverId: ratings.serverId,
        rating: ratings.rating,
        comment: ratings.comment,
        createdAt: ratings.createdAt,
        ratedUser: users,
        raterUser: sql<User>`(SELECT row_to_json(u) FROM users u WHERE u.id = ${ratings.raterUserId})`,
        server: sql<Server>`(SELECT row_to_json(s) FROM servers s WHERE s.id = ${ratings.serverId})`
      })
      .from(ratings)
      .innerJoin(users, eq(ratings.ratedUserId, users.id))
      .orderBy(desc(ratings.createdAt))
      .limit(limit);
  }

  async createRateLimit(insertRateLimit: InsertRateLimit): Promise<RateLimit> {
    const [rateLimit] = await db.insert(rateLimits).values(insertRateLimit).returning();
    return rateLimit;
  }

  async getRateLimit(userId: string, targetUserId: string): Promise<RateLimit | undefined> {
    const [rateLimit] = await db
      .select()
      .from(rateLimits)
      .where(and(eq(rateLimits.userId, userId), eq(rateLimits.targetUserId, targetUserId)));
    return rateLimit || undefined;
  }

  async updateRateLimit(userId: string, targetUserId: string): Promise<void> {
    await db
      .update(rateLimits)
      .set({ lastRatedAt: new Date() })
      .where(and(eq(rateLimits.userId, userId), eq(rateLimits.targetUserId, targetUserId)));
  }

  async canUserRate(userId: string, targetUserId: string): Promise<boolean> {
    if (userId === targetUserId) return false;

    const rateLimit = await this.getRateLimit(userId, targetUserId);
    if (!rateLimit) return true;

    // Allow rating once per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return rateLimit.lastRatedAt < oneDayAgo;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [ratingCount] = await db.select({ count: sql<number>`count(*)` }).from(ratings);
    const [serverCount] = await db.select({ count: sql<number>`count(*)` }).from(servers).where(eq(servers.isActive, true));
    const [avgRating] = await db.select({ avg: sql<number>`avg(${ratings.rating})` }).from(ratings);

    return {
      totalUsers: userCount.count,
      totalRatings: ratingCount.count,
      activeServers: serverCount.count,
      averageRating: avgRating.avg || 0
    };
  }

  async getTopRatedUsers(limit: number = 10): Promise<TopRatedUser[]> {
    const topUsers = await db
      .select({
        id: users.id,
        discordId: users.discordId,
        username: users.username,
        discriminator: users.discriminator,
        avatarUrl: users.avatarUrl,
        totalRatings: users.totalRatings,
        averageRating: users.averageRating,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        serverCount: sql<number>`count(distinct ${ratings.serverId})`
      })
      .from(users)
      .leftJoin(ratings, eq(users.id, ratings.ratedUserId))
      .where(gte(users.totalRatings, 5)) // Minimum 5 ratings to be ranked
      .groupBy(users.id)
      .orderBy(desc(users.averageRating), desc(users.totalRatings))
      .limit(limit);

    return topUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }

  async getUserWithRatings(userId: string): Promise<UserWithRatings | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const ratingsReceived = await db
      .select({
        id: ratings.id,
        ratedUserId: ratings.ratedUserId,
        raterUserId: ratings.raterUserId,
        serverId: ratings.serverId,
        rating: ratings.rating,
        comment: ratings.comment,
        createdAt: ratings.createdAt,
        raterUser: sql<User>`(SELECT row_to_json(u) FROM users u WHERE u.id = ${ratings.raterUserId})`,
        server: sql<Server>`(SELECT row_to_json(s) FROM servers s WHERE s.id = ${ratings.serverId})`
      })
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId));

    const ratingsGiven = await db
      .select({
        id: ratings.id,
        ratedUserId: ratings.ratedUserId,
        raterUserId: ratings.raterUserId,
        serverId: ratings.serverId,
        rating: ratings.rating,
        comment: ratings.comment,
        createdAt: ratings.createdAt,
        ratedUser: sql<User>`(SELECT row_to_json(u) FROM users u WHERE u.id = ${ratings.ratedUserId})`,
        server: sql<Server>`(SELECT row_to_json(s) FROM servers s WHERE s.id = ${ratings.serverId})`
      })
      .from(ratings)
      .where(eq(ratings.raterUserId, userId));

    return {
      ...user,
      ratingsReceived: ratingsReceived as any,
      ratingsGiven: ratingsGiven as any
    };
  }
}

export const storage = new DatabaseStorage();
