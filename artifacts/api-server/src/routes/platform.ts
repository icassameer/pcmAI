import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db, tenantsTable, usersTable, salesTable, purchasesTable } from "@workspace/db";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

// All platform routes require platform_admin role
const platformAuth = [authMiddleware, requireRole("platform_admin")];

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/platform/tenants
// Returns all tenants with user count, sales count, and revenue
// ──────────────────────────────────────────────────────────────────────────────
router.get("/platform/tenants", ...platformAuth, async (_req: AuthRequest, res): Promise<void> => {
  const tenants = await db
    .select({
      id: tenantsTable.id,
      name: tenantsTable.name,
      slug: tenantsTable.slug,
      plan: tenantsTable.plan,
      status: tenantsTable.status,
      trialEndsAt: tenantsTable.trialEndsAt,
      gracePeriodEndsAt: tenantsTable.gracePeriodEndsAt,
      createdAt: tenantsTable.createdAt,
    })
    .from(tenantsTable)
    .orderBy(desc(tenantsTable.createdAt));

  // Enrich with per-tenant stats
  const enriched = await Promise.all(tenants.map(async (t) => {
    const userCount = await db.$count(usersTable, eq(usersTable.tenantId, t.id));
    const [salesStats] = await db.select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`,
    }).from(salesTable).where(eq(salesTable.tenantId, t.id));

    return {
      ...t,
      trialEndsAt: t.trialEndsAt?.toISOString() ?? null,
      gracePeriodEndsAt: t.gracePeriodEndsAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      userCount,
      salesCount: salesStats.count ?? 0,
      totalRevenue: Number(salesStats.revenue ?? 0),
    };
  }));

  res.json({ tenants: enriched, total: enriched.length });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/platform/tenants/:id
// Single tenant detail
// ──────────────────────────────────────────────────────────────────────────────
router.get("/platform/tenants/:id", ...platformAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id)).limit(1);
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    active: usersTable.active,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.tenantId, id));

  const [salesStats] = await db.select({
    count: sql<number>`count(*)::int`,
    revenue: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`,
  }).from(salesTable).where(eq(salesTable.tenantId, id));

  const [purchaseStats] = await db.select({
    count: sql<number>`count(*)::int`,
    spend: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`,
  }).from(purchasesTable).where(eq(purchasesTable.tenantId, id));

  res.json({
    ...tenant,
    trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
    gracePeriodEndsAt: tenant.gracePeriodEndsAt?.toISOString() ?? null,
    createdAt: tenant.createdAt.toISOString(),
    updatedAt: tenant.updatedAt.toISOString(),
    users: users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })),
    stats: {
      userCount: users.length,
      salesCount: salesStats?.count ?? 0,
      totalRevenue: Number(salesStats?.revenue ?? 0),
      purchaseCount: purchaseStats?.count ?? 0,
      totalSpend: Number(purchaseStats?.spend ?? 0),
    },
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/platform/tenants/:id/status
// Manually override tenant status and/or plan
// Body: { status?: "trial"|"active"|"grace"|"suspended", plan?: string }
// ──────────────────────────────────────────────────────────────────────────────
const UpdateTenantBody = z.object({
  status: z.enum(["trial", "active", "grace", "suspended"]).optional(),
  plan: z.enum(["free", "starter", "pro"]).optional(),
});

router.put("/platform/tenants/:id/status", ...platformAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateTenantBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: any = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.plan !== undefined) updates.plan = parsed.data.plan;

  // Clear grace period if activating
  if (parsed.data.status === "active") updates.gracePeriodEndsAt = null;

  const [updated] = await db.update(tenantsTable).set(updates).where(eq(tenantsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Tenant not found" }); return; }

  res.json({
    id: updated.id,
    name: updated.name,
    plan: updated.plan,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/platform/stats
// Revenue overview across all tenants
// ──────────────────────────────────────────────────────────────────────────────
router.get("/platform/stats", ...platformAuth, async (_req: AuthRequest, res): Promise<void> => {
  const [tenantCounts] = await db.select({
    total: sql<number>`count(*)::int`,
    trial: sql<number>`count(*) FILTER (WHERE status = 'trial')::int`,
    active: sql<number>`count(*) FILTER (WHERE status = 'active')::int`,
    suspended: sql<number>`count(*) FILTER (WHERE status = 'suspended')::int`,
    grace: sql<number>`count(*) FILTER (WHERE status = 'grace')::int`,
  }).from(tenantsTable);

  const [revenueStats] = await db.select({
    totalRevenue: sql<number>`COALESCE(SUM(grand_total::numeric), 0)`,
    totalSales: sql<number>`count(*)::int`,
  }).from(salesTable);

  res.json({
    tenants: tenantCounts,
    revenue: {
      totalRevenue: Number(revenueStats.totalRevenue),
      totalSales: revenueStats.totalSales,
    },
  });
});

export default router;
