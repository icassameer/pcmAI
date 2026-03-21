import { Router, type IRouter } from "express";
import { sql, gte, lte, and, eq } from "drizzle-orm";
import { db, salesTable, purchasesTable, productsTable, saleItemsTable, purchaseItemsTable, categoriesTable } from "@workspace/db";
import {
  GetSalesSummaryReportQueryParams,
  GetSalesSummaryReportResponse,
  GetPurchaseSummaryReportQueryParams,
  GetPurchaseSummaryReportResponse,
  GetInventoryReportQueryParams,
  GetInventoryReportResponse,
  GetGstSummaryReportQueryParams,
  GetGstSummaryReportResponse,
} from "@workspace/api-zod";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/reports/sales-summary", authMiddleware, async (req, res): Promise<void> => {
  const params = GetSalesSummaryReportQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { period = "monthly", startDate, endDate } = params.data;

  const conditions: any[] = [];
  if (startDate) conditions.push(gte(salesTable.saleDate, new Date(startDate)));
  if (endDate) conditions.push(lte(salesTable.saleDate, new Date(endDate)));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totals] = await db.select({
    totalSales: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`,
    totalTax: sql<number>`COALESCE(SUM(tax_amount::numeric), 0)`,
    totalDiscount: sql<number>`COALESCE(SUM(discount::numeric), 0)`,
    netAmount: sql<number>`COALESCE(SUM(subtotal::numeric), 0)`,
    transactionCount: sql<number>`count(*)::int`,
  }).from(salesTable).where(whereClause);

  let dateFormat: string;
  switch (period) {
    case "daily": dateFormat = "YYYY-MM-DD"; break;
    case "weekly": dateFormat = "IYYY-IW"; break;
    case "annual": dateFormat = "YYYY"; break;
    default: dateFormat = "YYYY-MM"; break;
  }

  const breakdownQuery = await db.execute(sql`
    SELECT
      to_char(sale_date, ${dateFormat}) as period,
      COALESCE(SUM(grand_total::numeric), 0) as sales,
      COALESCE(SUM(tax_amount::numeric), 0) as tax,
      count(*)::int as count
    FROM sales
    ${startDate ? sql`WHERE sale_date >= ${new Date(startDate)}` : sql``}
    ${endDate ? sql`AND sale_date <= ${new Date(endDate)}` : sql``}
    GROUP BY to_char(sale_date, ${dateFormat})
    ORDER BY period DESC
  `);

  res.json({
    totalSales: Number(totals.totalSales),
    totalTax: Number(totals.totalTax),
    totalDiscount: Number(totals.totalDiscount),
    netAmount: Number(totals.netAmount),
    transactionCount: totals.transactionCount,
    breakdown: breakdownQuery.rows.map((r: any) => ({
      period: r.period,
      sales: Number(r.sales),
      tax: Number(r.tax),
      count: Number(r.count),
    })),
  });
});

router.get("/reports/purchase-summary", authMiddleware, async (req, res): Promise<void> => {
  const params = GetPurchaseSummaryReportQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { startDate, endDate } = params.data;

  const conditions: any[] = [];
  if (startDate) conditions.push(gte(purchasesTable.invoiceDate, new Date(startDate)));
  if (endDate) conditions.push(lte(purchasesTable.invoiceDate, new Date(endDate)));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totals] = await db.select({
    totalPurchases: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`,
    totalTax: sql<number>`COALESCE(SUM(tax_amount::numeric), 0)`,
    totalDiscount: sql<number>`COALESCE(SUM(discount::numeric), 0)`,
    netAmount: sql<number>`COALESCE(SUM(subtotal::numeric), 0)`,
    transactionCount: sql<number>`count(*)::int`,
    pendingPayments: sql<number>`COALESCE(SUM(CASE WHEN payment_status != 'paid' THEN balance_due::numeric ELSE 0 END), 0)`,
  }).from(purchasesTable).where(whereClause);

  res.json({
    totalPurchases: Number(totals.totalPurchases),
    totalTax: Number(totals.totalTax),
    totalDiscount: Number(totals.totalDiscount),
    netAmount: Number(totals.netAmount),
    transactionCount: totals.transactionCount,
    pendingPayments: Number(totals.pendingPayments),
  });
});

