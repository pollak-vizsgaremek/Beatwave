import { useState, useRef, useCallback } from "react";

const DEFAULT_DURATION = 5000;

/**
 * Shared hook for the bottom-slide error toast used across all pages.
 * Returns:
 *  - `error`     — current error string (null = hidden)
 *  - `showError` — call with a message to show it; auto-dismisses after `duration` ms
 *  - `clearError`— immediately hide the toast
 */
export const useErrorToast = (duration = DEFAULT_DURATION) => {
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback(
    (msg: string) => {
      setError(msg);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setError(null), duration);
    },
    [duration],
  );

  const clearError = useCallback(() => {
    setError(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { error, showError, clearError };
};
