import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  BarChart3,
  LineChart,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTheme } from "next-themes";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { path: "/budgets", label: "Orçamentos", icon: PiggyBank },
  { path: "/goals", label: "Metas", icon: Target },
  { path: "/reports", label: "Relatórios", icon: BarChart3 },
  { path: "/investments", label: "Investimentos", icon: LineChart },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = theme === "dark" || resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">FinanceApp</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card/95 backdrop-blur border-r border-border transition-transform duration-200 ease-in-out",
          "md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 pt-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-semibold font-serif tracking-tight text-foreground">
                  💰 FinanceApp
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestão Financeira
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border border-transparent",
                    isActive
                      ? "bg-card/80 text-foreground border-border/60 shadow-sm shadow-black/30 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-primary/70"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border pt-4 mt-4">
            <p className="text-sm text-muted-foreground truncate mb-3 px-3">
              {user?.email}
            </p>
            <div className="px-1">
              <ChangePasswordDialog />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
