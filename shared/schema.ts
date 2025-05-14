import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  credits: integer("credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

// Development Tools Table
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  creditsPerHour: integer("credits_per_hour").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertToolSchema = createInsertSchema(tools).pick({
  name: true,
  description: true,
  icon: true,
  creditsPerHour: true,
  isActive: true,
});

// Sessions Table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  toolId: integer("tool_id").notNull().references(() => tools.id),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  creditsUsed: integer("credits_used").default(0),
  status: text("status").notNull(), // 'active', 'completed', 'terminated'
  processId: text("process_id"),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  toolId: true,
  status: true,
});

// Credit Transactions Table
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  transactionTime: timestamp("transaction_time").defaultNow().notNull(),
  performedBy: integer("performed_by").references(() => users.id),
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).pick({
  userId: true,
  amount: true,
  description: true,
  performedBy: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
