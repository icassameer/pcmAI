import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const PLAN_HIGHLIGHTS = [
  "30-day free trial — no credit card required",
  "GST-ready billing and invoicing",
  "Real-time inventory tracking",
  "Multi-user access with role control",
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    if (form.password.length < 8) {
      toast({ variant: "destructive", title: "Password must be at least 8 characters" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tenants/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          ownerName: form.ownerName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Signup failed", description: data.error });
        return;
      }

      login(data.accessToken, data.refreshToken, data.user);
      toast({
        title: "Welcome to InventoPro!",
        description: `Your 30-day free trial has started. Enjoy!`,
      });
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">InventoPro</h1>
          </div>

          <Card className="border-border/50 shadow-2xl shadow-black/5 rounded-2xl overflow-hidden backdrop-blur-sm bg-card/90">
            <CardHeader className="space-y-1 pb-4 pt-8 px-8 text-center">
              <CardTitle className="text-2xl font-bold">Start your free trial</CardTitle>
              <CardDescription className="text-muted-foreground">
                30 days free — no credit card required
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    value={form.businessName}
                    onChange={set("businessName")}
                    placeholder="Acme Trading Co."
                    className="h-12 rounded-xl bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Your Name</Label>
                  <Input
                    id="ownerName"
                    type="text"
                    value={form.ownerName}
                    onChange={set("ownerName")}
                    placeholder="Rahul Sharma"
                    className="h-12 rounded-xl bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="rahul@acme.in"
                    className="h-12 rounded-xl bg-background border-border"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={set("password")}
                      placeholder="Min 8 chars"
                      className="h-12 rounded-xl bg-background border-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      placeholder="Repeat"
                      className="h-12 rounded-xl bg-background border-border"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold group shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feature side */}
      <div className="hidden lg:flex flex-1 relative bg-sidebar overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 opacity-90 mix-blend-multiply" />
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="relative z-10 p-12 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/90 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Free 30-day trial
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-8 leading-tight">
              Everything you need to run your business
            </h2>
            <ul className="space-y-3 text-left max-w-sm mx-auto">
              {PLAN_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