router.get("/reports/inventory", authMiddleware, async (req, res): Promise<void> => {
  const params = GetInventoryReportQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { type = "current", categoryId } = params.data;

  const conditions: any[] = [eq(productsTable.active, true)];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));

  if (type === "low-stock") {
    conditions.push(sql`${productsTable.currentStock}::numeric <= ${productsTable.minStockAlert}::numeric AND ${productsTable.currentStock}::numeric > 0`);
  } else if (type === "out-of-stock") {
    conditions.push(sql`${productsTable.currentStock}::numeric <= 0`);
  } else if (type === "dead-stock") {
    conditions.push(sql`NOT EXISTS (
      SELECT 1 FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE si.product_id = ${productsTable.id}
      AND s.sale_date >= NOW() - INTERVAL '90 days'
    )`);
  }

  const whereClause = and(...conditions);

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      sku: productsTable.sku,
      category: categoriesTable.name,
      currentStock: productsTable.currentStock,
      unit: productsTable.unit,
      purchasePrice: productsTable.purchasePrice,
      sellingPrice: productsTable.sellingPrice,
      minStockAlert: productsTable.minStockAlert,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(whereClause)
    .orderBy(productsTable.name);

  const items = products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    currentStock: Number(p.currentStock),
    unit: p.unit,
    purchasePrice: Number(p.purchasePrice),
    sellingPrice: Number(p.sellingPrice),
    stockValue: Number(p.currentStock) * Number(p.purchasePrice),
    minStockAlert: Number(p.minStockAlert),
    lastMovement: null,
  }));

  const totalValue = items.reduce((sum, i) => sum + i.stockValue, 0);

  res.json({
    totalItems: items.length,
    totalValue,
    items,
  });
});

router.get("/reports/gst-summary", authMiddleware, async (req, res): Promise<void> => {
  const params = GetGstSummaryReportQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { month, year } = params.data;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const salesBreakdown = await db.execute(sql`
    SELECT
      si.gst_rate::numeric as gst_rate,
      COALESCE(SUM((si.quantity::numeric * si.unit_price::numeric) - si.discount::numeric), 0) as taxable_amount,
      COALESCE(SUM(si.cgst::numeric), 0) as cgst,
      COALESCE(SUM(si.sgst::numeric), 0) as sgst,
      COALESCE(SUM(si.igst::numeric), 0) as igst,
      COALESCE(SUM(si.cgst::numeric + si.sgst::numeric + si.igst::numeric), 0) as total_tax
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.sale_date >= ${startDate} AND s.sale_date <= ${endDate}
    GROUP BY si.gst_rate
    ORDER BY si.gst_rate
  `);

  const purchaseBreakdown = await db.execute(sql`
    SELECT
      pi.gst_rate::numeric as gst_rate,
      COALESCE(SUM((pi.quantity::numeric * pi.unit_price::numeric) - pi.discount::numeric), 0) as taxable_amount,
      COALESCE(SUM(pi.cgst::numeric), 0) as cgst,
      COALESCE(SUM(pi.sgst::numeric), 0) as sgst,
      COALESCE(SUM(pi.igst::numeric), 0) as igst,
      COALESCE(SUM(pi.cgst::numeric + pi.sgst::numeric + pi.igst::numeric), 0) as total_tax
    FROM purchase_items pi
    JOIN purchases p ON p.id = pi.purchase_id
    WHERE p.invoice_date >= ${startDate} AND p.invoice_date <= ${endDate}
    GROUP BY pi.gst_rate
    ORDER BY pi.gst_rate
  `);

  const outputTax = salesBreakdown.rows.reduce((sum: number, r: any) => sum + Number(r.total_tax), 0);
  const inputTax = purchaseBreakdown.rows.reduce((sum: number, r: any) => sum + Number(r.total_tax), 0);

  res.json({
    month,
    year,
    outputTax,
    inputTax,
    netPayable: outputTax - inputTax,
    salesBreakdown: salesBreakdown.rows.map((r: any) => ({
      gstRate: Number(r.gst_rate),
      taxableAmount: Number(r.taxable_amount),
      cgst: Number(r.cgst),
      sgst: Number(r.sgst),
      igst: Number(r.igst),
      totalTax: Number(r.total_tax),
    })),
    purchaseBreakdown: purchaseBreakdown.rows.map((r: any) => ({
      gstRate: Number(r.gst_rate),
      taxableAmount: Number(r.taxable_amount),
      cgst: Number(r.cgst),
      sgst: Number(r.sgst),
      igst: Number(r.igst),
      totalTax: Number(r.total_tax),
    })),
  });
});

export default router;
