import { useState, useMemo } from "react";
import { useCreateSale, useListProducts, useListCustomers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, Loader2, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray, Controller } from "react-hook-form";

export default function NewSale() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: customersData } = useListCustomers({ limit: 100 });
  const { data: productsData } = useListProducts({ limit: 500, status: "active" });
  const createMutation = useCreateSale();

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      customerId: "",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerGstin: "",
      saleDate: new Date().toISOString().split('T')[0],
      isInterState: false,
      discount: 0,
      paidAmount: 0,
      items: [{ productId: "", quantity: 1, unitPrice: 0, discount: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const formValues = watch();

  // Auto-fill customer details when selected
  const handleCustomerSelect = (id: string) => {
    setValue("customerId", id);
    const customer = customersData?.data.find(c => c.id.toString() === id);
    if (customer) {
      setValue("customerName", customer.name);
      setValue("customerPhone", customer.phone || "");
      setValue("customerAddress", customer.address || "");
      setValue("customerGstin", customer.gstin || "");
    } else {
      setValue("customerName", "");
    }
  };

  // Auto-fill price when product selected
  const handleProductSelect = (index: number, pid: string) => {
    setValue(`items.${index}.productId`, pid);
    const product = productsData?.data.find(p => p.id.toString() === pid);
    if (product) {
      setValue(`items.${index}.unitPrice`, product.sellingPrice);
    }
  };

  // Calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    
    formValues.items.forEach(item => {
      if (!item.productId) return;
      const product = productsData?.data.find(p => p.id.toString() === item.productId);
      if (!product) return;

      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const itemDisc = Number(item.discount) || 0;
      
      const itemTotal = (qty * price) - itemDisc;
      subtotal += itemTotal;
      
      const gstRate = product.gstRate || 0;
      tax += itemTotal * (gstRate / 100);
    });

    const totalDisc = Number(formValues.discount) || 0;
    const grandTotal = subtotal + tax - totalDisc;

    return { subtotal, tax, grandTotal };
  }, [formValues, productsData]);

  const onSubmit = (data: any) => {
    if (!data.customerName) {
      toast({ variant: "destructive", title: "Customer name required" });
      return;
    }
    
    const validItems = data.items.filter((i: any) => i.productId).map((i: any) => ({
      productId: parseInt(i.productId),
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount)
    }));

    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "Add at least one product" });
      return;
    }

    const payload = {
      saleDate: data.saleDate,
      customerId: data.customerId ? parseInt(data.customerId) : undefined,
      customerName: data.customerName,
      customerPhone: data.customerPhone || undefined,
      customerAddress: data.customerAddress || undefined,
      customerGstin: data.customerGstin || undefined,
      isInterState: Boolean(data.isInterState),
      discount: Number(data.discount),
      paidAmount: Number(data.paidAmount),
      items: validItems
    };

    createMutation.mutate({ data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }); // stock changed
        toast({ title: "Invoice created successfully" });
        setLocation("/sales");
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/sales">
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50 hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create Invoice</h2>
          <p className="text-muted-foreground text-sm">Generate new sales bill</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Existing Customer</Label>
                    <Select onValueChange={handleCustomerSelect} value={formValues.customerId}>
                      <SelectTrigger><SelectValue placeholder="Choose customer..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Walk-in Customer --</SelectItem>
                        {customersData?.data.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input type="date" {...register("saleDate")} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input {...register("customerName")} placeholder="Name" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input {...register("customerPhone")} placeholder="Phone" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input {...register("customerAddress")} placeholder="Address" />
                  </div>
                  <div className="space-y-2">
                    <Label>GSTIN</Label>
                    <Input {...register("customerGstin")} placeholder="GST Number" />
                  </div>
                  <div className="space-y-2 flex items-center pt-8 gap-2">
                    <input type="checkbox" id="isInterState" {...register("isInterState")} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <Label htmlFor="isInterState" className="cursor-pointer">Inter-state supply (IGST)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: "", quantity: 1, unitPrice: 0, discount: 0 })}>
                  <Plus className="w-4 h-4 mr-1" /> Add Row
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-end border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="w-full sm:flex-1 space-y-2">
                        <Label className="text-xs text-muted-foreground">Product</Label>
                        <Select 
                          value={formValues.items[index]?.productId} 
                          onValueChange={v => handleProductSelect(index, v)}
                        >
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {productsData?.data.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.currentStock} {p.unit})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-24 space-y-2">
                        <Label className="text-xs text-muted-foreground">Qty</Label>
                        <Input type="number" step="0.01" {...register(`items.${index}.quantity`)} />
                      </div>
                      <div className="w-full sm:w-28 space-y-2">
                        <Label className="text-xs text-muted-foreground">Price</Label>
                        <Input type="number" step="0.01" {...register(`items.${index}.unitPrice`)} />
                      </div>
                      <div className="w-full sm:w-24 space-y-2">
                        <Label className="text-xs text-muted-foreground">Discount</Label>
                        <Input type="number" step="0.01" {...register(`items.${index}.discount`)} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="mb-0.5 text-muted-foreground hover:text-destructive shrink-0" onClick={() => remove(index)} disabled={fields.length === 1}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Summary */}
          <div className="col-span-1">
            <Card className="rounded-2xl border-border/50 shadow-sm sticky top-24">
              <CardHeader className="bg-secondary/30 rounded-t-2xl pb-4 border-b">
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span className="font-medium">₹{totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-muted-foreground">Additional Discount</span>
                  <Input type="number" step="0.01" className="w-24 h-8 text-right" {...register("discount")} />
                </div>
                <div className="border-t border-border/50 pt-4 flex justify-between items-end">
                  <span className="font-semibold text-lg">Grand Total</span>
                  <span className="font-bold text-2xl text-primary">₹{totals.grandTotal.toFixed(2)}</span>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-xl space-y-3 mt-4 border border-primary/10">
                  <Label className="text-primary font-semibold">Payment Received</Label>
                  <Input type="number" step="0.01" className="bg-background" {...register("paidAmount")} placeholder="Enter amount paid" />
                  {totals.grandTotal - Number(formValues.paidAmount || 0) > 0 && (
                    <div className="text-sm text-amber-600 font-medium text-right">
                      Balance: ₹{(totals.grandTotal - Number(formValues.paidAmount || 0)).toFixed(2)}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl mt-4 shadow-lg shadow-primary/25 text-base"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Save & Generate Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
