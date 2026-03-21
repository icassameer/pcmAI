import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, Package, Tags, Users, Building2, 
  ShoppingCart, Receipt, FileText, Settings, ShieldCheck, 
  LogOut, Menu, X, ChevronDown, Moon, Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, checkRole } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["super_admin", "admin", "store_keeper", "accountant", "viewer"] },
    { name: "Products", path: "/products", icon: Package, roles: ["super_admin", "admin", "store_keeper", "viewer"] },
    { name: "Categories", path: "/categories", icon: Tags, roles: ["super_admin", "admin", "store_keeper"] },
    { name: "Purchases", path: "/purchases", icon: ShoppingCart, roles: ["super_admin", "admin", "store_keeper", "accountant"] },
    { name: "Sales", path: "/sales", icon: Receipt, roles: ["super_admin", "admin", "accountant", "viewer"] },
    { name: "Customers", path: "/customers", icon: Users, roles: ["super_admin", "admin", "accountant"] },
    { name: "Suppliers", path: "/suppliers", icon: Building2, roles: ["super_admin", "admin", "store_keeper", "accountant"] },
    { name: "Reports", path: "/reports", icon: FileText, roles: ["super_admin", "admin", "accountant"] },
    { name: "Business Settings", path: "/settings", icon: Settings, roles: ["super_admin", "admin"] },
    { name: "Users", path: "/users", icon: ShieldCheck, roles: ["super_admin"] },
  ];

  const filteredNav = navItems.filter(item => checkRole(item.roles as any[]));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all md:relative md:flex shrink-0 overflow-hidden"
      >
        <div className="flex h-16 shrink-0 items-center px-6 font-display text-xl font-bold border-b border-sidebar-border/50">
          <Package className="w-6 h-6 text-primary mr-3" />
          <span className="truncate">InventoPro</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {filteredNav.map((item) => {
              const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path} className="block">
                  <div className={`
                    flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer
                    ${isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}
                  `}>
                    <item.icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center px-3 py-3 rounded-xl bg-sidebar-accent/50">
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm/5 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0 text-muted-foreground hover:text-foreground">
              {sidebarOpen ? <Menu className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold font-display hidden sm:block">
              {filteredNav.find(n => n.path === location || (n.path !== "/" && location.startsWith(n.path)))?.name || "Overview"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-muted-foreground hover:text-foreground">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-2 pr-1 gap-2 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
