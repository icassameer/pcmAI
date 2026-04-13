import type { Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, tenantsTable, plansTable, usersTable, productsTable } from "@workspace/db";
import type { AuthRequest } from "../lib/auth";


/**
 * Blocks access for suspended tenants.
 * Also auto-suspends grace-period tenants whose window has expired.
 * platform_admin (tenantId === null) is always allowed through.
 */
export async function tenantActiveGuard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const { tenantId } = req.user!;
  if (tenantId === null) { next(); return; } // platform_admin bypass

  const [tenant] = await db.select({
    status: tenantsTable.status,
    gracePeriodEndsAt: tenantsTable.gracePeriodEndsAt,
    trialEndsAt: tenantsTable.trialEndsAt,
  }).from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);

  if (!tenant) {
    res.status(403).json({ error: "Tenant not found" });
    return;
  }

  // Auto-expire grace period
  if (tenant.status === "grace" && tenant.gracePeriodEndsAt && tenant.gracePeriodEndsAt < new Date()) {
    await db.update(tenantsTable).set({ status: "suspended" }).where(eq(tenantsTable.id, tenantId));
    res.status(402).json({ error: "Your subscription has expired. Please upgrade to continue.", code: "SUSPENDED" });
    return;
  }

  // Auto-expire trial
  if (tenant.status === "trial" && tenant.trialEndsAt && tenant.trialEndsAt < new Date()) {
    res.status(402).json({ error: "Your free trial has expired. Please upgrade to continue.", code: "TRIAL_EXPIRED" });
    return;
  }

  if (tenant.status === "suspended") {
    res.status(402).json({ error: "Your account is suspended. Please upgrade to continue.", code: "SUSPENDED" });
    return;
  }

  next();
}

/**
 * Checks if the tenant has capacity for one more user.
 * Attach to POST /users.
 */
export async function checkUserLimit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const { tenantId } = req.user!;
  if (tenantId === null) { next(); return; }

  const [tenant] = await db.select({ plan: tenantsTable.plan }).from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) { next(); return; }

  const [dbPlan] = await db.select({ maxUsers: plansTable.maxUsers }).from(plansTable)
    .where(eq(plansTable.name, tenant.plan === "pro" ? "Pro" : tenant.plan === "starter" ? "Starter" : "Free Trial"))
    .limit(1);

  if (!dbPlan || dbPlan.maxUsers === null) { next(); return; } // unlimited

  const result = await db.$count(usersTable, eq(usersTable.tenantId, tenantId));
  if (result >= dbPlan.maxUsers) {
    res.status(403).json({
      error: `Your plan allows up to ${dbPlan.maxUsers} user${dbPlan.maxUsers === 1 ? "" : "s"}. Upgrade to add more.`,
      code: "USER_LIMIT_REACHED",
    });
    return;
  }

  next();
}

/**
 * Checks if the tenant has capacity for one more product.
 * Attach to POST /products.
 */
export async function checkProductLimit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const { tenantId } = req.user!;
  if (tenantId === null) { next(); return; }

  const [tenant] = await db.select({ plan: tenantsTable.plan }).from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) { next(); return; }

  const [dbPlan] = await db.select({ maxProducts: plansTable.maxProducts }).from(plansTable)
    .where(eq(plansTable.name, tenant.plan === "pro" ? "Pro" : tenant.plan === "starter" ? "Starter" : "Free Trial"))
    .limit(1);

  if (!dbPlan || dbPlan.maxProducts === null) { next(); return; } // unlimited

  const result = await db.$count(productsTable, eq(productsTable.tenantId, tenantId));
  if (result >= dbPlan.maxProducts) {
    res.status(403).json({
      error: `Your plan allows up to ${dbPlan.maxProducts} products. Upgrade to add more.`,
      code: "PRODUCT_LIMIT_REACHED",
    });
    return;
  }

  next();
}
