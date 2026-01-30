import * as React from "react";

import { Input } from "@/components/ui/input";
import { maskDateInput } from "@/lib/date";

type DateInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ onChange, value, placeholder, inputMode, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskDateInput(event.target.value);
      const nextEvent = {
        ...event,
        target: { ...event.target, value: masked },
        currentTarget: { ...event.currentTarget, value: masked },
      };
      onChange?.(nextEvent);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={inputMode ?? "numeric"}
        placeholder={placeholder ?? "dd/mm/aaaa"}
        value={value}
        onChange={handleChange}
      />
    );
  },
);
DateInput.displayName = "DateInput";

export { DateInput };
