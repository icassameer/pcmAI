import { useState } from "react";
import { useListSales, useDeleteSale } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, FileText, Eye, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Sales() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: sales, isLoading } = useListSales({ page, limit: 10 });
  const deleteMutation = useDeleteSale();

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const handleDelete = (id: number) => {
    if (confirm("Delete this invoice? Stock will be reverted.")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
          toast({ title: "Sale deleted successfully" });
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">Paid</Badge>;
      case 'partial': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20">Partial</Badge>;
      default: return <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 hover:bg-rose-500/20">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sales Invoices</h2>
          <p className="text-muted-foreground text-sm">Manage customer billing and GST invoices</p>
        </div>
        <Link href="/sales/new">
          <Button className="rounded-xl shrink-0 shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4 mr-2" /> Create Invoice
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Date & Inv #</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></td></tr>
                ) : sales?.data.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{sale.invoiceNo}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(sale.saleDate), 'dd MMM yyyy')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{sale.customerName}</div>
                      {sale.customerGstin && <div className="text-xs text-muted-foreground">GST: {sale.customerGstin}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{formatCurrency(sale.grandTotal)}</div>
                      <div className="text-xs text-muted-foreground">Due: {formatCurrency(sale.balanceDue)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(sale.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => window.open(`/api/sales/${sale.id}/invoice-pdf`, '_blank')}>
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)} className="h-8 w-8 hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!sales?.data || sales.data.length === 0) && !isLoading && (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No invoices generated yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {sales && sales.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-secondary/20">
              <span className="text-sm text-muted-foreground">Page {page} of {sales.totalPages}</span>
              <div className="space-x-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p=>p-1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === sales.totalPages} onClick={() => setPage(p=>p+1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
