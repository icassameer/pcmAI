import { Router, type IRouter } from "express";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { db, purchasesTable, purchaseItemsTable, productsTable, suppliersTable } from "@workspace/db";
import {
  ListPurchasesQueryParams,
  ListPurchasesResponse,
  CreatePurchaseBody,
  GetPurchaseParams,
  GetPurchaseResponse,
  UpdatePurchaseParams,
  UpdatePurchaseBody,
  UpdatePurchaseResponse,
  DeletePurchaseParams,
} from "@workspace/api-zod";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/purchases", authMiddleware, async (req, res): Promise<void> => {
  const params = ListPurchasesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, limit = 20, supplierId, startDate, endDate, status } = params.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (supplierId) conditions.push(eq(purchasesTable.supplierId, supplierId));
  if (startDate) conditions.push(gte(purchasesTable.invoiceDate, new Date(startDate)));
  if (endDate) conditions.push(lte(purchasesTable.invoiceDate, new Date(endDate)));
  if (status) conditions.push(eq(purchasesTable.paymentStatus, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(purchasesTable).where(whereClause);
  const total = countResult.count;

  const purchases = await db
    .select({
      id: purchasesTable.id,
      invoiceNo: purchasesTable.invoiceNo,
      invoiceDate: purchasesTable.invoiceDate,
      supplierId: purchasesTable.supplierId,
      supplierName: suppliersTable.name,
      subtotal: purchasesTable.subtotal,
      taxAmount: purchasesTable.taxAmount,
      discount: purchasesTable.discount,
      grandTotal: purchasesTable.grandTotal,
      paidAmount: purchasesTable.paidAmount,
      balanceDue: purchasesTable.balanceDue,
      paymentStatus: purchasesTable.paymentStatus,
      createdAt: purchasesTable.createdAt,
    })
    .from(purchasesTable)
    .leftJoin(suppliersTable, eq(purchasesTable.supplierId, suppliersTable.id))
    .where(whereClause)
    .orderBy(desc(purchasesTable.invoiceDate))
    .limit(limit)
    .offset(offset);

  res.json({
    data: purchases.map(p => ({
      ...p,
      supplierName: p.supplierName || "Unknown",
      invoiceDate: p.invoiceDate.toISOString().split("T")[0],
      subtotal: Number(p.subtotal),
      taxAmount: Number(p.taxAmount),
      discount: Number(p.discount),
      grandTotal: Number(p.grandTotal),
      paidAmount: Number(p.paidAmount),
      balanceDue: Number(p.balanceDue),
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/purchases", authMiddleware, requireRole("super_admin", "admin", "store_keeper"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreatePurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { invoiceNo, invoiceDate, supplierId, items, discount = 0, paidAmount = 0, isInterState = false } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;
      const processedItems: any[] = [];

      for (const item of items) {
        const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
        if (!product) throw new Error(`Product with id ${item.productId} not found`);

        const lineTotal = item.quantity * item.unitPrice;
        const lineDiscount = item.discount ?? 0;
        const taxableAmount = lineTotal - lineDiscount;
        const gstRate = Number(product.gstRate);
        const taxAmount = taxableAmount * (gstRate / 100);

        let cgst = 0, sgst = 0, igst = 0;
        if (isInterState) {
          igst = taxAmount;
        } else {
          cgst = taxAmount / 2;
          sgst = taxAmount / 2;
        }

        subtotal += taxableAmount;
        totalTax += taxAmount;

        processedItems.push({
          productId: item.productId,
          quantity: String(item.quantity),
          unit: product.unit,
          unitPrice: String(item.unitPrice),
          discount: String(lineDiscount),
          gstRate: String(gstRate),
          cgst: String(Math.round(cgst * 100) / 100),
          sgst: String(Math.round(sgst * 100) / 100),
          igst: String(Math.round(igst * 100) / 100),
          total: String(Math.round((taxableAmount + taxAmount) * 100) / 100),
        });
      }

      const grandTotal = subtotal + totalTax - discount;
      const balanceDue = grandTotal - paidAmount;
      const paymentStatus = balanceDue <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";

      const [purchase] = await tx.insert(purchasesTable).values({
        invoiceNo,
        invoiceDate: new Date(invoiceDate),
        supplierId,
        subtotal: String(Math.round(subtotal * 100) / 100),
        taxAmount: String(Math.round(totalTax * 100) / 100),
        discount: String(discount),
        grandTotal: String(Math.round(grandTotal * 100) / 100),
        paidAmount: String(paidAmount),
        balanceDue: String(Math.round(balanceDue * 100) / 100),
        paymentStatus,
        isInterState: String(isInterState),
        createdBy: req.user?.userId,
      }).returning();

      for (const item of processedItems) {
        await tx.insert(purchaseItemsTable).values({ purchaseId: purchase.id, ...item });
      }

      for (const item of items) {
        await tx.update(productsTable).set({
          currentStock: sql`(${productsTable.currentStock}::numeric + ${item.quantity})::text`,
        }).where(eq(productsTable.id, item.productId));
      }

      const [supplier] = await tx.select().from(suppliersTable).where(eq(suppliersTable.id, supplierId)).limit(1);
      return { purchase, supplierName: supplier?.name || "Unknown" };
    });

    const { purchase, supplierName } = result;
    res.status(201).json({
      id: purchase.id,
      invoiceNo: purchase.invoiceNo,
      invoiceDate: purchase.invoiceDate.toISOString().split("T")[0],
      supplierId: purchase.supplierId,
      supplierName,
      subtotal: Number(purchase.subtotal),
      taxAmount: Number(purchase.taxAmount),
      discount: Number(purchase.discount),
      grandTotal: Number(purchase.grandTotal),
      paidAmount: Number(purchase.paidAmount),
      balanceDue: Number(purchase.balanceDue),
      paymentStatus: purchase.paymentStatus,
      createdAt: purchase.createdAt.toISOString(),
    });
  } catch (error: any) {
    const msg = error.message || "Failed to create purchase";
    const isBusinessError = msg.includes("not found");
    res.status(isBusinessError ? 400 : 500).json({ error: isBusinessError ? msg : "Internal server error" });
  }
});

router.get("/purchases/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetPurchaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [purchase] = await db
    .select({
      id: purchasesTable.id,
      invoiceNo: purchasesTable.invoiceNo,
      invoiceDate: purchasesTable.invoiceDate,
      supplierId: purchasesTable.supplierId,
      supplierName: suppliersTable.name,
      subtotal: purchasesTable.subtotal,
      taxAmount: purchasesTable.taxAmount,
      discount: purchasesTable.discount,
      grandTotal: purchasesTable.grandTotal,
      paidAmount: purchasesTable.paidAmount,
      balanceDue: purchasesTable.balanceDue,
      paymentStatus: purchasesTable.paymentStatus,
      createdAt: purchasesTable.createdAt,
    })
    .from(purchasesTable)
    .leftJoin(suppliersTable, eq(purchasesTable.supplierId, suppliersTable.id))
    .where(eq(purchasesTable.id, params.data.id))
    .limit(1);

  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  const items = await db
    .select({
      productId: purchaseItemsTable.productId,
      productName: productsTable.name,
      quantity: purchaseItemsTable.quantity,
      unit: purchaseItemsTable.unit,
      unitPrice: purchaseItemsTable.unitPrice,
      discount: purchaseItemsTable.discount,
      gstRate: purchaseItemsTable.gstRate,
      cgst: purchaseItemsTable.cgst,
      sgst: purchaseItemsTable.sgst,
      igst: purchaseItemsTable.igst,
      total: purchaseItemsTable.total,
    })
    .from(purchaseItemsTable)
    .leftJoin(productsTable, eq(purchaseItemsTable.productId, productsTable.id))
    .where(eq(purchaseItemsTable.purchaseId, purchase.id));

  res.json({
    ...purchase,
    supplierName: purchase.supplierName || "Unknown",
    invoiceDate: purchase.invoiceDate.toISOString().split("T")[0],
    subtotal: Number(purchase.subtotal),
    taxAmount: Number(purchase.taxAmount),
    discount: Number(purchase.discount),
    grandTotal: Number(purchase.grandTotal),
    paidAmount: Number(purchase.paidAmount),
    balanceDue: Number(purchase.balanceDue),
    items: items.map(i => ({
      ...i,
      productName: i.productName || "Unknown",
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      gstRate: Number(i.gstRate),
      cgst: Number(i.cgst),
      sgst: Number(i.sgst),
      igst: Number(i.igst),
      total: Number(i.total),
    })),
    createdAt: purchase.createdAt.toISOString(),
  });
});

router.patch("/purchases/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = UpdatePurchaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: any = {};
  if (parsed.data.paidAmount !== undefined) {
    updateData.paidAmount = String(parsed.data.paidAmount);
    const [existing] = await db.select().from(purchasesTable).where(eq(purchasesTable.id, params.data.id)).limit(1);
    if (existing) {
      const balance = Number(existing.grandTotal) - parsed.data.paidAmount;
      updateData.balanceDue = String(Math.max(0, balance));
      updateData.paymentStatus = balance <= 0 ? "paid" : parsed.data.paidAmount > 0 ? "partial" : "pending";
    }
  }
  if (parsed.data.paymentStatus !== undefined) updateData.paymentStatus = parsed.data.paymentStatus;

  const [purchase] = await db.update(purchasesTable).set(updateData).where(eq(purchasesTable.id, params.data.id)).returning();
  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, purchase.supplierId)).limit(1);

  res.json({
    id: purchase.id,
    invoiceNo: purchase.invoiceNo,
    invoiceDate: purchase.invoiceDate.toISOString().split("T")[0],
    supplierId: purchase.supplierId,
    supplierName: supplier?.name || "Unknown",
    subtotal: Number(purchase.subtotal),
    taxAmount: Number(purchase.taxAmount),
    discount: Number(purchase.discount),
    grandTotal: Number(purchase.grandTotal),
    paidAmount: Number(purchase.paidAmount),
    balanceDue: Number(purchase.balanceDue),
    paymentStatus: purchase.paymentStatus,
    createdAt: purchase.createdAt.toISOString(),
  });
});

router.delete("/purchases/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = DeletePurchaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [purchase] = await db.delete(purchasesTable).where(eq(purchasesTable.id, params.data.id)).returning();
  if (!purchase) {
    res.status(404).json({ error: "Purchase not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
