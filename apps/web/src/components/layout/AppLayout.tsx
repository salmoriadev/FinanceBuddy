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
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useI18n } from "@/hooks/useI18n";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark" || resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const navItems = [
    { path: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { path: "/transactions", label: t("nav.transactions"), icon: ArrowLeftRight },
    { path: "/budgets", label: t("nav.budgets"), icon: PiggyBank },
    { path: "/goals", label: t("nav.goals"), icon: Target },
    { path: "/reports", label: t("nav.reports"), icon: BarChart3 },
    { path: "/investments", label: t("nav.investments"), icon: LineChart },
    { path: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">FinanceBuddy</h1>
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
          "fixed top-0 left-0 z-50 h-full w-64 bg-card/90 backdrop-blur-xl border-r border-border/60 transition-transform duration-200 ease-in-out",
          "md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 pt-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  FinanceBuddy
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("app.tagline")}
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
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors border border-transparent",
                    isActive
                      ? "bg-primary/10 text-foreground border-primary/20 shadow-sm shadow-black/20 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-primary/80"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border pt-4 mt-auto space-y-3 pb-2">
            <div className="px-3">
              {user?.name ? (
                <>
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground/70 hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {t("nav.signOut")}
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
