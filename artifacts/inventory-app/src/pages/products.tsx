import { useState } from "react";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useListCategories, useListSuppliers, Product } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit2, Trash2, Filter, AlertCircle, ArrowUpDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const productSchema = z.object({
  name: z.string().min(1, "Name required"),
  categoryId: z.coerce.number().optional().nullable(),
  brand: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
  unit: z.enum(["gm", "kg", "ltr", "ml", "pcs", "tonne", "meter", "feet", "box", "dozen", "pack"] as const),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0),
  gstRate: z.coerce.number().min(0),
  currentStock: z.coerce.number().min(0),
  minStockAlert: z.coerce.number().min(0),
  location: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  supplierId: z.coerce.number().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Products() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: productsData, isLoading } = useListProducts({ page, limit: 10, search });
  const { data: categories } = useListCategories();
  const { data: suppliersData } = useListSuppliers({ limit: 100 });
  const suppliers = suppliersData?.data || [];

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: "pcs", currentStock: 0, minStockAlert: 10, gstRate: 18 }
  });

  const openCreate = () => {
    reset({ unit: "pcs", currentStock: 0, minStockAlert: 10, gstRate: 18 });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    reset({
      name: product.name, categoryId: product.categoryId, brand: product.brand,
      hsnCode: product.hsnCode, unit: product.unit, purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice, mrp: product.mrp, gstRate: product.gstRate,
      currentStock: product.currentStock, minStockAlert: product.minStockAlert,
      location: product.location, sku: product.sku, supplierId: product.supplierId
    });
    setEditingId(product.id);
    setDialogOpen(true);
  };

  const onSubmit = (data: ProductFormData) => {
    // clean up nulls for strict types
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
      supplierId: data.supplierId || undefined,
      brand: data.brand || undefined,
      hsnCode: data.hsnCode || undefined,
      location: data.location || undefined,
      sku: data.sku || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          setDialogOpen(false);
          toast({ title: "Product updated successfully" });
        }
      });
    } else {
      createMutation.mutate({ data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          setDialogOpen(false);
          toast({ title: "Product created successfully" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          toast({ title: "Product deleted" });
        }
      });
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <p className="text-muted-foreground text-sm">Manage your inventory catalog</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/50 rounded-xl"
            />
          </div>
          <Button onClick={openCreate} className="rounded-xl shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Name / SKU</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></td></tr>
                ) : productsData?.data.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{product.name}</div>
                      <div className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'} • {product.brand || 'No brand'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-secondary/50 font-normal">{product.categoryName || 'Uncategorized'}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{formatCurrency(product.sellingPrice)}</div>
                      <div className="text-xs text-muted-foreground">Pur: {formatCurrency(product.purchasePrice)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${product.currentStock <= product.minStockAlert ? 'text-destructive' : 'text-emerald-600'}`}>
                          {product.currentStock} {product.unit}
                        </span>
                        {product.currentStock <= product.minStockAlert && (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)} className="h-8 w-8 hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!productsData?.data || productsData.data.length === 0) && !isLoading && (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {productsData && productsData.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-secondary/20">
              <span className="text-sm text-muted-foreground">Page {page} of {productsData.totalPages}</span>
              <div className="space-x-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p=>p-1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === productsData.totalPages} onClick={() => setPage(p=>p+1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input {...register("name")} placeholder="Enter product name" />
                {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Controller name="categoryId" control={control} render={({field}) => (
                  <Select value={field.value?.toString() || ""} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Controller name="unit" control={control} render={({field}) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pcs", "kg", "gm", "ltr", "ml", "box", "pack", "dozen"].map(u => 
                        <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input {...register("sku")} placeholder="Stock Keeping Unit" />
              </div>
              
              <div className="col-span-1 md:col-span-2"><hr className="border-border/50" /></div>
              
              <div className="space-y-2">
                <Label>Purchase Price (₹) *</Label>
                <Input type="number" step="0.01" {...register("purchasePrice")} />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (₹) *</Label>
                <Input type="number" step="0.01" {...register("sellingPrice")} />
              </div>
              <div className="space-y-2">
                <Label>MRP (₹) *</Label>
                <Input type="number" step="0.01" {...register("mrp")} />
              </div>
              <div className="space-y-2">
                <Label>GST Rate (%) *</Label>
                <Controller name="gstRate" control={control} render={({field}) => (
                  <Select value={field.value.toString()} onValueChange={v => field.onChange(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 5, 12, 18, 28].map(r => <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="col-span-1 md:col-span-2"><hr className="border-border/50" /></div>

              <div className="space-y-2">
                <Label>Opening Stock</Label>
                <Input type="number" step="0.01" {...register("currentStock")} disabled={!!editingId} />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input type="number" step="0.01" {...register("minStockAlert")} />
              </div>
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input {...register("hsnCode")} />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Controller name="supplierId" control={control} render={({field}) => (
                  <Select value={field.value?.toString() || ""} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Update Product" : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
