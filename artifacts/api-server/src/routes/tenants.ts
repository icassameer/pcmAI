import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, tenantsTable, usersTable, plansTable, refreshTokensTable } from "@workspace/db";
import { hashPassword, generateAccessToken, generateRefreshToken, authMiddleware, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

// Public: list available plans
router.get("/billing/plans", async (_req, res): Promise<void> => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.id);

  if (plans.length > 0) {
    res.json(plans.map(p => ({
      id: p.id,
      name: p.name,
      priceMonthly: Number(p.priceMonthly),
      priceYearly: Number(p.priceYearly),
      maxUsers: p.maxUsers,
      maxProducts: p.maxProducts,
      features: p.features,
    })));
    return;
  }

  // Fallback hardcoded plans if DB table is empty
  res.json([
    {
      id: 1, name: "Free Trial", priceMonthly: 0, priceYearly: 0,
      maxUsers: 1, maxProducts: 100,
      features: { trialDays: 30, description: "30-day free trial" },
    },
    {
      id: 2, name: "Starter", priceMonthly: 499, priceYearly: 4999,
      maxUsers: 3, maxProducts: 500,
      features: { description: "Up to 3 users, 500 products" },
    },
    {
      id: 3, name: "Pro", priceMonthly: 999, priceYearly: 9999,
      maxUsers: null, maxProducts: null,
      features: { unlimited: true, description: "Unlimited users and products" },
    },
  ]);
});

// Authenticated: get current tenant billing/trial status
router.get("/billing/status", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const { tenantId } = req.user!;

  if (tenantId === null) {
    res.json({ status: "active", plan: "platform", trialEndsAt: null, daysRemaining: null });
    return;
  }

  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  let daysRemaining: number | null = null;
  if (tenant.status === "trial" && tenant.trialEndsAt) {
    const now = new Date();
    daysRemaining = Math.max(
      0,
      Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  res.json({
    status: tenant.status,
    plan: tenant.plan,
    trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
    daysRemaining,
  });
});

const SignupBody = z.object({
  businessName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

// Public: sign up as new agency/tenant — starts a 30-day free trial
router.post("/tenants/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { businessName, ownerName, email, password } = parsed.data;

  // Reject duplicate emails
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  // Build a URL-safe slug from the business name
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let slug = baseSlug;
  const [slugExists] = await db
    .select({ id: tenantsTable.id })
    .from(tenantsTable)
    .where(eq(tenantsTable.slug, slug))
    .limit(1);
  if (slugExists) {
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
  }

  try {
    const result = await db.transaction(async (tx) => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      const [tenant] = await tx.insert(tenantsTable).values({
        name: businessName,
        slug,
        plan: "free",
        status: "trial",
        trialEndsAt,
      }).returning();

      const passwordHash = await hashPassword(password);
      const [user] = await tx.insert(usersTable).values({
        tenantId: tenant.id,
        name: ownerName,
        email,
        passwordHash,
        role: "super_admin",
        active: true,
      }).returning();

      return { tenant, user };
    });

    const { tenant, user } = result;
    const accessToken = generateAccessToken(user.id, user.role, tenant.id);
    const refreshToken = generateRefreshToken(user.id);

    await db.insert(refreshTokensTable).values({
      token: refreshToken,
      userId: user.id,
      tenantId: tenant.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        active: user.active,
        createdAt: user.createdAt.toISOString(),
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

export default router;
