import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { passwordRules } from "@/lib/password";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/hooks/useI18n";

const buildLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("auth.emailInvalid")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });

const buildSignupSchema = (t: (key: string) => string) =>
  z
    .object({
      email: z.string().email(t("auth.emailInvalid")),
      password: z
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
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordMismatch"),
      path: ["confirmPassword"],
    });

type AuthFormData = {
  email: string;
  password: string;
  confirmPassword?: string;
};

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark" || resolvedTheme === "dark";
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const resolver = useMemo(
    () =>
      zodResolver(
        isLogin ? buildLoginSchema(t) : buildSignupSchema(t),
      ),
    [isLogin, t],
  );

  const form = useForm<AuthFormData>({
    resolver,
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    form.reset({
      email: form.getValues("email") || "",
      password: "",
      confirmPassword: "",
    });
  }, [isLogin, form]);

  const passwordValue = form.watch("password") || "";

  const formatAuthError = (error: Error, mode: "login" | "signup") => {
    if (error instanceof ApiError) {
      const lowerMessage = error.message?.toLowerCase?.() || "";
      if (
        lowerMessage.includes("cannot post") ||
        lowerMessage.includes("not found") ||
        lowerMessage.includes("api_url not configured")
      ) {
        return t("auth.serviceUnavailable");
      }
      if (mode === "login" && error.status === 401) {
        return t("auth.invalidCredentials");
      }
      if (mode === "signup" && error.status === 409) {
        return t("auth.emailExists");
      }
      if (error.status === 429) {
        return t("auth.tooManyAttempts");
      }
      if (error.status >= 500) {
        return t("auth.serviceUnavailable");
      }
      return t("auth.genericError");
    }

    const message = error.message?.toLowerCase() || "";
    if (message.includes("fetch") || message.includes("network")) {
      return t("auth.networkError");
    }

    return t("auth.genericError");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          toast.error(formatAuthError(error, "login"));
        } else {
          toast.success(t("auth.loginSuccess"));
        }
      } else {
        const { error } = await signUp(data.email, data.password);
        if (error) {
          toast.error(formatAuthError(error, "signup"));
        } else {
          toast.success(t("auth.signupSuccess"));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition hover:bg-muted"
        aria-label={t("common.toggleTheme")}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-3xl font-normal tracking-normal">
            FinanceBuddy
          </CardTitle>
          <CardDescription>
            {isLogin ? t("auth.loginTitle") : t("auth.signupTitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={t("auth.passwordPlaceholder")}
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? t("password.hide") : t("password.show")}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isLogin && (
                <>
                  <PasswordStrength password={passwordValue} />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.confirmPassword")}</FormLabel>
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
                </>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLogin ? t("auth.signIn") : t("auth.signUp")}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
