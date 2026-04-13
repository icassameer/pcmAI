import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import Suppliers from "@/pages/suppliers";
import Customers from "@/pages/customers";
import Sales from "@/pages/sales";
import NewSale from "@/pages/sales-new";
import Purchases from "@/pages/purchases";
import NewPurchase from "@/pages/purchases-new";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Users from "@/pages/users";
import Upgrade from "@/pages/upgrade";
import PlatformAdmin from "@/pages/platform-admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, roles }: { component: any, roles?: string[] }) {
  const { user, isLoading, checkRole } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  
  if (!user) return null;

  if (roles && !checkRole(roles as any[])) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/">
        <AppLayout><ProtectedRoute component={Dashboard} /></AppLayout>
      </Route>
      <Route path="/products">
        <AppLayout><ProtectedRoute component={Products} /></AppLayout>
      </Route>
      <Route path="/categories">
        <AppLayout><ProtectedRoute component={Categories} /></AppLayout>
      </Route>
      <Route path="/suppliers">
        <AppLayout><ProtectedRoute component={Suppliers} /></AppLayout>
      </Route>
      <Route path="/customers">
        <AppLayout><ProtectedRoute component={Customers} /></AppLayout>
      </Route>
      <Route path="/purchases">
        <AppLayout><ProtectedRoute component={Purchases} /></AppLayout>
      </Route>
      <Route path="/purchases/new">
        <AppLayout><ProtectedRoute component={NewPurchase} /></AppLayout>
      </Route>
      <Route path="/sales">
        <AppLayout><ProtectedRoute component={Sales} /></AppLayout>
      </Route>
      <Route path="/sales/new">
        <AppLayout><ProtectedRoute component={NewSale} /></AppLayout>
      </Route>
      <Route path="/reports">
        <AppLayout><ProtectedRoute component={Reports} /></AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout><ProtectedRoute component={Settings} roles={["admin"]} /></AppLayout>
      </Route>
      <Route path="/users">
        <AppLayout><ProtectedRoute component={Users} roles={["super_admin"]} /></AppLayout>
      </Route>
      <Route path="/upgrade">
        <AppLayout><ProtectedRoute component={Upgrade} /></AppLayout>
      </Route>
      <Route path="/platform">
        <AppLayout><ProtectedRoute component={PlatformAdmin} roles={["platform_admin"]} /></AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
