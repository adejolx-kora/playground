import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-3xs border-sm border-input-border bg-input-background-default px-2.5 py-2 text-base text-input-text-filled transition-colors outline-none placeholder:text-input-text-placeholder focus-visible:border-input-border-active focus-visible:ring-[1.5px] focus-visible:ring-input-border-focused focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-input-border disabled:bg-input-background-secondary disabled:text-input-text-disabled disabled:opacity-100 aria-invalid:border-input-border-error aria-invalid:text-input-text-error aria-invalid:ring-surface-error-alpha-subtle md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
