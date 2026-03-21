import { Router, type IRouter } from "express";
import { sql, desc, gte, eq } from "drizzle-orm";
import { db, salesTable, purchasesTable, productsTable, customersTable, suppliersTable, saleItemsTable, categoriesTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetSalesTrendResponse,
  GetTopProductsResponse,
  GetRecentTransactionsResponse,
} from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../lib/auth";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (_openai) return _openai;
  try {
    if (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      _openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      return _openai;
    }
  } catch {}
  return null;
}

const aiInsightsCache: { data: any; timestamp: number } = { data: null, timestamp: 0 };
const AI_CACHE_TTL = 5 * 60 * 1000;

function getDefaultInsights() {
  return [
    { icon: "lightbulb", title: "Getting Started", description: "Add your products, suppliers, and customers to unlock AI-powered business insights.", type: "info" },
    { icon: "target", title: "Track Inventory", description: "Set minimum stock levels for products to get automatic low-stock alerts.", type: "info" },
    { icon: "trending-up", title: "Record Sales", description: "Start recording sales transactions to see revenue trends and profitability analysis.", type: "success" },
    { icon: "shield", title: "GST Compliance", description: "Configure your business GSTIN in settings to generate GST-compliant invoices.", type: "info" },
  ];
}

const router: IRouter = Router();

router.get("/dashboard/stats", authMiddleware, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const [todaySalesResult] = await db.select({
    total: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`
  }).from(salesTable).where(gte(salesTable.saleDate, today));

  const [todayPurchasesResult] = await db.select({
    total: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`
  }).from(purchasesTable).where(gte(purchasesTable.invoiceDate, today));

  const [lowStockResult] = await db.select({
    count: sql<number>`count(*)::int`
  }).from(productsTable).where(sql`${productsTable.currentStock}::numeric <= ${productsTable.minStockAlert}::numeric AND ${productsTable.active} = true`);

  const [pendingPaymentsResult] = await db.select({
    total: sql<number>`COALESCE(SUM(balance_due::numeric), 0)`
  }).from(salesTable).where(sql`${salesTable.paymentStatus} != 'paid'`);

  const [totalProductsResult] = await db.select({
    count: sql<number>`count(*)::int`
  }).from(productsTable);

  const [totalCustomersResult] = await db.select({
    count: sql<number>`count(*)::int`
  }).from(customersTable);

  const [totalSuppliersResult] = await db.select({
    count: sql<number>`count(*)::int`
  }).from(suppliersTable);

  const [monthlyRevenueResult] = await db.select({
    total: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`
  }).from(salesTable).where(gte(salesTable.saleDate, monthStart));

  const [prevMonthRevenueResult] = await db.select({
    total: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`
  }).from(salesTable).where(sql`${salesTable.saleDate} >= ${prevMonthStart} AND ${salesTable.saleDate} < ${monthStart}`);

  const [monthlyPurchasesResult] = await db.select({
    total: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`
  }).from(purchasesTable).where(gte(purchasesTable.invoiceDate, monthStart));

  const [totalSalesCountResult] = await db.select({
    count: sql<number>`count(*)::int`
  }).from(salesTable).where(gte(salesTable.saleDate, monthStart));

  const [stockValuationResult] = await db.select({
    total: sql<number>`COALESCE(SUM(current_stock::numeric * purchase_price::numeric), 0)`
  }).from(productsTable).where(sql`${productsTable.active} = true`);

  const [outOfStockResult] = await db.select({
    count: sql<number>`count(*)::int`
  }).from(productsTable).where(sql`${productsTable.currentStock}::numeric <= 0 AND ${productsTable.active} = true`);

  const monthlyRevenue = Number(monthlyRevenueResult.total);
  const prevMonthRevenue = Number(prevMonthRevenueResult.total);
  const revenueGrowth = prevMonthRevenue > 0 ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;
  const grossProfit = monthlyRevenue - Number(monthlyPurchasesResult.total);

  res.json({
    todaySales: Number(todaySalesResult.total),
    todayPurchases: Number(todayPurchasesResult.total),
    lowStockItems: lowStockResult.count,
    pendingPayments: Number(pendingPaymentsResult.total),
    totalProducts: totalProductsResult.count,
    totalCustomers: totalCustomersResult.count,
    totalSuppliers: totalSuppliersResult.count,
    monthlyRevenue,
    prevMonthRevenue,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    monthlyPurchases: Number(monthlyPurchasesResult.total),
    grossProfit,
    monthlySalesCount: totalSalesCountResult.count,
    stockValuation: Number(stockValuationResult.total),
    outOfStockItems: outOfStockResult.count,
  });
});

router.get("/dashboard/sales-trend", authMiddleware, async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const salesTrend = await db.execute(sql`
    WITH dates AS (
      SELECT generate_series(
        ${thirtyDaysAgo}::date,
        CURRENT_DATE,
        '1 day'::interval
      )::date AS date
    )
    SELECT
      d.date::text,
      COALESCE((SELECT SUM(grand_total::numeric) FROM sales WHERE sale_date::date = d.date), 0) as sales,
      COALESCE((SELECT SUM(grand_total::numeric) FROM purchases WHERE invoice_date::date = d.date), 0) as purchases
    FROM dates d
    ORDER BY d.date
  `);

  res.json(
    salesTrend.rows.map((r: any) => ({
      date: r.date,
      sales: Number(r.sales),
      purchases: Number(r.purchases),
    }))
  );
});

router.get("/dashboard/top-products", authMiddleware, async (_req, res): Promise<void> => {
  const topProducts = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      COALESCE(SUM(si.quantity::numeric), 0) as total_quantity,
      COALESCE(SUM(si.total::numeric), 0) as total_revenue
    FROM products p
    LEFT JOIN sale_items si ON si.product_id = p.id
    GROUP BY p.id, p.name
    HAVING COALESCE(SUM(si.quantity::numeric), 0) > 0
    ORDER BY total_revenue DESC
    LIMIT 10
  `);

  res.json(
    topProducts.rows.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      totalQuantity: Number(r.total_quantity),
      totalRevenue: Number(r.total_revenue),
    }))
  );
});

