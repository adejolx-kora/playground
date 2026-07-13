import { useMemo } from "react";

import type { QueryStateProviderProps } from "./query-state-types";

import { QueryStateContext } from "./query-state-context";

export function QueryStateProvider({
  children,
  location,
  navigate,
}: QueryStateProviderProps) {
  const value = useMemo(
    () => ({
      location,
      navigate,
    }),
    [location, navigate],
  );

  return (
    <QueryStateContext.Provider value={value}>
      {children}
    </QueryStateContext.Provider>
  );
}
