import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of the provided callback.
 * The returned function delays invoking the callback until after `delay` ms
 * have elapsed since the last call. The timer is automatically cleared on unmount.
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timerRef = useRef<number | null>(null);
  // Keep callback ref in sync without causing the debounced fn to re-create
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Cancel any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