router.get("/dashboard/recent-transactions", authMiddleware, async (_req, res): Promise<void> => {
  const recentSales = await db.select({
    id: salesTable.id,
    invoiceNo: salesTable.invoiceNo,
    partyName: salesTable.customerName,
    amount: salesTable.grandTotal,
    date: salesTable.saleDate,
  }).from(salesTable).orderBy(desc(salesTable.createdAt)).limit(5);

  const recentPurchases = await db
    .select({
      id: purchasesTable.id,
      invoiceNo: purchasesTable.invoiceNo,
      partyName: suppliersTable.name,
      amount: purchasesTable.grandTotal,
      date: purchasesTable.invoiceDate,
    })
    .from(purchasesTable)
    .leftJoin(suppliersTable, sql`${purchasesTable.supplierId} = ${suppliersTable.id}`)
    .orderBy(desc(purchasesTable.createdAt))
    .limit(5);

  const transactions = [
    ...recentSales.map(s => ({
      id: s.id,
      type: "sale" as const,
      invoiceNo: s.invoiceNo,
      partyName: s.partyName,
      amount: Number(s.amount),
      date: s.date.toISOString().split("T")[0],
    })),
    ...recentPurchases.map(p => ({
      id: p.id,
      type: "purchase" as const,
      invoiceNo: p.invoiceNo,
      partyName: p.partyName || "Unknown",
      amount: Number(p.amount),
      date: p.date.toISOString().split("T")[0],
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  res.json(transactions);
});

router.get("/dashboard/category-sales", authMiddleware, async (_req, res): Promise<void> => {
  const categorySales = await db.execute(sql`
    SELECT
      c.name as category,
      COALESCE(SUM(si.total::numeric), 0) as revenue,
      COALESCE(SUM(si.quantity::numeric), 0) as quantity
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    LEFT JOIN sale_items si ON si.product_id = p.id
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
  `);

  res.json(
    categorySales.rows.map((r: any) => ({
      category: r.category,
      revenue: Number(r.revenue),
      quantity: Number(r.quantity),
    }))
  );
});

router.get("/dashboard/inventory-health", authMiddleware, async (_req, res): Promise<void> => {
  const [healthy] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable)
    .where(sql`${productsTable.currentStock}::numeric > ${productsTable.minStockAlert}::numeric AND ${productsTable.active} = true`);
  const [lowStock] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable)
    .where(sql`${productsTable.currentStock}::numeric > 0 AND ${productsTable.currentStock}::numeric <= ${productsTable.minStockAlert}::numeric AND ${productsTable.active} = true`);
  const [outOfStock] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable)
    .where(sql`${productsTable.currentStock}::numeric <= 0 AND ${productsTable.active} = true`);

  res.json([
    { status: "Healthy", count: healthy.count, color: "#22c55e" },
    { status: "Low Stock", count: lowStock.count, color: "#f59e0b" },
    { status: "Out of Stock", count: outOfStock.count, color: "#ef4444" },
  ]);
});

router.get("/dashboard/ai-insights", authMiddleware, async (_req, res): Promise<void> => {
  const forceRefresh = _req.query.force === "true";
  if (!forceRefresh && aiInsightsCache.data && Date.now() - aiInsightsCache.timestamp < AI_CACHE_TTL) {
    res.json(aiInsightsCache.data);
    return;
  }

  const ai = getOpenAI();
  if (!ai) {
    res.json({
      insights: [
        { icon: "lightbulb", title: "AI Not Configured", description: "AI integration is not configured. Your business data is still being tracked and displayed in the dashboard.", type: "info" }
      ],
      generatedAt: new Date().toISOString(),
    });
    return;
  }

  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [monthlyRevenue] = await db.select({
      total: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`
    }).from(salesTable).where(gte(salesTable.saleDate, monthStart));

    const [monthlyPurchases] = await db.select({
      total: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`
    }).from(purchasesTable).where(gte(purchasesTable.invoiceDate, monthStart));

    const lowStockProducts = await db.select({
      name: productsTable.name,
      stock: productsTable.currentStock,
      minAlert: productsTable.minStockAlert,
    }).from(productsTable)
      .where(sql`${productsTable.currentStock}::numeric <= ${productsTable.minStockAlert}::numeric AND ${productsTable.active} = true`)
      .limit(10);

    const topProducts = await db.execute(sql`
      SELECT p.name, COALESCE(SUM(si.quantity::numeric), 0) as qty, COALESCE(SUM(si.total::numeric), 0) as revenue
      FROM products p
      INNER JOIN sale_items si ON si.product_id = p.id
      INNER JOIN sales s ON s.id = si.sale_id AND s.sale_date >= ${monthStart}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC LIMIT 5
    `);

    const [pendingPayments] = await db.select({
      total: sql<number>`COALESCE(SUM(balance_due::numeric), 0)`,
      count: sql<number>`count(*)::int`
    }).from(salesTable).where(sql`${salesTable.paymentStatus} != 'paid'`);

    const salesTrend = await db.execute(sql`
      SELECT
        sale_date::date::text as date,
        SUM(grand_total::numeric) as daily_total
      FROM sales
      WHERE sale_date >= ${monthStart}
      GROUP BY sale_date::date
      ORDER BY sale_date::date
    `);

    const businessData = {
      monthlyRevenue: Number(monthlyRevenue.total),
      monthlyPurchases: Number(monthlyPurchases.total),
      grossProfit: Number(monthlyRevenue.total) - Number(monthlyPurchases.total),
      profitMargin: Number(monthlyRevenue.total) > 0
        ? (((Number(monthlyRevenue.total) - Number(monthlyPurchases.total)) / Number(monthlyRevenue.total)) * 100).toFixed(1)
        : "0",
      lowStockProducts: lowStockProducts.map(p => `${p.name} (stock: ${p.stock}, alert: ${p.minAlert})`),
      topProducts: topProducts.rows.map((r: any) => `${r.name}: ${Number(r.qty)} units, ₹${Number(r.revenue)}`),
      pendingPayments: { total: Number(pendingPayments.total), count: pendingPayments.count },
      dailySales: salesTrend.rows.map((r: any) => `${r.date}: ₹${Number(r.daily_total)}`),
    };

    const completion = await ai.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are a business intelligence assistant for an Indian inventory management system called InventoPro. Analyze the provided data and ALWAYS provide exactly 4 actionable insights, even if data is sparse or all zeros — in that case, provide onboarding tips and recommendations for getting started. Each insight MUST be a JSON object with: "icon" (one of: "trending-up", "alert", "lightbulb", "target", "shield", "zap"), "title" (short 3-5 word title), "description" (1-2 sentence actionable insight in plain English), "type" (one of: "success", "warning", "info", "danger"). You MUST respond with ONLY a valid JSON array of exactly 4 objects. No markdown, no explanation, no code blocks.`
        },
        {
          role: "user",
          content: `Analyze this business data for the current month and provide insights:\n${JSON.stringify(businessData, null, 2)}`
        }
      ],
    });

    const content = completion.choices[0]?.message?.content || "[]";
    let insights;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Empty or non-array response");
      }
      insights = parsed
        .filter((item: any) => item && typeof item.title === "string" && typeof item.description === "string")
        .map((item: any) => ({
          icon: ["trending-up", "alert", "lightbulb", "target", "shield", "zap"].includes(item.icon) ? item.icon : "lightbulb",
          title: item.title,
          description: item.description,
          type: ["success", "warning", "info", "danger"].includes(item.type) ? item.type : "info",
        }));
      if (insights.length === 0) throw new Error("No valid insights after filtering");
    } catch (parseError: any) {
      console.error("AI parse error:", parseError.message, "Raw content:", content.substring(0, 500));
      insights = getDefaultInsights();
    }

    const response = { insights, generatedAt: new Date().toISOString() };
    aiInsightsCache.data = response;
    aiInsightsCache.timestamp = Date.now();
    res.json(response);
  } catch (error: any) {
    console.error("AI insights error:", error.message);
    res.json({
      insights: getDefaultInsights(),
      generatedAt: new Date().toISOString(),
    });
  }
});

export default router;
