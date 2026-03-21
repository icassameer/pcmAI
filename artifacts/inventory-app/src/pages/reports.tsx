import { useState } from "react";
import {
  useGetSalesSummaryReport,
  useGetPurchaseSummaryReport,
  useGetInventoryReport,
  useGetGstSummaryReport,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function SalesReport() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "annual">("monthly");
  const { data, isLoading } = useGetSalesSummaryReport({ period });

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select value={period} onValueChange={v => setPeriod(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-bold">{Number(data?.totalSales || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Tax</p><p className="text-2xl font-bold">{Number(data?.totalTax || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Discount</p><p className="text-2xl font-bold">{Number(data?.totalDiscount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Transactions</p><p className="text-2xl font-bold">{data?.transactionCount || 0}</p></CardContent></Card>
      </div>

      {data?.breakdown && data.breakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Breakdown by Period</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Period</TableHead><TableHead className="text-right">Sales</TableHead><TableHead className="text-right">Tax</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.breakdown.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.period}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.sales).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.tax).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PurchaseReport() {
  const { data, isLoading } = useGetPurchaseSummaryReport();

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Purchases</p><p className="text-2xl font-bold">{Number(data?.totalPurchases || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Tax</p><p className="text-2xl font-bold">{Number(data?.totalTax || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending Payments</p><p className="text-2xl font-bold text-destructive">{Number(data?.pendingPayments || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Discount</p><p className="text-2xl font-bold">{Number(data?.totalDiscount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Transactions</p><p className="text-2xl font-bold">{data?.transactionCount || 0}</p></CardContent></Card>
    </div>
  );
}

function InventoryReport() {
  const [type, setType] = useState<"current" | "low-stock" | "out-of-stock" | "dead-stock" | "valuation">("current");
  const { data, isLoading } = useGetInventoryReport({ type });

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <Select value={type} onValueChange={v => setType(v as any)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            <SelectItem value="dead-stock">Dead Stock (90 days)</SelectItem>
            <SelectItem value="valuation">Valuation</SelectItem>
          </SelectContent>
        </Select>
        {data && <span className="text-sm text-muted-foreground">{data.totalItems} items | Total Value: {Number(data.totalValue).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span>}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            )) : data?.items?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>
            ) : data?.items?.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.sku || "-"}</TableCell>
                <TableCell>{item.category || "-"}</TableCell>
                <TableCell className={`text-right ${item.currentStock <= item.minStockAlert ? "text-destructive font-bold" : ""}`}>{item.currentStock}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-right font-mono">{Number(item.purchasePrice).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                <TableCell className="text-right font-mono">{Number(item.sellingPrice).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                <TableCell className="text-right font-mono">{Number(item.stockValue).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function GstReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading } = useGetGstSummaryReport({ month, year });

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString("en", { month: "long" })}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => {
              const y = now.getFullYear() - i;
              return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Output Tax (Sales)</p><p className="text-2xl font-bold">{Number(data?.outputTax || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Input Tax (Purchases)</p><p className="text-2xl font-bold">{Number(data?.inputTax || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Net GST Payable</p><p className={`text-2xl font-bold ${(data?.netPayable || 0) > 0 ? "text-destructive" : "text-green-600"}`}>{Number(data?.netPayable || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p></CardContent></Card>
      </div>

      {data?.salesBreakdown && data.salesBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Sales Tax Breakdown</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>GST Rate</TableHead><TableHead className="text-right">Taxable Amount</TableHead><TableHead className="text-right">CGST</TableHead><TableHead className="text-right">SGST</TableHead><TableHead className="text-right">IGST</TableHead><TableHead className="text-right">Total Tax</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.salesBreakdown.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.gstRate}%</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.taxableAmount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.cgst).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.sgst).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.igst).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.totalTax).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data?.purchaseBreakdown && data.purchaseBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Purchase Tax Breakdown (Input Credit)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>GST Rate</TableHead><TableHead className="text-right">Taxable Amount</TableHead><TableHead className="text-right">CGST</TableHead><TableHead className="text-right">SGST</TableHead><TableHead className="text-right">IGST</TableHead><TableHead className="text-right">Total Tax</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.purchaseBreakdown.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.gstRate}%</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.taxableAmount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.cgst).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.sgst).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.igst).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                    <TableCell className="text-right font-mono">{Number(row.totalTax).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="gst">GST Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-6"><SalesReport /></TabsContent>
        <TabsContent value="purchases" className="mt-6"><PurchaseReport /></TabsContent>
        <TabsContent value="inventory" className="mt-6"><InventoryReport /></TabsContent>
        <TabsContent value="gst" className="mt-6"><GstReport /></TabsContent>
      </Tabs>
    </div>
  );
}
