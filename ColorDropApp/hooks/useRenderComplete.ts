'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

type RenderCompleteCallback = () => void;

interface UseRenderCompleteOptions {
  /**
   * Minimum time to wait before considering render complete (ms)
   * Default: 0 (no minimum)
   */
  minDelay?: number;
  /**
   * Maximum time to wait before forcing completion (ms)
   * Default: 2000 (2 seconds safety net)
   */
  maxDelay?: number;
  /**
   * Whether the hook is enabled
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Hook that reliably detects when the component has fully rendered.
 * Uses requestAnimationFrame chains to wait for paint completion,
 * with a safety timeout to prevent indefinite waiting.
 *
 * This is superior to arbitrary setTimeout delays because:
 * 1. requestAnimationFrame waits for actual browser paint cycles
 * 2. Double RAF ensures layout and paint are complete
 * 3. Safety timeout prevents stuck states on slow devices
 *
 * @param callback - Function to call when render is complete
 * @param options - Configuration options
 * @returns Object with isComplete state and manual trigger
 */
export function useRenderComplete(
  callback: RenderCompleteCallback,
  options: UseRenderCompleteOptions = {}
): { isComplete: boolean; triggerComplete: () => void } {
  const { minDelay = 0, maxDelay = 2000, enabled = true } = options;

  const [isComplete, setIsComplete] = useState(false);
  const hasCalledRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const executeCallback = useCallback(() => {
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;
    setIsComplete(true);
    callback();
  }, [callback]);

  const triggerComplete = useCallback(() => {
    // Clear any pending timers
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    executeCallback();
  }, [executeCallback]);

  useEffect(() => {
    if (!enabled || hasCalledRef.current) return;

    startTimeRef.current = performance.now();

    // Safety timeout - ensures we don't wait forever on slow devices
    timeoutRef.current = setTimeout(() => {
      console.log('[useRenderComplete] Safety timeout reached, forcing completion');
      executeCallback();
    }, maxDelay);

    // Use double requestAnimationFrame for reliable render detection:
    // - First RAF: scheduled after current JS execution, before next paint
    // - Second RAF: scheduled after that paint, before the following paint
    // This ensures both layout and paint have completed
    const waitForRenderComplete = () => {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          const elapsed = performance.now() - startTimeRef.current;

          // If minimum delay hasn't passed, wait a bit more
          if (minDelay > 0 && elapsed < minDelay) {
            const remaining = minDelay - elapsed;
            setTimeout(() => {
              executeCallback();
            }, remaining);
          } else {
            executeCallback();
          }
        });
      });
    };

    // Start the render detection chain
    waitForRenderComplete();

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, minDelay, maxDelay, executeCallback]);

  return { isComplete, triggerComplete };
}

/**
 * Simpler version that just returns when render is complete.
 * No callback needed - just check the return value.
 */
export function useIsRenderComplete(
  options: UseRenderCompleteOptions = {}
): boolean {
  const [isComplete, setIsComplete] = useState(false);

  useRenderComplete(
    () => setIsComplete(true),
    options
  );

  return isComplete;
}
