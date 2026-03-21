import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, suppliersTable } from "@workspace/db";
import {
  ListSuppliersQueryParams,
  ListSuppliersResponse,
  CreateSupplierBody,
  GetSupplierParams,
  GetSupplierResponse,
  UpdateSupplierParams,
  UpdateSupplierBody,
  UpdateSupplierResponse,
  DeleteSupplierParams,
} from "@workspace/api-zod";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/suppliers", authMiddleware, async (req, res): Promise<void> => {
  const params = ListSuppliersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, limit = 20, search } = params.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (search) {
    conditions.push(
      sql`(${suppliersTable.name} ILIKE ${'%' + search + '%'} OR ${suppliersTable.phone} ILIKE ${'%' + search + '%'} OR ${suppliersTable.gstin} ILIKE ${'%' + search + '%'})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(suppliersTable).where(whereClause);
  const total = countResult.count;

  const suppliers = await db.select().from(suppliersTable).where(whereClause).limit(limit).offset(offset).orderBy(suppliersTable.name);

  res.json({
    data: suppliers.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/suppliers", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [supplier] = await db.insert(suppliersTable).values(parsed.data).returning();
  res.status(201).json({ ...supplier, createdAt: supplier.createdAt.toISOString() });
});

router.get("/suppliers/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id)).limit(1);
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.json({ ...supplier, createdAt: supplier.createdAt.toISOString() });
});

router.patch("/suppliers/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [supplier] = await db.update(suppliersTable).set(parsed.data).where(eq(suppliersTable.id, params.data.id)).returning();
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.json({ ...supplier, createdAt: supplier.createdAt.toISOString() });
});

router.delete("/suppliers/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [supplier] = await db.delete(suppliersTable).where(eq(suppliersTable.id, params.data.id)).returning();
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
