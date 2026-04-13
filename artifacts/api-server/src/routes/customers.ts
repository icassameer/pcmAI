import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  ListCustomersResponse,
  CreateCustomerBody,
  GetCustomerParams,
  GetCustomerResponse,
  UpdateCustomerParams,
  UpdateCustomerBody,
  UpdateCustomerResponse,
  DeleteCustomerParams,
} from "@workspace/api-zod";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/customers", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const params = ListCustomersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, limit = 20, search } = params.data;
  const offset = (page - 1) * limit;
  const { tenantId } = req.user!;

  const conditions: any[] = [];
  if (tenantId !== null) conditions.push(eq(customersTable.tenantId, tenantId));
  if (search) {
    conditions.push(
      sql`(${customersTable.name} ILIKE ${'%' + search + '%'} OR ${customersTable.phone} ILIKE ${'%' + search + '%'} OR ${customersTable.gstin} ILIKE ${'%' + search + '%'})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(customersTable).where(whereClause);
  const total = countResult.count;

  const customers = await db.select().from(customersTable).where(whereClause).limit(limit).offset(offset).orderBy(customersTable.name);

  res.json({
    data: customers.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/customers", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tenantId } = req.user!;
  const [customer] = await db.insert(customersTable).values({ ...parsed.data, tenantId }).returning();
  res.status(201).json({ ...customer, createdAt: customer.createdAt.toISOString() });
});

router.get("/customers/:id", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { tenantId } = req.user!;
  const conditions: any[] = [eq(customersTable.id, params.data.id)];
  if (tenantId !== null) conditions.push(eq(customersTable.tenantId, tenantId));

  const [customer] = await db.select().from(customersTable).where(and(...conditions)).limit(1);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json({ ...customer, createdAt: customer.createdAt.toISOString() });
});

router.patch("/customers/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tenantId } = req.user!;
  const conditions: any[] = [eq(customersTable.id, params.data.id)];
  if (tenantId !== null) conditions.push(eq(customersTable.tenantId, tenantId));

  const [customer] = await db.update(customersTable).set(parsed.data).where(and(...conditions)).returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.json({ ...customer, createdAt: customer.createdAt.toISOString() });
});

router.delete("/customers/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { tenantId } = req.user!;
  const conditions: any[] = [eq(customersTable.id, params.data.id)];
  if (tenantId !== null) conditions.push(eq(customersTable.tenantId, tenantId));

  const [customer] = await db.delete(customersTable).where(and(...conditions)).returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
