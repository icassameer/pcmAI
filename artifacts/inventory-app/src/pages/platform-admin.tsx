import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Users, TrendingUp, AlertTriangle, MoreVertical, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function authFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("accessToken") ?? "";
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts?.headers },
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    trial: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    grace: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    suspended: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge variant="outline" className={`capitalize ${map[status] ?? ""}`}>{status}</Badge>
  );
}

function planBadge(plan: string) {
  const map: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    starter: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    pro: "bg-primary/10 text-primary border-primary/20",
  };
  return <Badge variant="outline" className={`capitalize ${map[plan] ?? ""}`}>{plan}</Badge>;
}

export default function PlatformAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => authFetch("/platform/stats").then(r => r.json()),
  });

  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: () => authFetch("/platform/tenants").then(r => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, plan }: { id: number; status?: string; plan?: string }) =>
      authFetch(`/platform/tenants/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, plan }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-tenants"] });
      qc.invalidateQueries({ queryKey: ["platform-stats"] });
      toast({ title: "Tenant updated" });
    },
    onError: () => toast({ variant: "destructive", title: "Update failed" }),
  });

  const tenants: any[] = tenantsData?.tenants ?? [];

  const statCards = [
    { label: "Total Tenants", value: stats?.tenants.total ?? 0, icon: Building2, color: "text-primary" },
    { label: "Active", value: stats?.tenants.active ?? 0, icon: Users, color: "text-green-500" },
    { label: "On Trial", value: stats?.tenants.trial ?? 0, icon: TrendingUp, color: "text-amber-500" },
    { label: "Suspended", value: (stats?.tenants.suspended ?? 0) + (stats?.tenants.grace ?? 0), icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Platform Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all tenants across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["platform-tenants"] })}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue card */}
      {stats?.revenue && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{Number(stats.revenue.totalRevenue).toLocaleString("en-IN")}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.revenue.totalSales} total sales across all tenants</p>
          </CardContent>
        </Card>
      )}

      {/* Tenants table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading tenants…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No tenants yet</TableCell>
                  </TableRow>
                ) : tenants.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{planBadge(t.plan)}</TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell className="text-right">{t.userCount}</TableCell>
                    <TableCell className="text-right">{t.salesCount}</TableCell>
                    <TableCell className="text-right">₹{Number(t.totalRevenue).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {t.status !== "active" && (
                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: t.id, status: "active" })}>
                              Activate
                            </DropdownMenuItem>
                          )}
                          {t.status !== "suspended" && (
                            <DropdownMenuItem
                              onClick={() => updateStatus.mutate({ id: t.id, status: "suspended" })}
                              className="text-destructive focus:text-destructive"
                            >
                              Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: t.id, plan: "starter" })}>
                            Set: Starter
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: t.id, plan: "pro" })}>
                            Set: Pro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: t.id, plan: "free" })}>
                            Set: Free
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
