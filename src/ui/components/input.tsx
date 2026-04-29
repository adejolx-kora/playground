import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  variant = "primary",
  ...props
}: React.ComponentProps<"input"> & {
  variant?: "primary" | "secondary";
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(
        "w-full min-w-0 rounded-3xs border-sm border-input-border bg-input-background-default text-base text-input-text-filled transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-input-text-filled placeholder:text-input-text-placeholder focus-visible:border-input-border-active focus-visible:ring-[1.5px] focus-visible:ring-input-border-focused focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-input-border disabled:bg-input-background-secondary disabled:text-input-text-disabled disabled:opacity-100 aria-invalid:border-input-border-error aria-invalid:text-input-text-error aria-invalid:ring-surface-error-alpha-subtle data-[variant=primary]:h-10 data-[variant=primary]:px-2xs data-[variant=primary]:py-3xs data-[variant=secondary]:h-9 data-[variant=secondary]:p-2 data-[variant=secondary]:px-2xs data-[variant=secondary]:py-4xs md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
