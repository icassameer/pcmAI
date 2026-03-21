import { db, usersTable, categoriesTable, suppliersTable, productsTable, businessProfileTable } from "@workspace/db";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Seeding database...");

  const existing = await db.select().from(usersTable).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded. Skipping.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("Admin@123", 12);
  await db.insert(usersTable).values({
    name: "Super Admin",
    email: "admin@demo.com",
    passwordHash,
    role: "super_admin",
    active: true,
  });
  console.log("Created Super Admin: admin@demo.com / Admin@123");

  const [cat1] = await db.insert(categoriesTable).values({ name: "Electronics", description: "Electronic items and gadgets" }).returning();
  const [cat2] = await db.insert(categoriesTable).values({ name: "Groceries", description: "Food and grocery items" }).returning();
  const [cat3] = await db.insert(categoriesTable).values({ name: "Hardware", description: "Hardware tools and supplies" }).returning();
  const [cat4] = await db.insert(categoriesTable).values({ name: "Stationery", description: "Office and school supplies" }).returning();
  const [cat5] = await db.insert(categoriesTable).values({ name: "Textiles", description: "Fabrics and clothing" }).returning();
  console.log("Created 5 categories");

  const [sup1] = await db.insert(suppliersTable).values({
    name: "Tech Distributors Pvt Ltd",
    contactPerson: "Rajesh Kumar",
    phone: "9876543210",
    email: "rajesh@techdist.com",
    address: "123 Industrial Area, Delhi",
    gstin: "07AABCT1234A1Z5",
    state: "Delhi",
  }).returning();

  const [sup2] = await db.insert(suppliersTable).values({
    name: "Fresh Foods India",
    contactPerson: "Priya Sharma",
    phone: "9876543211",
    email: "priya@freshfoods.com",
    address: "456 Market Road, Mumbai",
    gstin: "27AABCF5678B1Z3",
    state: "Maharashtra",
  }).returning();
  console.log("Created 2 suppliers");

  const products = [
    { name: "Wireless Mouse", categoryId: cat1.id, brand: "Logitech", hsnCode: "8471", unit: "pcs", purchasePrice: "450", sellingPrice: "699", mrp: "799", gstRate: "18", currentStock: "150", minStockAlert: "20", sku: "WM-001", supplierId: sup1.id },
    { name: "USB Keyboard", categoryId: cat1.id, brand: "Dell", hsnCode: "8471", unit: "pcs", purchasePrice: "350", sellingPrice: "549", mrp: "649", gstRate: "18", currentStock: "200", minStockAlert: "25", sku: "KB-002", supplierId: sup1.id },
    { name: "Basmati Rice", categoryId: cat2.id, brand: "India Gate", hsnCode: "1006", unit: "kg", purchasePrice: "80", sellingPrice: "120", mrp: "130", gstRate: "5", currentStock: "500", minStockAlert: "50", sku: "BR-003", supplierId: sup2.id },
    { name: "Sugar", categoryId: cat2.id, brand: "Uttam", hsnCode: "1701", unit: "kg", purchasePrice: "38", sellingPrice: "45", mrp: "50", gstRate: "5", currentStock: "300", minStockAlert: "100", sku: "SG-004", supplierId: sup2.id },
    { name: "Hammer", categoryId: cat3.id, brand: "Stanley", hsnCode: "8205", unit: "pcs", purchasePrice: "180", sellingPrice: "299", mrp: "350", gstRate: "18", currentStock: "75", minStockAlert: "15", sku: "HM-005", supplierId: sup1.id },
    { name: "Nails (Box)", categoryId: cat3.id, brand: "Kamdhenu", hsnCode: "7317", unit: "box", purchasePrice: "50", sellingPrice: "80", mrp: "90", gstRate: "18", currentStock: "400", minStockAlert: "50", sku: "NL-006", supplierId: sup1.id },
    { name: "A4 Paper Ream", categoryId: cat4.id, brand: "JK Copier", hsnCode: "4802", unit: "pack", purchasePrice: "200", sellingPrice: "280", mrp: "300", gstRate: "12", currentStock: "100", minStockAlert: "20", sku: "AP-007", supplierId: sup1.id },
    { name: "Ball Pen (Pack of 10)", categoryId: cat4.id, brand: "Cello", hsnCode: "9608", unit: "pack", purchasePrice: "60", sellingPrice: "90", mrp: "100", gstRate: "12", currentStock: "250", minStockAlert: "30", sku: "BP-008", supplierId: sup1.id },
    { name: "Cotton Fabric", categoryId: cat5.id, brand: "Raymond", hsnCode: "5208", unit: "meter", purchasePrice: "150", sellingPrice: "250", mrp: "280", gstRate: "5", currentStock: "1000", minStockAlert: "100", sku: "CF-009", supplierId: sup2.id },
    { name: "Olive Oil", categoryId: cat2.id, brand: "Figaro", hsnCode: "1509", unit: "ltr", purchasePrice: "350", sellingPrice: "480", mrp: "520", gstRate: "5", currentStock: "8", minStockAlert: "15", sku: "OO-010", supplierId: sup2.id },
  ];

  for (const p of products) {
    await db.insert(productsTable).values(p);
  }
  console.log("Created 10 sample products");

  await db.insert(businessProfileTable).values({
    name: "Demo Business Pvt Ltd",
    address: "100 Business Park, Bengaluru, Karnataka",
    gstin: "29AABCD1234E1Z5",
    state: "Karnataka",
    phone: "080-12345678",
    email: "info@demobusiness.com",
    bankName: "State Bank of India",
    bankAccount: "1234567890",
    bankIfsc: "SBIN0001234",
    invoicePrefix: "INV",
    nextInvoiceNum: 1,
  });
  console.log("Created business profile");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
