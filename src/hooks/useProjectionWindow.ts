import { useEffect, useRef, useCallback } from 'react';

export const useProjectionWindow = () => {
  const projectionWindowRef = useRef<Window | null>(null);
  const openAttemptedRef = useRef(false);

  const openProjectionWindow = useCallback(() => {
    if (openAttemptedRef.current) return;
    openAttemptedRef.current = true;

    const projectionUrl = `${window.location.origin}/projection.html`;
    const windowFeatures = 'width=1920,height=1080,left=1920,top=0';

    console.log('[ProjectionWindow] Attempting to open projection window...');
    try {
      projectionWindowRef.current = window.open(projectionUrl, 'bokbok_projection', windowFeatures);
      if (projectionWindowRef.current) {
        console.log('[ProjectionWindow] Successfully opened projection window');
      } else {
        console.warn('[ProjectionWindow] window.open returned null - may have been blocked by browser');
      }
    } catch (error) {
      console.warn('[ProjectionWindow] Failed to open projection window:', error);
    }
  }, []);

  useEffect(() => {
    // Attempt to open on first user interaction
    const handleFirstInteraction = () => {
      openProjectionWindow();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    // Detect if projection window was closed
    const checkWindowInterval = setInterval(() => {
      if (projectionWindowRef.current?.closed) {
        projectionWindowRef.current = null;
      }
    }, 1000);

    return () => {
      clearInterval(checkWindowInterval);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [openProjectionWindow]);

  const broadcastCaption = useCallback((text: string | null, role?: 'user' | 'ai') => {
    const payload = { type: 'UPDATE_CAPTION', text, role };
    if (!projectionWindowRef.current || projectionWindowRef.current.closed) {
      if (!openAttemptedRef.current) {
        openProjectionWindow();
      }
      // Try again shortly after opening to avoid losing the first caption
      window.setTimeout(() => {
        try {
          if (projectionWindowRef.current && !projectionWindowRef.current.closed) {
            projectionWindowRef.current.postMessage(payload, window.location.origin);
            console.log('[ProjectionWindow] Caption broadcast sent (delayed)');
          }
        } catch (error) {
          console.warn('[ProjectionWindow] Failed to send delayed caption:', error);
        }
      }, 300);
      return;
    }

    try {
      projectionWindowRef.current.postMessage(payload, window.location.origin);
      console.log('[ProjectionWindow] Caption broadcast sent');
    } catch (error) {
      console.warn('[ProjectionWindow] Failed to send caption:', error);
    }
  }, [openProjectionWindow]);

  const broadcastEvent = useCallback((payload: any) => {
    if (!projectionWindowRef.current || projectionWindowRef.current.closed) {
      if (!openAttemptedRef.current) {
        openProjectionWindow();
      }
      // Post after a short delay to give the new window a moment to initialize
      window.setTimeout(() => {
        try {
          if (projectionWindowRef.current && !projectionWindowRef.current.closed) {
            projectionWindowRef.current.postMessage(payload, window.location.origin);
            console.log('[ProjectionWindow] Event broadcast sent (delayed)', payload.type);
          }
        } catch (error) {
          console.warn('[ProjectionWindow] Failed to send delayed event:', error);
        }
      }, 300);
      return;
    }

    try {
      projectionWindowRef.current.postMessage(payload, window.location.origin);
      console.log('[ProjectionWindow] Event broadcast sent', payload.type);
    } catch (error) {
      console.warn('[ProjectionWindow] Failed to send event:', error);
    }
  }, [openProjectionWindow]);

  return { broadcastCaption, broadcastEvent };
};
