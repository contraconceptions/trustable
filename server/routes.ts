import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { insertRatingSchema } from "@shared/schema";
import { startBot, getBotStats } from "./bot";

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.get("/auth/discord", passport.authenticate("discord"));
  
  app.get("/auth/discord/callback", 
    passport.authenticate("discord", { failureRedirect: "https://trustable.contraconcepts.com/" }),
    (req, res) => {
      res.redirect("https://trustable.contraconcepts.com/dashboard");
    }
  );
  
  app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect("https://trustable.contraconcepts.com/");
    });
  });
  
  app.get("/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Bot status endpoint
  app.get("/api/bot/status", (req, res) => {
    try {
      const botStats = getBotStats();
      res.json(botStats);
    } catch (error) {
      console.error("Error fetching bot stats:", error);
      res.status(500).json({ message: "Failed to fetch bot status" });
    }
  });

  // Recent ratings endpoint
  app.get("/api/ratings/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recentRatings = await storage.getRecentRatings(limit);
      res.json(recentRatings);
    } catch (error) {
      console.error("Error fetching recent ratings:", error);
      res.status(500).json({ message: "Failed to fetch recent ratings" });
    }
  });

  // Top rated users endpoint
  app.get("/api/users/top", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topUsers = await storage.getTopRatedUsers(limit);
      res.json(topUsers);
    } catch (error) {
      console.error("Error fetching top users:", error);
      res.status(500).json({ message: "Failed to fetch top users" });
    }
  });

  // Get user by Discord ID
  app.get("/api/users/discord/:discordId", async (req, res) => {
    try {
      const { discordId } = req.params;
      const user = await storage.getUserByDiscordId(discordId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userWithRatings = await storage.getUserWithRatings(user.id);
      res.json(userWithRatings);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user ratings
  app.get("/api/users/:userId/ratings", async (req, res) => {
    try {
      const { userId } = req.params;
      const ratings = await storage.getRatingsByUser(userId);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching user ratings:", error);
      res.status(500).json({ message: "Failed to fetch user ratings" });
    }
  });

  // Personal dashboard for authenticated users
  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const userWithRatings = await storage.getUserWithRatings(user.id);
      res.json(userWithRatings);
    } catch (error) {
      console.error("Error fetching personal data:", error);
      res.status(500).json({ message: "Failed to fetch personal data" });
    }
  });

  // Get personal ratings received
  app.get("/api/me/ratings", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const ratings = await storage.getRatingsByUser(user.id);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching personal ratings:", error);
      res.status(500).json({ message: "Failed to fetch personal ratings" });
    }
  });

  // Create rating (internal API for bot)
  app.post("/api/ratings", async (req, res) => {
    try {
      const validatedData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(400).json({ message: "Invalid rating data" });
    }
  });

  // Check if user can rate another user
  app.get("/api/rate-limit/:userId/:targetUserId", async (req, res) => {
    try {
      const { userId, targetUserId } = req.params;
      const canRate = await storage.canUserRate(userId, targetUserId);
      res.json({ canRate });
    } catch (error) {
      console.error("Error checking rate limit:", error);
      res.status(500).json({ message: "Failed to check rate limit" });
    }
  });

  const httpServer = createServer(app);

  // Start the Discord bot
  if (process.env.DISCORD_BOT_TOKEN) {
    startBot().catch(console.error);
  } else {
    console.warn("DISCORD_BOT_TOKEN not provided - bot will not start");
  }

  return httpServer;
}
