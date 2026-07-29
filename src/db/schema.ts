import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedBills = pgTable("saved_bills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  billId: text("bill_id").notNull(),
  billTitle: text("bill_title").notNull(),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  savedBills: many(savedBills),
}));

export const savedBillsRelations = relations(savedBills, ({ one }) => ({
  user: one(users, {
    fields: [savedBills.userId],
    references: [users.id],
  }),
}));
