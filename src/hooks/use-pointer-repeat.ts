import * as React from "react";

/**
 * Hook for pointer repeat behavior (holds to repeat action).
 * Used for increment/decrement buttons.
 */
export function usePointerRepeat(action: () => void) {
  const actionRef = React.useRef(action);
  const timeoutRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    actionRef.current = action;
  }, [action]);

  const stop = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  React.useEffect(() => stop, [stop]);

  const start = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      stop();
      actionRef.current();

      timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          actionRef.current();
        }, 80);
      }, 320);
    },
    [stop],
  );

  return { start, stop };
}
