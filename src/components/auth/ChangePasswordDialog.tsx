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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual obrigatória"),
    newPassword: z
      .string()
      .min(
        passwordRules.minLength,
        "A senha deve ter pelo menos 8 caracteres",
      )
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
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordDialog() {
  const { user, changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resolver = useMemo(() => zodResolver(changePasswordSchema), []);
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
      if (message.includes("Invalid login credentials")) {
        toast.error("Senha atual incorreta");
      } else {
        toast.error(message || "Erro ao atualizar senha");
      }
      return;
    }
    toast.success("Senha atualizada com sucesso!");
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
          Trocar senha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Trocar senha</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
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
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
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
            <PasswordStrength password={newPassword} />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
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
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Esconder senhas" : "Mostrar senhas"}
            </Button>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Atualizar senha
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
