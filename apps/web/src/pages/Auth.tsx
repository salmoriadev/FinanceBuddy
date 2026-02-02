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

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

const signupSchema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(passwordRules.minLength, "A senha deve ter pelo menos 8 caracteres")
      .refine(
        (value) => passwordRules.upper.test(value),
        "A senha deve conter uma letra maiúscula",
      )
      .refine(
        (value) => passwordRules.lower.test(value),
        "A senha deve conter uma letra minúscula",
      )
      .refine(
        (value) => passwordRules.number.test(value),
        "A senha deve conter um número",
      )
      .refine(
        (value) => passwordRules.symbol.test(value),
        "A senha deve conter um símbolo",
      ),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
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
  const isDark = theme === "dark" || resolvedTheme === "dark";
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const resolver = useMemo(
    () => zodResolver(isLogin ? loginSchema : signupSchema),
    [isLogin],
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
      if (mode === "login" && error.status === 401) {
        return "Email ou senha incorretos";
      }
      if (mode === "signup" && error.status === 409) {
        return "Este email já está cadastrado";
      }
      if (error.status === 429) {
        return "Muitas tentativas. Tente novamente em alguns minutos.";
      }
      if (error.status >= 500) {
        return "Serviço indisponível. Tente novamente.";
      }
      if (error.message && error.message !== "Erro na API") {
        return error.message;
      }
    }

    const message = error.message?.toLowerCase() || "";
    if (message.includes("fetch") || message.includes("network")) {
      return "Não foi possível conectar ao servidor.";
    }

    return "Não foi possível concluir a solicitação.";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          toast.error(formatAuthError(error, "login"));
        } else {
          toast.success("Login realizado com sucesso!");
        }
      } else {
        const { error } = await signUp(data.email, data.password);
        if (error) {
          toast.error(formatAuthError(error, "signup"));
        } else {
          toast.success("Conta criada com sucesso!");
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
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted"
        aria-label="Alternar tema"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            FinanceApp
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Entre na sua conta para continuar"
              : "Crie sua conta para começar"}
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={
                            showPassword ? "Esconder senha" : "Mostrar senha"
                          }
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
                        <FormLabel>Confirmar senha</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
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
                {isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
