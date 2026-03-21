import { useState, useEffect } from "react";
import { 
  useGetDashboardStats, 
  useGetSalesTrend, 
  useGetTopProducts, 
  useGetRecentTransactions 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  IndianRupee, ShoppingCart, Package, AlertTriangle, 
  TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownRight, Clock,
  BarChart3, Sparkles, RefreshCw, Lightbulb, Target, Shield, Zap,
  PackageX, Wallet, LayoutGrid
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface AiInsight {
  icon: string;
  title: string;
  description: string;
  type: "success" | "warning" | "info" | "danger";
}

const insightIcons: Record<string, any> = {
  "trending-up": TrendingUp,
  "alert": AlertTriangle,
  "lightbulb": Lightbulb,
  "target": Target,
  "shield": Shield,
  "zap": Zap,
};

const insightColors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", icon: "text-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  warning: { bg: "bg-amber-500/5", border: "border-amber-500/20", icon: "text-amber-500", text: "text-amber-700 dark:text-amber-400" },
  info: { bg: "bg-blue-500/5", border: "border-blue-500/20", icon: "text-blue-500", text: "text-blue-700 dark:text-blue-400" },
  danger: { bg: "bg-rose-500/5", border: "border-rose-500/20", icon: "text-rose-500", text: "text-rose-700 dark:text-rose-400" },
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: trendData, isLoading: trendLoading } = useGetSalesTrend();
  const { data: topProducts, isLoading: topLoading } = useGetTopProducts();
  const { data: recent, isLoading: recentLoading } = useGetRecentTransactions();

  const [categorySales, setCategorySales] = useState<any[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${import.meta.env.BASE_URL}api/dashboard/category-sales`, { headers })
      .then(r => r.json()).then(setCategorySales).catch(() => {});
    fetch(`${import.meta.env.BASE_URL}api/dashboard/inventory-health`, { headers })
      .then(r => r.json()).then(setInventoryHealth).catch(() => {});
  }, []);

  const fetchAiInsights = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setAiLoading(true);
    const forceParam = aiLoaded ? "?force=true" : "";
    fetch(`${import.meta.env.BASE_URL}api/dashboard/ai-insights${forceParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setAiInsights(data.insights || []); setAiLoaded(true); })
      .catch(() => { setAiInsights([{ icon: "lightbulb", title: "Error", description: "Could not load AI insights.", type: "info" }]); setAiLoaded(true); })
      .finally(() => setAiLoading(false));
  };

  useEffect(() => { fetchAiInsights(); }, []);

  if (statsLoading || trendLoading) return <DashboardSkeleton />;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const s = stats as any;

  const kpis = [
    { title: "Monthly Revenue", value: formatCurrency(s?.monthlyRevenue || 0), icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-500/10", change: s?.revenueGrowth, subtitle: "vs last month" },
    { title: "Gross Profit", value: formatCurrency(s?.grossProfit || 0), icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", subtitle: s?.monthlyRevenue > 0 ? `${((s?.grossProfit / s?.monthlyRevenue) * 100).toFixed(1)}% margin` : "—" },
    { title: "Today's Sales", value: formatCurrency(s?.todaySales || 0), icon: ShoppingCart, color: "text-indigo-500", bg: "bg-indigo-500/10", subtitle: `${s?.monthlySalesCount || 0} orders this month` },
    { title: "Stock Valuation", value: formatCurrency(s?.stockValuation || 0), icon: Package, color: "text-violet-500", bg: "bg-violet-500/10", subtitle: `${s?.totalProducts || 0} products` },
    { title: "Low Stock", value: s?.lowStockItems || 0, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", subtitle: `${s?.outOfStockItems || 0} out of stock` },
    { title: "Pending Dues", value: formatCurrency(s?.pendingPayments || 0), icon: Wallet, color: "text-rose-500", bg: "bg-rose-500/10", subtitle: "unpaid invoices" },
  ];

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Business overview and AI-powered insights</p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Data
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden group relative">
              <CardContent className="p-5 flex items-start gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{kpi.title}</p>
                  <h3 className="text-xl font-bold text-foreground font-display truncate">{kpi.value}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {kpi.change !== undefined && (
                      <span className={`inline-flex items-center text-xs font-semibold ${kpi.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {kpi.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(kpi.change)}%
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{kpi.subtitle}</span>
                  </div>
                </div>
              </CardContent>
              <div className="absolute -right-3 -bottom-3 opacity-[0.03] group-hover:scale-110 transition-transform">
                <kpi.icon className="w-28 h-28" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {(aiLoaded || aiLoading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">AI Business Insights</CardTitle>
                      <CardDescription className="text-xs">Powered by AI analysis of your data</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchAiInsights}
                    disabled={aiLoading}
                    className="gap-1.5 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl border border-border/50">
                        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : aiInsights.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Loading insights...</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">AI is analyzing your business data</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiInsights.map((insight, i) => {
                      const colors = insightColors[insight.type] || insightColors.info;
                      const Icon = insightIcons[insight.icon] || Lightbulb;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`flex gap-3 p-3.5 rounded-xl border ${colors.border} ${colors.bg}`}
                        >
                          <div className={`w-9 h-9 rounded-lg bg-background shadow-sm flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4.5 h-4.5 ${colors.icon}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${colors.text}`}>{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Revenue & Expenses</CardTitle>
                <CardDescription className="text-xs">30-day sales vs purchases trend</CardDescription>
              </div>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), "dd")}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(val) => val >= 1000 ? `₹${(val/1000).toFixed(0)}k` : `₹${val}`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    width={55}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', background: 'hsl(var(--card))' }}
                    labelFormatter={(val) => format(new Date(val), "MMM dd, yyyy")}
                    formatter={(val: number, name: string) => [formatCurrency(val), name]}
                  />
                  <Area type="monotone" name="Sales" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" name="Purchases" dataKey="purchases" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 3" fillOpacity={1} fill="url(#colorPurchases)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Health</CardTitle>
            <CardDescription className="text-xs">Stock status distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            {inventoryHealth.length > 0 ? (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryHealth}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="status"
                        strokeWidth={0}
                      >
                        {inventoryHealth.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => [`${val} items`, ""]} contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', fontSize: '13px', background: 'hsl(var(--card))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2">
                  {inventoryHealth.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.status}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No inventory data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Category Performance</CardTitle>
                <CardDescription className="text-xs">Revenue by product category</CardDescription>
              </div>
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {categorySales.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySales} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(val) => val >= 1000 ? `₹${(val/1000).toFixed(0)}k` : `₹${val}`} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={90} />
                    <Tooltip formatter={(val: number) => [formatCurrency(val), "Revenue"]} contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', fontSize: '13px', background: 'hsl(var(--card))' }} />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {categorySales.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No category sales data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Top Products</CardTitle>
                <CardDescription className="text-xs">Best sellers by revenue</CardDescription>
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-3">
              {topProducts?.map((product, i) => {
                const maxRevenue = topProducts[0]?.totalRevenue || 1;
                const barWidth = (product.totalRevenue / maxRevenue) * 100;
                return (
                  <div key={product.id} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${COLORS[i % COLORS.length]}15`, color: COLORS[i % COLORS.length] }}>
                          {i + 1}
                        </div>
                        <span className="font-medium text-sm text-foreground line-clamp-1">{product.name}</span>
                      </div>
                      <span className="font-semibold text-sm tabular-nums">{formatCurrency(product.totalRevenue)}</span>
                    </div>
                    <div className="ml-9 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{product.totalQuantity} sold</span>
                    </div>
                  </div>
                );
              })}
              {(!topProducts || topProducts.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">No sales data available yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase">
                <tr className="border-b border-border/50">
                  <th className="px-4 py-2.5 font-medium">Invoice</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Party</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent?.map((tx, i) => (
                  <motion.tr
                    key={`${tx.type}-${tx.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{tx.invoiceNo}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${tx.type === 'sale' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800' : 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800'}`}>
                        {tx.type === 'sale' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        <span className="capitalize">{tx.type}</span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.partyName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 font-semibold text-right tabular-nums">{formatCurrency(tx.amount)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {(!recent || recent.length === 0) && (
              <div className="text-center py-8 text-muted-foreground text-sm">No recent transactions</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-[360px] rounded-2xl" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>
    </div>
  );
}
