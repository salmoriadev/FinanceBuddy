import * as React from "react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { formatDateInput, toIsoDate } from "@/lib/date";
import { usePreferences } from "@/hooks/usePreferences";

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
        const iso = toIsoDate(value);
        return /^\\d{4}-\\d{2}-\\d{2}$/.test(iso) ? iso : "";
      }
      return "";
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const iso = event.target.value;
      const formatted = iso ? formatDateInput(iso) : "";
      const syntheticEvent = {
        ...event,
        target: { ...event.target, value: formatted },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="date"
        lang={language}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  },
);
DateInput.displayName = "DateInput";

export { DateInput };
