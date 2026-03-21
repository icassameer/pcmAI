import { Router, type IRouter } from "express";
import { eq, sql, and, asc, desc, lte } from "drizzle-orm";
import { db, productsTable, categoriesTable, suppliersTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
} from "@workspace/api-zod";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/products", authMiddleware, async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, limit = 20, search, categoryId, status, lowStock, sortBy = "name", sortOrder = "asc" } = params.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (search) {
    conditions.push(
      sql`(${productsTable.name} ILIKE ${'%' + search + '%'} OR ${productsTable.sku} ILIKE ${'%' + search + '%'} OR ${productsTable.brand} ILIKE ${'%' + search + '%'})`
    );
  }
  if (categoryId) {
    conditions.push(eq(productsTable.categoryId, categoryId));
  }
  if (status === "active") {
    conditions.push(eq(productsTable.active, true));
  } else if (status === "inactive") {
    conditions.push(eq(productsTable.active, false));
  }
  if (lowStock) {
    conditions.push(sql`${productsTable.currentStock}::numeric <= ${productsTable.minStockAlert}::numeric`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(whereClause);
  const total = countResult.count;

  const orderColumn = sortBy === "name" ? productsTable.name
    : sortBy === "purchasePrice" ? productsTable.purchasePrice
    : sortBy === "sellingPrice" ? productsTable.sellingPrice
    : sortBy === "currentStock" ? productsTable.currentStock
    : productsTable.name;

  const orderFn = sortOrder === "desc" ? desc : asc;

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      brand: productsTable.brand,
      hsnCode: productsTable.hsnCode,
      unit: productsTable.unit,
      purchasePrice: productsTable.purchasePrice,
      sellingPrice: productsTable.sellingPrice,
      mrp: productsTable.mrp,
      gstRate: productsTable.gstRate,
      currentStock: productsTable.currentStock,
      minStockAlert: productsTable.minStockAlert,
      location: productsTable.location,
      sku: productsTable.sku,
      supplierId: productsTable.supplierId,
      supplierName: suppliersTable.name,
      expiryDate: productsTable.expiryDate,
      active: productsTable.active,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(suppliersTable, eq(productsTable.supplierId, suppliersTable.id))
    .where(whereClause)
    .orderBy(orderFn(orderColumn))
    .limit(limit)
    .offset(offset);

  res.json({
    data: products.map(p => ({
      ...p,
      purchasePrice: Number(p.purchasePrice),
      sellingPrice: Number(p.sellingPrice),
      mrp: Number(p.mrp),
      gstRate: Number(p.gstRate),
      currentStock: Number(p.currentStock),
      minStockAlert: Number(p.minStockAlert),
      expiryDate: p.expiryDate ? p.expiryDate.toISOString().split("T")[0] : null,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/products", authMiddleware, requireRole("super_admin", "admin", "store_keeper"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    name: parsed.data.name,
    categoryId: parsed.data.categoryId,
    brand: parsed.data.brand,
    hsnCode: parsed.data.hsnCode,
    unit: parsed.data.unit,
    purchasePrice: String(parsed.data.purchasePrice),
    sellingPrice: String(parsed.data.sellingPrice),
    mrp: String(parsed.data.mrp),
    gstRate: String(parsed.data.gstRate),
    currentStock: String(parsed.data.currentStock ?? 0),
    minStockAlert: String(parsed.data.minStockAlert ?? 10),
    location: parsed.data.location,
    sku: parsed.data.sku,
    supplierId: parsed.data.supplierId,
    expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
  }).returning();

  res.status(201).json({
    ...product,
    purchasePrice: Number(product.purchasePrice),
    sellingPrice: Number(product.sellingPrice),
    mrp: Number(product.mrp),
    gstRate: Number(product.gstRate),
    currentStock: Number(product.currentStock),
    minStockAlert: Number(product.minStockAlert),
    categoryName: null,
    supplierName: null,
    expiryDate: product.expiryDate ? product.expiryDate.toISOString().split("T")[0] : null,
    createdAt: product.createdAt.toISOString(),
  });
});

router.get("/products/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      brand: productsTable.brand,
      hsnCode: productsTable.hsnCode,
      unit: productsTable.unit,
      purchasePrice: productsTable.purchasePrice,
      sellingPrice: productsTable.sellingPrice,
      mrp: productsTable.mrp,
      gstRate: productsTable.gstRate,
      currentStock: productsTable.currentStock,
      minStockAlert: productsTable.minStockAlert,
      location: productsTable.location,
      sku: productsTable.sku,
      supplierId: productsTable.supplierId,
      supplierName: suppliersTable.name,
      expiryDate: productsTable.expiryDate,
      active: productsTable.active,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(suppliersTable, eq(productsTable.supplierId, suppliersTable.id))
    .where(eq(productsTable.id, params.data.id))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    ...product,
    purchasePrice: Number(product.purchasePrice),
    sellingPrice: Number(product.sellingPrice),
    mrp: Number(product.mrp),
    gstRate: Number(product.gstRate),
    currentStock: Number(product.currentStock),
    minStockAlert: Number(product.minStockAlert),
    expiryDate: product.expiryDate ? product.expiryDate.toISOString().split("T")[0] : null,
    createdAt: product.createdAt.toISOString(),
  });
});

router.patch("/products/:id", authMiddleware, requireRole("super_admin", "admin", "store_keeper"), async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: any = {};
  const d = parsed.data;
  if (d.name !== undefined) updateData.name = d.name;
  if (d.categoryId !== undefined) updateData.categoryId = d.categoryId;
  if (d.brand !== undefined) updateData.brand = d.brand;
  if (d.hsnCode !== undefined) updateData.hsnCode = d.hsnCode;
  if (d.unit !== undefined) updateData.unit = d.unit;
  if (d.purchasePrice !== undefined) updateData.purchasePrice = String(d.purchasePrice);
  if (d.sellingPrice !== undefined) updateData.sellingPrice = String(d.sellingPrice);
  if (d.mrp !== undefined) updateData.mrp = String(d.mrp);
  if (d.gstRate !== undefined) updateData.gstRate = String(d.gstRate);
  if (d.currentStock !== undefined) updateData.currentStock = String(d.currentStock);
  if (d.minStockAlert !== undefined) updateData.minStockAlert = String(d.minStockAlert);
  if (d.location !== undefined) updateData.location = d.location;
  if (d.sku !== undefined) updateData.sku = d.sku;
  if (d.supplierId !== undefined) updateData.supplierId = d.supplierId;
  if (d.expiryDate !== undefined) updateData.expiryDate = d.expiryDate ? new Date(d.expiryDate) : null;
  if (d.active !== undefined) updateData.active = d.active;

  const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    ...product,
    purchasePrice: Number(product.purchasePrice),
    sellingPrice: Number(product.sellingPrice),
    mrp: Number(product.mrp),
    gstRate: Number(product.gstRate),
    currentStock: Number(product.currentStock),
    minStockAlert: Number(product.minStockAlert),
    categoryName: null,
    supplierName: null,
    expiryDate: product.expiryDate ? product.expiryDate.toISOString().split("T")[0] : null,
    createdAt: product.createdAt.toISOString(),
  });
});

router.delete("/products/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
