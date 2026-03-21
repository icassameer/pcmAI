import { pgTable, serial, text, boolean, timestamp, integer, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";
import { suppliersTable } from "./suppliers";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  brand: text("brand"),
  hsnCode: text("hsn_code"),
  unit: text("unit").notNull().default("pcs"),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
  mrp: numeric("mrp", { precision: 12, scale: 2 }).notNull().default("0"),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull().default("18"),
  currentStock: numeric("current_stock", { precision: 12, scale: 2 }).notNull().default("0"),
  minStockAlert: numeric("min_stock_alert", { precision: 12, scale: 2 }).notNull().default("10"),
  location: text("location"),
  sku: text("sku"),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("products_name_idx").on(table.name),
  index("products_sku_idx").on(table.sku),
  index("products_category_idx").on(table.categoryId),
]);

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
