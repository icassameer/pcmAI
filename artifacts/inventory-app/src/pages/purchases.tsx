import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListPurchases, useDeletePurchase, getListPurchasesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Purchases() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useListPurchases({ page, limit: 20, status: (status || undefined) as any });
  const deleteMutation = useDeletePurchase();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
      toast({ title: "Purchase deleted" });
      setDeleteId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error?.data?.error || "Something went wrong", variant: "destructive" });
    }
  };

  const statusBadge = (s: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = { paid: "default", partial: "secondary", pending: "destructive" };
    return <Badge variant={variants[s] || "secondary"}>{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <Button onClick={() => setLocation("/purchases/new")}>New Purchase</Button>
      </div>

      <div className="flex gap-4">
        <Select value={status} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            )) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No purchases found</TableCell></TableRow>
            ) : data?.data?.map((purchase: any) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-medium">{purchase.invoiceNo}</TableCell>
                <TableCell>{purchase.invoiceDate}</TableCell>
                <TableCell>{purchase.supplierName}</TableCell>
                <TableCell className="text-right font-mono">{Number(purchase.grandTotal).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                <TableCell className="text-right font-mono">{Number(purchase.paidAmount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                <TableCell className="text-right font-mono">{Number(purchase.balanceDue).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                <TableCell>{statusBadge(purchase.paymentStatus)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(purchase.id)}>Delete</Button>
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

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Purchase?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
