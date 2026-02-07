/**
 * This file implements Date Input behavior for the frontend component layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import * as React from "react";
import { Input } from "@/components/ui/input";
import { parseDateInput } from "@/lib/date";
import { usePreferences } from "@/hooks/usePreferences";
import { format, isValid } from "date-fns";

type DateInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ onChange, onBlur, value, ...props }, ref) => {
    const { locale } = usePreferences();
    const language = locale === "pt-BR" ? "pt-BR" : "en-GB";

    const inputValue = React.useMemo(() => {
      if (value instanceof Date) {
        return format(value, "yyyy-MM-dd");
      }
      if (typeof value === "string" && value.length > 0) {
        if (/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) {
          return value;
        }
        const parsed = parseDateInput(value);
        return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : "";
      }
      return "";
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="date"
        lang={language}
        value={inputValue}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  },
);
DateInput.displayName = "DateInput";

export { DateInput };
