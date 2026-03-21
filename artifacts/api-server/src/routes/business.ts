import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, businessProfileTable } from "@workspace/db";
import {
  GetBusinessProfileResponse,
  UpdateBusinessProfileBody,
  UpdateBusinessProfileResponse,
} from "@workspace/api-zod";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/business", authMiddleware, async (_req, res): Promise<void> => {
  let [business] = await db.select().from(businessProfileTable).limit(1);

  if (!business) {
    [business] = await db.insert(businessProfileTable).values({
      name: "My Business",
      invoicePrefix: "INV",
      nextInvoiceNum: 1,
    }).returning();
  }

  res.json({
    id: business.id,
    name: business.name,
    address: business.address,
    gstin: business.gstin,
    state: business.state,
    phone: business.phone,
    email: business.email,
    bankName: business.bankName,
    bankAccount: business.bankAccount,
    bankIfsc: business.bankIfsc,
    invoicePrefix: business.invoicePrefix,
    nextInvoiceNum: business.nextInvoiceNum,
  });
});

router.patch("/business", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateBusinessProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let [business] = await db.select().from(businessProfileTable).limit(1);
  if (!business) {
    [business] = await db.insert(businessProfileTable).values({
      name: "My Business",
      invoicePrefix: "INV",
      nextInvoiceNum: 1,
    }).returning();
  }

  const [updated] = await db.update(businessProfileTable).set(parsed.data).where(eq(businessProfileTable.id, business.id)).returning();

  res.json({
    id: updated.id,
    name: updated.name,
    address: updated.address,
    gstin: updated.gstin,
    state: updated.state,
    phone: updated.phone,
    email: updated.email,
    bankName: updated.bankName,
    bankAccount: updated.bankAccount,
    bankIfsc: updated.bankIfsc,
    invoicePrefix: updated.invoicePrefix,
    nextInvoiceNum: updated.nextInvoiceNum,
  });
});

export default router;
