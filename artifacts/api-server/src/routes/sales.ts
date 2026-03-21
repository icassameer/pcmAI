import { Router, type IRouter } from "express";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { db, salesTable, saleItemsTable, productsTable, customersTable, businessProfileTable } from "@workspace/db";
import {
  ListSalesQueryParams,
  ListSalesResponse,
  CreateSaleBody,
  GetSaleParams,
  GetSaleResponse,
  UpdateSaleParams,
  UpdateSaleBody,
  UpdateSaleResponse,
  DeleteSaleParams,
  GetSaleInvoicePdfParams,
} from "@workspace/api-zod";
import { authMiddleware, requireRole, type AuthRequest } from "../lib/auth";
import PDFDocument from "pdfkit";

const router: IRouter = Router();

router.get("/sales", authMiddleware, async (req, res): Promise<void> => {
  const params = ListSalesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, limit = 20, customerId, startDate, endDate, status } = params.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (customerId) conditions.push(eq(salesTable.customerId, customerId));
  if (startDate) conditions.push(gte(salesTable.saleDate, new Date(startDate)));
  if (endDate) conditions.push(lte(salesTable.saleDate, new Date(endDate)));
  if (status) conditions.push(eq(salesTable.paymentStatus, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(salesTable).where(whereClause);
  const total = countResult.count;

  const sales = await db.select().from(salesTable).where(whereClause).orderBy(desc(salesTable.saleDate)).limit(limit).offset(offset);

  res.json({
    data: sales.map(s => ({
      ...s,
      saleDate: s.saleDate.toISOString().split("T")[0],
      subtotal: Number(s.subtotal),
      taxAmount: Number(s.taxAmount),
      discount: Number(s.discount),
      grandTotal: Number(s.grandTotal),
      paidAmount: Number(s.paidAmount),
      balanceDue: Number(s.balanceDue),
      createdAt: s.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/sales", authMiddleware, requireRole("super_admin", "admin", "store_keeper"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { saleDate, customerId, customerName, customerPhone, customerAddress, customerGstin, items, discount = 0, paidAmount = 0, isInterState = false } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      const [business] = await tx.select().from(businessProfileTable).limit(1);
      const invoiceNo = `${business?.invoicePrefix || "INV"}-${new Date().getFullYear()}-${String(business?.nextInvoiceNum || 1).padStart(4, "0")}`;

      if (business) {
        await tx.update(businessProfileTable).set({ nextInvoiceNum: (business.nextInvoiceNum || 1) + 1 }).where(eq(businessProfileTable.id, business.id));
      }

      let subtotal = 0;
      let totalTax = 0;
      const processedItems: any[] = [];

      for (const item of items) {
        const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
        if (!product) throw new Error(`Product with id ${item.productId} not found`);
        if (Number(product.currentStock) < item.quantity) throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock}`);

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
          hsnCode: product.hsnCode,
          total: String(Math.round((taxableAmount + taxAmount) * 100) / 100),
        });
      }

      const grandTotal = subtotal + totalTax - discount;
      const balanceDue = grandTotal - paidAmount;
      const paymentStatus = balanceDue <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";

      const [sale] = await tx.insert(salesTable).values({
        invoiceNo,
        saleDate: new Date(saleDate),
        customerId,
        customerName,
        customerPhone,
        customerAddress,
        customerGstin,
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
        await tx.insert(saleItemsTable).values({ saleId: sale.id, ...item });
      }

      for (const item of items) {
        const result = await tx.update(productsTable).set({
          currentStock: sql`(${productsTable.currentStock}::numeric - ${item.quantity})::text`,
        }).where(sql`${productsTable.id} = ${item.productId} AND ${productsTable.currentStock}::numeric >= ${item.quantity}`).returning();
        if (result.length === 0) throw new Error(`Insufficient stock for product ${item.productId} (concurrent modification)`);
      }

      return sale;
    });

    const sale = result;
    res.status(201).json({
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      saleDate: sale.saleDate.toISOString().split("T")[0],
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      customerAddress: sale.customerAddress,
      customerGstin: sale.customerGstin,
    subtotal: Number(sale.subtotal),
    taxAmount: Number(sale.taxAmount),
    discount: Number(sale.discount),
    grandTotal: Number(sale.grandTotal),
    paidAmount: Number(sale.paidAmount),
    balanceDue: Number(sale.balanceDue),
      paymentStatus: sale.paymentStatus,
      createdAt: sale.createdAt.toISOString(),
    });
  } catch (error: any) {
    const msg = error.message || "Failed to create sale";
    const isBusinessError = msg.includes("not found") || msg.includes("Insufficient stock");
    res.status(isBusinessError ? 400 : 500).json({ error: isBusinessError ? msg : "Internal server error" });
  }
});

router.get("/sales/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sale] = await db.select().from(salesTable).where(eq(salesTable.id, params.data.id)).limit(1);
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  const items = await db
    .select({
      productId: saleItemsTable.productId,
      productName: productsTable.name,
      quantity: saleItemsTable.quantity,
      unit: saleItemsTable.unit,
      unitPrice: saleItemsTable.unitPrice,
      discount: saleItemsTable.discount,
      gstRate: saleItemsTable.gstRate,
      cgst: saleItemsTable.cgst,
      sgst: saleItemsTable.sgst,
      igst: saleItemsTable.igst,
      hsnCode: saleItemsTable.hsnCode,
      total: saleItemsTable.total,
    })
    .from(saleItemsTable)
    .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
    .where(eq(saleItemsTable.saleId, sale.id));

  res.json({
    ...sale,
    saleDate: sale.saleDate.toISOString().split("T")[0],
    subtotal: Number(sale.subtotal),
    taxAmount: Number(sale.taxAmount),
    discount: Number(sale.discount),
    grandTotal: Number(sale.grandTotal),
    paidAmount: Number(sale.paidAmount),
    balanceDue: Number(sale.balanceDue),
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
    createdAt: sale.createdAt.toISOString(),
  });
});

router.get("/sales/:id/invoice-pdf", authMiddleware, async (req, res): Promise<void> => {
  const params = GetSaleInvoicePdfParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sale] = await db.select().from(salesTable).where(eq(salesTable.id, params.data.id)).limit(1);
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  const items = await db
    .select({
      productName: productsTable.name,
      quantity: saleItemsTable.quantity,
      unit: saleItemsTable.unit,
      unitPrice: saleItemsTable.unitPrice,
      discount: saleItemsTable.discount,
      gstRate: saleItemsTable.gstRate,
      cgst: saleItemsTable.cgst,
      sgst: saleItemsTable.sgst,
      igst: saleItemsTable.igst,
      hsnCode: saleItemsTable.hsnCode,
      total: saleItemsTable.total,
    })
    .from(saleItemsTable)
    .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
    .where(eq(saleItemsTable.saleId, sale.id));

  const [business] = await db.select().from(businessProfileTable).limit(1);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${sale.invoiceNo}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text("TAX INVOICE", { align: "center" });
  doc.moveDown();

  if (business) {
    doc.fontSize(14).text(business.name, { align: "left" });
    if (business.address) doc.fontSize(10).text(business.address);
    if (business.gstin) doc.text(`GSTIN: ${business.gstin}`);
    if (business.state) doc.text(`State: ${business.state}`);
    if (business.phone) doc.text(`Phone: ${business.phone}`);
  }

  doc.moveDown();
  doc.fontSize(10).text(`Invoice No: ${sale.invoiceNo}`);
  doc.text(`Date: ${sale.saleDate.toISOString().split("T")[0]}`);
  doc.moveDown();

  doc.text(`Bill To: ${sale.customerName}`);
  if (sale.customerAddress) doc.text(sale.customerAddress);
  if (sale.customerGstin) doc.text(`GSTIN: ${sale.customerGstin}`);
  if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`);
  doc.moveDown();

  const tableTop = doc.y;
  const headers = ["#", "Item", "HSN", "Qty", "Unit", "Rate", "Disc", "GST%", "CGST", "SGST", "IGST", "Total"];
  const colWidths = [20, 80, 45, 30, 30, 45, 35, 35, 40, 40, 40, 55];
  let x = 50;

  doc.fontSize(8).font("Helvetica-Bold");
  headers.forEach((h, i) => {
    doc.text(h, x, tableTop, { width: colWidths[i], align: "left" });
    x += colWidths[i];
  });

  doc.font("Helvetica").fontSize(8);
  let y = tableTop + 15;

  items.forEach((item, idx) => {
    x = 50;
    const vals = [
      String(idx + 1),
      item.productName || "",
      item.hsnCode || "",
      item.quantity,
      item.unit,
      item.unitPrice,
      item.discount,
      item.gstRate,
      item.cgst,
      item.sgst,
      item.igst,
      item.total,
    ];
    vals.forEach((v, i) => {
      doc.text(String(v), x, y, { width: colWidths[i], align: "left" });
      x += colWidths[i];
    });
    y += 15;
  });

  doc.moveDown(2);
  const rightX = 350;
  doc.fontSize(10);
  doc.text(`Subtotal: ${Number(sale.subtotal).toFixed(2)}`, rightX);
  doc.text(`Tax: ${Number(sale.taxAmount).toFixed(2)}`, rightX);
  if (Number(sale.discount) > 0) doc.text(`Discount: ${Number(sale.discount).toFixed(2)}`, rightX);
  doc.font("Helvetica-Bold").text(`Grand Total: ${Number(sale.grandTotal).toFixed(2)}`, rightX);
  doc.font("Helvetica").text(`Paid: ${Number(sale.paidAmount).toFixed(2)}`, rightX);
  doc.text(`Balance Due: ${Number(sale.balanceDue).toFixed(2)}`, rightX);

  if (business?.bankName) {
    doc.moveDown(2);
    doc.fontSize(9).text("Bank Details:");
    doc.text(`Bank: ${business.bankName}`);
    if (business.bankAccount) doc.text(`Account: ${business.bankAccount}`);
    if (business.bankIfsc) doc.text(`IFSC: ${business.bankIfsc}`);
  }

  doc.end();
});

router.patch("/sales/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: any = {};
  if (parsed.data.paidAmount !== undefined) {
    updateData.paidAmount = String(parsed.data.paidAmount);
    const [existing] = await db.select().from(salesTable).where(eq(salesTable.id, params.data.id)).limit(1);
    if (existing) {
      const balance = Number(existing.grandTotal) - parsed.data.paidAmount;
      updateData.balanceDue = String(Math.max(0, balance));
      updateData.paymentStatus = balance <= 0 ? "paid" : parsed.data.paidAmount > 0 ? "partial" : "pending";
    }
  }
  if (parsed.data.paymentStatus !== undefined) updateData.paymentStatus = parsed.data.paymentStatus;

  const [sale] = await db.update(salesTable).set(updateData).where(eq(salesTable.id, params.data.id)).returning();
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  res.json({
    ...sale,
    saleDate: sale.saleDate.toISOString().split("T")[0],
    subtotal: Number(sale.subtotal),
    taxAmount: Number(sale.taxAmount),
    discount: Number(sale.discount),
    grandTotal: Number(sale.grandTotal),
    paidAmount: Number(sale.paidAmount),
    balanceDue: Number(sale.balanceDue),
    createdAt: sale.createdAt.toISOString(),
  });
});

router.delete("/sales/:id", authMiddleware, requireRole("super_admin", "admin"), async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sale] = await db.delete(salesTable).where(eq(salesTable.id, params.data.id)).returning();
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
