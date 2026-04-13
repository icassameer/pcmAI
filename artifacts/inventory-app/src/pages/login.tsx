import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("Admin@123");
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        login(data.accessToken, data.refreshToken, data.user);
        toast({ title: "Welcome back!", description: `Logged in as ${data.user.name}` });
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Login Failed", 
          description: err?.response?.data?.error || "Invalid credentials" 
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
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
            <CardHeader className="space-y-1 pb-6 pt-8 px-8 text-center">
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-background border-border focus:ring-primary/20" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-background border-border focus:ring-primary/20" 
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold group shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In 
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-center">
                <p className="font-medium text-primary mb-1">Demo Credentials:</p>
                <p className="text-muted-foreground">admin@demo.com / Admin@123</p>
              </div>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                New to InventoPro?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/signup")}
                  className="text-primary font-medium hover:underline"
                >
                  Start free trial
                </button>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <div className="hidden lg:flex flex-1 relative bg-sidebar overflow-hidden items-center justify-center">
        {/* Abstract elegant dark corporate background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 opacity-90 mix-blend-multiply" />
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Login background" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="relative z-10 p-12 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/90 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              GST Ready Billing
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6 leading-tight">
              Smarter Inventory for Modern Businesses
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
              Streamline your supply chain, automate GST calculations, and gain real-time insights into your business performance.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
