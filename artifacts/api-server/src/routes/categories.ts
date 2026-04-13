import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import {
  ListCategoriesResponse,
  CreateCategoryBody,
  UpdateCategoryParams,
  UpdateCategoryBody,
  UpdateCategoryResponse,
  DeleteCategoryParams,
} from "@workspace/api-zod";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/categories", authMiddleware, async (req: AuthRequest, res): Promise<void> => {
  const { tenantId } = req.user!;
  const conditions: any[] = [];
  if (tenantId !== null) conditions.push(eq(categoriesTable.tenantId, tenantId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const categories = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      description: categoriesTable.description,
      createdAt: categoriesTable.createdAt,
      productCount: sql<number>`COALESCE((SELECT count(*)::int FROM products WHERE products.category_id = ${categoriesTable.id}), 0)`,
    })
    .from(categoriesTable)
    .where(whereClause)
    .orderBy(categoriesTable.name);

  res.json(
    categories.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }))
  );
});

router.post("/categories", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tenantId } = req.user!;

  const [category] = await db.insert(categoriesTable).values({
    tenantId,
    name: parsed.data.name,
    description: parsed.data.description,
  }).returning();

  res.status(201).json({
    id: category.id,
    name: category.name,
    description: category.description,
    productCount: 0,
    createdAt: category.createdAt.toISOString(),
  });
});

router.patch("/categories/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tenantId } = req.user!;
  const conditions: any[] = [eq(categoriesTable.id, params.data.id)];
  if (tenantId !== null) conditions.push(eq(categoriesTable.tenantId, tenantId));

  const [category] = await db.update(categoriesTable).set({
    name: parsed.data.name,
    description: parsed.data.description,
  }).where(and(...conditions)).returning();

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.categoryId, category.id));

  res.json({
    id: category.id,
    name: category.name,
    description: category.description,
    productCount: countResult.count,
    createdAt: category.createdAt.toISOString(),
  });
});

router.delete("/categories/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { tenantId } = req.user!;
  const conditions: any[] = [eq(categoriesTable.id, params.data.id)];
  if (tenantId !== null) conditions.push(eq(categoriesTable.tenantId, tenantId));

  const [category] = await db.delete(categoriesTable).where(and(...conditions)).returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
