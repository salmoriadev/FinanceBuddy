/**
 * This file implements NotFound behavior for the frontend page layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-semibold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          {t("notFound.title")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("notFound.description")}
        </p>
        <Button asChild className="mt-2">
          <Link to="/">{t("notFound.back")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
