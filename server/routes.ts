import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startJupyterInstance, stopJupyterInstance, checkJupyterStatus } from "./jupyter";
import { z } from "zod";
import { insertSessionSchema, insertCreditTransactionSchema } from "@shared/schema";

// Helper function for requiring user to be authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

// Helper function for requiring user to be an admin
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // User profile endpoint
  app.get("/api/profile", requireAuth, async (req, res) => {
    res.json(req.user);
  });

  // Get all development tools
  app.get("/api/tools", requireAuth, async (req, res) => {
    const tools = await storage.getAllTools();
    res.json(tools);
  });

  // Get user sessions
  app.get("/api/sessions", requireAuth, async (req, res) => {
    const userId = req.user.id;
    const sessions = await storage.getUserSessions(userId);
    res.json(sessions);
  });

  // Get active sessions for a user
  app.get("/api/sessions/active", requireAuth, async (req, res) => {
    const userId = req.user.id;
    const sessions = await storage.getActiveUserSessions(userId);
    res.json(sessions);
  });

  // Start a new tool session
  app.post("/api/sessions", requireAuth, async (req, res) => {
    const userId = req.user.id;
    const parsedBody = insertSessionSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ message: "Invalid session data" });
    }
    
    const { toolId } = parsedBody.data;
    
    // Check if user has enough credits
    const user = await storage.getUser(userId);
    const tool = await storage.getTool(toolId);
    
    if (!user || !tool) {
      return res.status(404).json({ message: "User or tool not found" });
    }
    
    if (user.credits < tool.creditsPerHour) {
      return res.status(400).json({ message: "Not enough credits" });
    }
    
    // For Jupyter specific handling
    if (tool.name.toLowerCase().includes("jupyter")) {
      try {
        const jupyterInfo = await startJupyterInstance();
        
        if (!jupyterInfo) {
          return res.status(500).json({ message: "Failed to start Jupyter instance" });
        }
        
        // Create the session
        const session = await storage.createSession({
          userId,
          toolId,
          status: "active",
        });
        
        // Update the session with process ID
        await storage.updateSessionProcess(session.id, jupyterInfo.processId);
        
        res.status(201).json({
          ...session,
          toolName: tool.name,
          jupyterUrl: jupyterInfo.url,
          token: jupyterInfo.token
        });
      } catch (error) {
        console.error("Failed to start Jupyter:", error);
        res.status(500).json({ message: "Failed to start Jupyter instance" });
      }
    } else {
      // For other tools, just create a session record
      // In a real application, this would launch the actual tool
      const session = await storage.createSession({
        userId,
        toolId,
        status: "active",
      });
      
      res.status(201).json({
        ...session,
        toolName: tool.name
      });
    }
  });

  // End a session
  app.post("/api/sessions/:id/end", requireAuth, async (req, res) => {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const session = await storage.getSessionById(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    if (session.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to end this session" });
    }
    
    // If it's a Jupyter session, stop the process
    if (session.processId) {
      try {
        await stopJupyterInstance(session.processId);
      } catch (error) {
        console.error("Error stopping Jupyter instance:", error);
        // Continue with ending the session even if stopping the process fails
      }
    }
    
    // Calculate credits used
    const tool = await storage.getTool(session.toolId);
    if (!tool) {
      return res.status(500).json({ message: "Tool not found" });
    }
    
    const startTime = new Date(session.startTime);
    const endTime = new Date();
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const creditsUsed = Math.ceil(durationHours * tool.creditsPerHour);
    
    // Update session
    const updatedSession = await storage.endSession(sessionId, creditsUsed);
    
    // Deduct credits from user
    await storage.updateUserCredits(userId, -creditsUsed);
    
    // Record credit transaction
    await storage.createCreditTransaction({
      userId,
      amount: -creditsUsed,
      description: `Used ${creditsUsed} credits for ${tool.name} session`,
      performedBy: userId,
    });
    
    res.json(updatedSession);
  });

  // Admin: Get all users
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Admin: Add credits to a user
  app.post("/api/admin/credits", requireAdmin, async (req, res) => {
    const parsedBody = insertCreditTransactionSchema.safeParse(req.body);
    
    if (!parsedBody.success) {
      return res.status(400).json({ message: "Invalid credit transaction data" });
    }
    
    const { userId, amount, description } = parsedBody.data;
    const adminId = req.user.id;
    
    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add credits to user
    await storage.updateUserCredits(userId, amount);
    
    // Record transaction
    const transaction = await storage.createCreditTransaction({
      userId,
      amount,
      description,
      performedBy: adminId,
    });
    
    res.status(201).json(transaction);
  });

  // Check Jupyter status
  app.get("/api/jupyter/status/:processId", requireAuth, async (req, res) => {
    const { processId } = req.params;
    
    try {
      const status = await checkJupyterStatus(processId);
      res.json({ status });
    } catch (error) {
      res.status(500).json({ message: "Failed to check Jupyter status" });
    }
  });

  // Get user credit history
  app.get("/api/credits/history", requireAuth, async (req, res) => {
    const userId = req.user.id;
    const transactions = await storage.getUserCreditTransactions(userId);
    res.json(transactions);
  });

  // Get user session history
  app.get("/api/sessions/history", requireAuth, async (req, res) => {
    const userId = req.user.id;
    const sessions = await storage.getUserSessionHistory(userId);
    res.json(sessions);
  });

  // Admin: Get usage statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    const totalUsers = await storage.getTotalUsers();
    const totalActiveSessions = await storage.getTotalActiveSessions();
    const totalCreditsUsed = await storage.getTotalCreditsUsed();
    
    res.json({
      totalUsers,
      totalActiveSessions,
      totalCreditsUsed
    });
  });

  return httpServer;
}
