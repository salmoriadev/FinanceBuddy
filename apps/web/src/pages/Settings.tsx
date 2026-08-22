import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { usePreferences } from "@/hooks/usePreferences";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";

export default function Settings() {
  const { user, loading, updateProfile } = useAuth();
  const { t } = useI18n();
  const { currency } = usePreferences();
  const [name, setName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setSelectedCurrency(currency);
  }, [user?.name, currency]);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      name: name.trim() ? name.trim() : null,
      locale: "pt-BR",
      currency: selectedCurrency,
    });
    if (error) {
      toast.error(t("settings.error"));
    } else {
      toast.success(t("settings.saved"));
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-4xl font-normal tracking-normal text-foreground">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("settings.account")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("settings.name")}
                </label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("settings.namePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("settings.email")}
                </label>
                <Input value={user.email} disabled />
              </div>
              <div className="pt-2">
                <ChangePasswordDialog
                  triggerVariant="outline"
                  triggerClassName="w-full justify-center"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("settings.preferences")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("settings.currency")}
                </label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) =>
                    setSelectedCurrency(value as "BRL" | "USD")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">
                      {t("settings.currency.brl")}
                    </SelectItem>
                    <SelectItem value="USD">
                      {t("settings.currency.usd")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {t("settings.save")}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
