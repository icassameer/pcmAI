import { useState } from "react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, FolderTree } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories, isLoading } = useListCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const openCreate = () => {
    setName(""); setDescription(""); setEditingCat(null); setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setName(cat.name); setDescription(cat.description || ""); setEditingCat(cat); setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      updateMutation.mutate({ id: editingCat.id, data: { name, description } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
          setDialogOpen(false);
          toast({ title: "Category updated" });
        }
      });
    } else {
      createMutation.mutate({ data: { name, description } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
          setDialogOpen(false);
          toast({ title: "Category created" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this category? Products might be affected.")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
          toast({ title: "Category deleted" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Categories</h2>
          <p className="text-muted-foreground text-sm">Organize your products</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading && Array(4).fill(0).map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-muted/50 rounded-2xl" />
        ))}
        {categories?.map((cat) => (
          <Card key={cat.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <h3 className="font-semibold text-lg">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{cat.description || "No description"}</p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary text-xs font-medium">
                {cat.productCount} Products
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
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
