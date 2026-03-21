import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreatePurchase, useListSuppliers, useListProducts, getListPurchasesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface LineItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gstRate: number;
}

export default function NewPurchase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: suppliersData } = useListSuppliers({ page: 1, limit: 100 });
  const { data: productsData } = useListProducts({ page: 1, limit: 100 });

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [isInterState, setIsInterState] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  const createMutation = useCreatePurchase();

  const addItem = () => {
    if (!selectedProduct) return;
    const product = productsData?.data?.find((p: any) => p.id === Number(selectedProduct));
    if (!product) return;
    if (items.find(i => i.productId === product.id)) {
      toast({ title: "Product already added", variant: "destructive" });
      return;
    }
    setItems([...items, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: Number(product.purchasePrice),
      discount: 0,
      gstRate: Number(product.gstRate),
    }]);
    setSelectedProduct("");
  };

  const updateItem = (index: number, field: keyof LineItem, value: number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0);
  const totalTax = items.reduce((sum, item) => {
    const taxable = item.quantity * item.unitPrice - item.discount;
    return sum + taxable * (item.gstRate / 100);
  }, 0);
  const grandTotal = subtotal + totalTax - discount;

  const handleSubmit = async () => {
    if (!supplierId || !invoiceNo || items.length === 0) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    try {
      await createMutation.mutateAsync({
        data: {
          invoiceNo,
          invoiceDate,
          supplierId: Number(supplierId),
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
          discount,
          paidAmount,
          isInterState,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
      toast({ title: "Purchase created successfully" });
      setLocation("/purchases");
    } catch (error: any) {
      toast({ title: "Error", description: error?.data?.error || "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">New Purchase</h1>

      <Card>
        <CardHeader><CardTitle>Purchase Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Invoice No *</Label><Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} /></div>
            <div><Label>Invoice Date *</Label><Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliersData?.data?.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={isInterState} onCheckedChange={setIsInterState} />
              <Label>Inter-State (IGST)</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select product to add" /></SelectTrigger>
              <SelectContent>
                {productsData?.data?.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.sku || "No SKU"})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addItem}>Add</Button>
          </div>

          {items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-28">Unit Price</TableHead>
                  <TableHead className="w-20">Disc.</TableHead>
                  <TableHead className="w-16">GST%</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  const taxable = item.quantity * item.unitPrice - item.discount;
                  const tax = taxable * (item.gstRate / 100);
                  return (
                    <TableRow key={idx}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell><Input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", Number(e.target.value))} min={1} className="w-20" /></TableCell>
                      <TableCell><Input type="number" value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", Number(e.target.value))} min={0} className="w-28" /></TableCell>
                      <TableCell><Input type="number" value={item.discount} onChange={e => updateItem(idx, "discount", Number(e.target.value))} min={0} className="w-20" /></TableCell>
                      <TableCell>{item.gstRate}%</TableCell>
                      <TableCell className="text-right font-mono">{(taxable + tax).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                      <TableCell><Button variant="destructive" size="sm" onClick={() => removeItem(idx)}>X</Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between"><span>Subtotal:</span><span className="font-mono">{subtotal.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span></div>
          <div className="flex justify-between"><span>Tax:</span><span className="font-mono">{totalTax.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span></div>
          <div className="flex justify-between items-center">
            <span>Discount:</span>
            <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-32 text-right" min={0} />
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-3"><span>Grand Total:</span><span className="font-mono">{grandTotal.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span></div>
          <div className="flex justify-between items-center">
            <span>Paid Amount:</span>
            <Input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="w-32 text-right" min={0} />
          </div>
          <div className="flex justify-between"><span>Balance Due:</span><span className="font-mono text-destructive">{(grandTotal - paidAmount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span></div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => setLocation("/purchases")}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending}>Save Purchase</Button>
      </div>
    </div>
  );
}
