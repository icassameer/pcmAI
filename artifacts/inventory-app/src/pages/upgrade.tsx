import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    priceMonthly: 499,
    priceYearly: 4990,
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    maxUsers: 3,
    maxProducts: 500,
    features: ["3 users", "500 products", "GST billing & reports", "Email support"],
  },
  {
    key: "pro",
    name: "Pro",
    priceMonthly: 999,
    priceYearly: 9990,
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    maxUsers: null,
    maxProducts: null,
    features: ["Unlimited users", "Unlimited products", "GST billing & reports", "API access", "Priority support"],
    popular: true,
  },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetch(`${API_BASE}/billing/razorpay-key`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.keyId) setRazorpayKeyId(d.keyId); })
      .catch(() => {});
  }, []);

  const handleUpgrade = async (planKey: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLocation("/login"); return; }

    setLoading(planKey);
    try {
      const res = await fetch(`${API_BASE}/billing/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planName: planKey, billingCycle: cycle }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: data.error });
        return;
      }

      if (!razorpayKeyId) {
        toast({ variant: "destructive", title: "Payment not configured", description: "Add Razorpay keys to .env to enable payments." });
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast({ variant: "destructive", title: "Could not load Razorpay checkout" });
        return;
      }

      const plan = PLANS.find(p => p.key === planKey)!;
      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: "INR",
        name: "InventoPro",
        description: `${plan.name} — ${cycle === "yearly" ? "Yearly" : "Monthly"}`,
        handler: async (response: any) => {
          // Verify payment
          const vRes = await fetch(`${API_BASE}/billing/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...response, planName: planKey }),
          });
          const vData = await vRes.json();
          if (vRes.ok && vData.success) {
            toast({ title: "Payment successful!", description: `You're now on the ${plan.name} plan.` });
            setLocation("/");
          } else {
            toast({ variant: "destructive", title: "Verification failed", description: vData.error });
          }
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#6366f1" },
      });
      rzp.open();
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setLoading(null);
    }
  };

  const price = (plan: typeof PLANS[0]) =>
    cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold mb-2">Upgrade your plan</h1>
          <p className="text-muted-foreground">Choose the plan that fits your business</p>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center mt-6 p-1 bg-muted rounded-xl gap-1">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${cycle === "monthly" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${cycle === "yearly" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs bg-green-500/10 text-green-600 border-0">Save 17%</Badge>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.key}
              className={`relative border-2 ${plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className={`w-10 h-10 rounded-xl ${plan.bg} flex items-center justify-center mb-3`}>
                  <plan.icon className={`w-5 h-5 ${plan.color}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">₹{price(plan).toLocaleString()}</span>
                  <span className="text-muted-foreground">/{cycle === "yearly" ? "yr" : "mo"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading === plan.key}
                >
                  {loading === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Payments secured by Razorpay &nbsp;·&nbsp; Cancel anytime
        </p>
      </motion.div>
    </div>
  );
}
