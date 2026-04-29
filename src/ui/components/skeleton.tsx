import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-4xs bg-surface-dark-grey-inverse",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
