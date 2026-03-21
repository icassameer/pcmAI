import { useState } from "react";
import { useListSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliersData, isLoading } = useListSuppliers({ page, limit: 10, search });
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const [formData, setFormData] = useState({ name: "", contactPerson: "", phone: "", email: "", gstin: "", address: "" });

  const openCreate = () => {
    setFormData({ name: "", contactPerson: "", phone: "", email: "", gstin: "", address: "" });
    setEditingId(null); setDialogOpen(true);
  };

  const openEdit = (sup: Supplier) => {
    setFormData({
      name: sup.name, contactPerson: sup.contactPerson || "", phone: sup.phone || "",
      email: sup.email || "", gstin: sup.gstin || "", address: sup.address || ""
    });
    setEditingId(sup.id); setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
          setDialogOpen(false); toast({ title: "Supplier updated" });
        }
      });
    } else {
      createMutation.mutate({ data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
          setDialogOpen(false); toast({ title: "Supplier created" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this supplier?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
          toast({ title: "Supplier deleted" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suppliers</h2>
          <p className="text-muted-foreground text-sm">Manage your vendors and distributors</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
          </div>
          <Button onClick={openCreate} className="rounded-xl shrink-0"><Plus className="w-4 h-4 mr-2" /> Add</Button>
        </div>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Business Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">GSTIN</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></td></tr>
                ) : suppliersData?.data.map((sup) => (
                  <tr key={sup.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{sup.name}</td>
                    <td className="px-6 py-4">
                      <div>{sup.contactPerson || '-'}</div>
                      <div className="text-xs text-muted-foreground">{sup.phone || sup.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{sup.gstin || 'N/A'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(sup)} className="h-8 w-8 hover:text-primary"><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sup.id)} className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingId ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Business Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
