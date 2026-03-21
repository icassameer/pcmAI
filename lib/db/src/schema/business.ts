import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessProfileTable = pgTable("business_profile", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("My Business"),
  address: text("address"),
  gstin: text("gstin"),
  state: text("state"),
  phone: text("phone"),
  email: text("email"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  bankIfsc: text("bank_ifsc"),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  nextInvoiceNum: integer("next_invoice_num").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfileTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfileTable.$inferSelect;
