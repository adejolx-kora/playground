import {
  NumericInputControls,
  NumericInputDecrement,
  NumericInputField,
  NumericInputIncrement,
  NumericInputRoot,
} from "./numeric-input.tsx";

/** Public compound API for the numeric input module. */
export const NumericInput = {
  Root: NumericInputRoot,
  Field: NumericInputField,
  Controls: NumericInputControls,
  Decrement: NumericInputDecrement,
  Increment: NumericInputIncrement,
};
