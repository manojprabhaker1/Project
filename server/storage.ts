import { 
  users, type User, type InsertUser,
  tools, type Tool, type InsertTool,
  sessions, type Session, type InsertSession,
  creditTransactions, type CreditTransaction, type InsertCreditTransaction
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserCredits(userId: number, amount: number): Promise<User>;
  getTotalUsers(): Promise<number>;
  
  // Tool operations
  getTool(id: number): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  getAllTools(): Promise<Tool[]>;
  
  // Session operations
  getSessionById(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  getUserSessions(userId: number): Promise<Session[]>;
  getActiveUserSessions(userId: number): Promise<Session[]>;
  endSession(id: number, creditsUsed: number): Promise<Session>;
  updateSessionProcess(id: number, processId: string): Promise<Session>;
  getUserSessionHistory(userId: number): Promise<Session[]>;
  getTotalActiveSessions(): Promise<number>;
  
  // Credit operations
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  getUserCreditTransactions(userId: number): Promise<CreditTransaction[]>;
  getTotalCreditsUsed(): Promise<number>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tools: Map<number, Tool>;
  private sessions: Map<number, Session>;
  private creditTransactions: Map<number, CreditTransaction>;
  private userIdCounter: number;
  private toolIdCounter: number;
  private sessionIdCounter: number;
  private transactionIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.tools = new Map();
    this.sessions = new Map();
    this.creditTransactions = new Map();
    this.userIdCounter = 1;
    this.toolIdCounter = 1;
    this.sessionIdCounter = 1;
    this.transactionIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with default tools
    this.initializeTools();
  }

  private initializeTools() {
    const defaultTools: InsertTool[] = [
      {
        name: "VS Code",
        description: "Code editor for all languages",
        icon: "code",
        creditsPerHour: 10,
        isActive: true,
      },
      {
        name: "RStudio",
        description: "IDE for R programming",
        icon: "bar_chart",
        creditsPerHour: 12,
        isActive: true,
      },
      {
        name: "Jupyter",
        description: "Notebook for data science",
        icon: "science",
        creditsPerHour: 8,
        isActive: true,
      },
      {
        name: "Orange",
        description: "Visual data mining tool",
        icon: "insights",
        creditsPerHour: 15,
        isActive: true,
      }
    ];

    defaultTools.forEach(tool => this.createTool(tool));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false, 
      credits: 100, // Start with some credits
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserCredits(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { 
      ...user, 
      credits: user.credits + amount 
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getTotalUsers(): Promise<number> {
    return this.users.size;
  }

  // Tool operations
  async getTool(id: number): Promise<Tool | undefined> {
    return this.tools.get(id);
  }

  async createTool(insertTool: InsertTool): Promise<Tool> {
    const id = this.toolIdCounter++;
    const tool: Tool = { ...insertTool, id };
    this.tools.set(id, tool);
    return tool;
  }

  async getAllTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  // Session operations
  async getSessionById(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const now = new Date();
    const session: Session = { 
      ...insertSession, 
      id, 
      startTime: now, 
      endTime: null,
      creditsUsed: 0,
      processId: null
    };
    this.sessions.set(id, session);
    return session;
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getActiveUserSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.status === 'active')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async endSession(id: number, creditsUsed: number): Promise<Session> {
    const session = await this.getSessionById(id);
    if (!session) {
      throw new Error("Session not found");
    }
    
    const now = new Date();
    const updatedSession: Session = { 
      ...session, 
      status: 'completed', 
      endTime: now,
      creditsUsed
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async updateSessionProcess(id: number, processId: string): Promise<Session> {
    const session = await this.getSessionById(id);
    if (!session) {
      throw new Error("Session not found");
    }
    
    const updatedSession: Session = { 
      ...session, 
      processId 
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserSessionHistory(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getTotalActiveSessions(): Promise<number> {
    return Array.from(this.sessions.values())
      .filter(session => session.status === 'active')
      .length;
  }

  // Credit operations
  async createCreditTransaction(insertTransaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const transaction: CreditTransaction = { 
      ...insertTransaction, 
      id, 
      transactionTime: now 
    };
    this.creditTransactions.set(id, transaction);
    return transaction;
  }

  async getUserCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime());
  }

  async getTotalCreditsUsed(): Promise<number> {
    return Array.from(this.creditTransactions.values())
      .filter(transaction => transaction.amount < 0)
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  }
}

export const storage = new MemStorage();
