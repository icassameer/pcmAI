import { pgTable, serial, text, timestamp, integer, numeric, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { productsTable } from "./products";
import { tenantsTable } from "./tenants";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  invoiceNo: text("invoice_no").notNull(),
  saleDate: timestamp("sale_date", { withTimezone: true }).notNull(),
  customerId: integer("customer_id").references(() => customersTable.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  customerGstin: text("customer_gstin"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  balanceDue: numeric("balance_due", { precision: 14, scale: 2 }).notNull().default("0"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  isInterState: text("is_inter_state").notNull().default("false"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("sales_tenant_idx").on(table.tenantId),
  index("sales_date_idx").on(table.saleDate),
  index("sales_customer_idx").on(table.customerId),
  index("sales_invoice_idx").on(table.invoiceNo),
  // invoice_no is unique per tenant, not globally
  unique("sales_tenant_invoice_no_unique").on(table.tenantId, table.invoiceNo),
]);

export const saleItemsTable = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  saleId: integer("sale_id").notNull().references(() => salesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull(),
  cgst: numeric("cgst", { precision: 12, scale: 2 }).notNull().default("0"),
  sgst: numeric("sgst", { precision: 12, scale: 2 }).notNull().default("0"),
  igst: numeric("igst", { precision: 12, scale: 2 }).notNull().default("0"),
  hsnCode: text("hsn_code"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
