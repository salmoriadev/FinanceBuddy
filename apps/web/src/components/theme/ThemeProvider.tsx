/**
 * This file implements ThemeProvider behavior for the frontend component layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
