import * as React from "react";

import { Input } from "@/components/ui/input";
import { toIsoDate } from "@/lib/date";

type DateInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ onChange, value, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
    };

    const normalizedValue =
      value && typeof value === "string" ? toIsoDate(value) : (value ?? "");

    return (
      <Input
        {...props}
        ref={ref}
        type="date"
        value={normalizedValue}
        onChange={handleChange}
      />
    );
  },
);
DateInput.displayName = "DateInput";

export { DateInput };
