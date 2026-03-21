import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  store_keeper: "Store Keeper",
  accountant: "Accountant",
  viewer: "Viewer",
};

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" as string });

  const { data, isLoading } = useListUsers({ page, limit: 20, search: search || undefined });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        const updateData: any = { name: form.name, email: form.email, role: form.role };
        await updateMutation.mutateAsync({ id: editingUser.id, data: updateData });
        toast({ title: "User updated successfully" });
      } else {
        await createMutation.mutateAsync({ data: form as any });
        toast({ title: "User created successfully" });
      }
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error?.data?.error || "Something went wrong", variant: "destructive" });
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setIsDialogOpen(true);
  };

  const toggleActive = async (user: any) => {
    try {
      await updateMutation.mutateAsync({ id: user.id, data: { active: !user.active } });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: `User ${user.active ? "deactivated" : "activated"}` });
    } catch (error: any) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User deleted" });
      setDeleteId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error?.data?.error || "Something went wrong", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "viewer" });
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>Add User</Button>
      </div>

      <Input placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            )) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
            ) : data?.data?.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><Badge variant="secondary">{roleLabels[user.role] || user.role}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={user.active} onCheckedChange={() => toggleActive(user)} />
                    <span className="text-sm">{user.active ? "Active" : "Inactive"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(user.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="py-2 px-3 text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            {!editingUser && <div><Label>Password *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>}
            <div>
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="store_keeper">Store Keeper</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.email || (!editingUser && !form.password)}>{editingUser ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete User?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
