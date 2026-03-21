import { useState, useEffect } from "react";
import { useGetBusinessProfile, useUpdateBusinessProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const { data, isLoading } = useGetBusinessProfile();
  const updateMutation = useUpdateBusinessProfile();

  const [form, setForm] = useState({
    name: "", address: "", gstin: "", state: "", phone: "", email: "",
    bankName: "", bankAccount: "", bankIfsc: "", invoicePrefix: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        address: data.address || "",
        gstin: data.gstin || "",
        state: data.state || "",
        phone: data.phone || "",
        email: data.email || "",
        bankName: data.bankName || "",
        bankAccount: data.bankAccount || "",
        bankIfsc: data.bankIfsc || "",
        invoicePrefix: data.invoicePrefix || "INV",
      });
    }
  }, [data]);

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({ data: form });
      toast({ title: "Business profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error?.data?.error || "Something went wrong", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Business Settings</h1>

      <Card>
        <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Business Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>GSTIN</Label><Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} /></div>
            <div><Label>State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bank Details (for Invoice Footer)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Bank Name</Label><Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Account Number</Label><Input value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} /></div>
            <div><Label>IFSC Code</Label><Input value={form.bankIfsc} onChange={e => setForm(f => ({ ...f, bankIfsc: e.target.value }))} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Invoice Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Invoice Prefix</Label><Input value={form.invoicePrefix} onChange={e => setForm(f => ({ ...f, invoicePrefix: e.target.value }))} /></div>
            <div><Label>Next Invoice Number</Label><Input value={data?.nextInvoiceNum || 1} disabled /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>Save Changes</Button>
      </div>
    </div>
  );
}
