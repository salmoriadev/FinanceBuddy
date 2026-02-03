import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { passwordRules } from "@/lib/password";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";

const buildChangePasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      currentPassword: z.string().min(1, t("password.currentRequired")),
      newPassword: z
        .string()
        .min(
          passwordRules.minLength,
          t("auth.passwordMinLength"),
        )
        .refine(
          (value) => passwordRules.upper.test(value),
          t("auth.passwordUpper"),
        )
        .refine(
          (value) => passwordRules.lower.test(value),
          t("auth.passwordLower"),
        )
        .refine(
          (value) => passwordRules.number.test(value),
          t("auth.passwordNumber"),
        )
        .refine(
          (value) => passwordRules.symbol.test(value),
          t("auth.passwordSymbol"),
        ),
      confirmPassword: z.string().min(1, t("auth.passwordConfirmRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("auth.passwordMismatch"),
      path: ["confirmPassword"],
    });

type ChangePasswordFormData = z.infer<ReturnType<typeof buildChangePasswordSchema>>;

export function ChangePasswordDialog() {
  const { user, changePassword } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resolver = useMemo(
    () => zodResolver(buildChangePasswordSchema(t)),
    [t],
  );
  const form = useForm<ChangePasswordFormData>({
    resolver,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [open, form]);

  const newPassword = form.watch("newPassword") || "";

  const handleSubmit = async (data: ChangePasswordFormData) => {
    const { error } = await changePassword(
      data.currentPassword,
      data.newPassword,
    );
    if (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String((error as { message?: string }).message || "")
          : "";
      if (message.toLowerCase().includes("current password")) {
        toast.error(t("password.invalidCurrent"));
      } else {
        toast.error(message || t("password.updateError"));
      }
      return;
    }
    toast.success(t("password.updated"));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          disabled={!user?.email}
        >
          {t("nav.changePassword")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("password.changeTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password.current")}</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password.new")}</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PasswordStrength password={newPassword} />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password.confirmNew")}</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? t("password.hide") : t("password.show")}
            </Button>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("password.update")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
