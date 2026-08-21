import { Link } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const { t } = useI18n();

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
          <Link to="/dashboard">{t("notFound.back")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
