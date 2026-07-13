import * as React from "react";

import type {
  NumericInputUiContextValue,
  NumericInputValueContextValue,
} from "./numeric-input.types";

/** Internal context for stable UI configuration shared by compound children. */
export const NumericInputUiContext =
  React.createContext<NumericInputUiContextValue | null>(null);

/** Internal context for the current draft value and step actions. */
export const NumericInputValueContext =
  React.createContext<NumericInputValueContextValue | null>(null);
