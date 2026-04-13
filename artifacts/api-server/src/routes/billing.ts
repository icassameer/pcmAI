import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import Razorpay from "razorpay";
import { db, tenantsTable, plansTable } from "@workspace/db";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

// Razorpay client — graceful when keys are placeholders
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

const razorpayConfigured =
  RAZORPAY_KEY_ID && !RAZORPAY_KEY_ID.includes("placeholder") &&
  RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_SECRET.includes("placeholder");

const razorpay = razorpayConfigured
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/billing/plans  (already in tenants.ts — kept there for public access)
// ──────────────────────────────────────────────────────────────────────────────

// GET /api/billing/razorpay-key — return publishable key to frontend
router.get("/billing/razorpay-key", authMiddleware, (_req, res): void => {
  res.json({ keyId: razorpayConfigured ? RAZORPAY_KEY_ID : null });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/billing/subscribe
// Body: { planName: "starter" | "pro", billingCycle: "monthly" | "yearly" }
// Creates (or reuses) a Razorpay subscription and returns the subscription ID
// ──────────────────────────────────────────────────────────────────────────────
router.post("/billing/subscribe", authMiddleware, requireRole("super_admin"), async (req: AuthRequest, res): Promise<void> => {
  const { tenantId } = req.user!;
  if (tenantId === null) {
    res.status(400).json({ error: "Platform admin has no billing" });
    return;
  }

  const { planName, billingCycle = "monthly" } = req.body as { planName: string; billingCycle?: string };
  if (!planName || !["starter", "pro"].includes(planName)) {
    res.status(400).json({ error: "planName must be 'starter' or 'pro'" });
    return;
  }

  const [dbPlan] = await db.select().from(plansTable).where(eq(plansTable.name, planName === "starter" ? "Starter" : "Pro")).limit(1);
  if (!dbPlan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  if (!razorpay) {
    // Razorpay not yet configured — return a mock response so frontend can be tested
    res.status(503).json({ error: "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env" });
    return;
  }

  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  try {
    // Reuse existing customer or create a new one
    let customerId = tenant.razorpayCustomerId;
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: tenant.name,
        contact: "",
        email: "",
        fail_existing: "0",
      } as any);
      customerId = customer.id;
      await db.update(tenantsTable).set({ razorpayCustomerId: customerId }).where(eq(tenantsTable.id, tenantId));
    }

    // Amount in paise (₹1 = 100 paise)
    const amountPaise = billingCycle === "yearly"
      ? Number(dbPlan.priceYearly) * 100
      : Number(dbPlan.priceMonthly) * 100;

    // Create a Razorpay order (one-time payment; upgrade to subscriptions when plan IDs are set up)
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `tenant_${tenantId}_${Date.now()}`,
      notes: {
        tenantId: String(tenantId),
        planName,
        billingCycle,
      },
    });

    res.json({
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
      planName,
      billingCycle,
    });
  } catch (error: any) {
    console.error("Razorpay subscribe error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/billing/verify-payment
// Called by frontend after successful Razorpay checkout
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, billingCycle }
// ──────────────────────────────────────────────────────────────────────────────
router.post("/billing/verify-payment", authMiddleware, requireRole("super_admin"), async (req: AuthRequest, res): Promise<void> => {
  const { tenantId } = req.user!;
  if (tenantId === null) {
    res.status(400).json({ error: "Platform admin has no billing" });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing payment verification fields" });
    return;
  }

  if (!razorpay) {
    res.status(503).json({ error: "Razorpay not configured" });
    return;
  }

  // Verify signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSig = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(body).digest("hex");
  if (expectedSig !== razorpay_signature) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  // Activate tenant
  await db.update(tenantsTable).set({
    plan: planName ?? "starter",
    status: "active",
    gracePeriodEndsAt: null,
    razorpaySubscriptionId: razorpay_payment_id,
  }).where(eq(tenantsTable.id, tenantId));

  res.json({ success: true, status: "active", plan: planName ?? "starter" });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/billing/webhook
// Raw body required — Razorpay sends JSON with X-Razorpay-Signature header
// ──────────────────────────────────────────────────────────────────────────────
router.post("/billing/webhook", async (req, res): Promise<void> => {
  const signature = req.headers["x-razorpay-signature"] as string;

  if (!RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET.includes("placeholder")) {
    // Accept without verification in dev when secret is placeholder
    console.warn("Razorpay webhook secret not configured — skipping signature check");
  } else {
    if (!signature) {
      res.status(400).json({ error: "Missing signature" });
      return;
    }
    const rawBody = JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    if (expected !== signature) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }
  }

  const event = req.body?.event as string;
  const payload = req.body?.payload;

  try {
    switch (event) {
      case "payment.captured": {
        // One-time payment captured
        const notes = payload?.payment?.entity?.notes;
        if (notes?.tenantId) {
          const tid = Number(notes.tenantId);
          await db.update(tenantsTable).set({
            plan: notes.planName ?? "starter",
            status: "active",
            gracePeriodEndsAt: null,
          }).where(eq(tenantsTable.id, tid));
        }
        break;
      }

      case "subscription.activated": {
        const sub = payload?.subscription?.entity;
        if (sub?.notes?.tenantId) {
          const tid = Number(sub.notes.tenantId);
          await db.update(tenantsTable).set({
            plan: sub.notes.planName ?? "starter",
            status: "active",
            razorpaySubscriptionId: sub.id,
            gracePeriodEndsAt: null,
          }).where(eq(tenantsTable.id, tid));
        }
        break;
      }

      case "subscription.charged": {
        const sub = payload?.subscription?.entity;
        if (sub?.notes?.tenantId) {
          const tid = Number(sub.notes.tenantId);
          await db.update(tenantsTable).set({
            status: "active",
            gracePeriodEndsAt: null,
          }).where(eq(tenantsTable.id, tid));
        }
        break;
      }

      case "subscription.halted":
      case "payment.failed": {
        // Payment failed → enter 7-day grace period
        const notes =
          payload?.subscription?.entity?.notes ??
          payload?.payment?.entity?.notes;
        if (notes?.tenantId) {
          const tid = Number(notes.tenantId);
          const gracePeriodEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await db.update(tenantsTable).set({
            status: "grace",
            gracePeriodEndsAt,
          }).where(eq(tenantsTable.id, tid));
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed": {
        const sub = payload?.subscription?.entity;
        if (sub?.notes?.tenantId) {
          const tid = Number(sub.notes.tenantId);
          await db.update(tenantsTable).set({ status: "suspended" }).where(eq(tenantsTable.id, tid));
        }
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }

    // Also sweep any grace-period tenants that have expired
    await db.update(tenantsTable).set({ status: "suspended" }).where(
      sql`status = 'grace' AND grace_period_ends_at IS NOT NULL AND grace_period_ends_at < NOW()`,
    );

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
