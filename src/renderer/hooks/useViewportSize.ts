/**
 * Custom hook to get viewport size
 * Tracks window/container dimensions for responsive features
 */

import { useState, useEffect, RefObject } from 'react';

interface ViewportSize {
  width: number;
  height: number;
}

export function useViewportSize(ref?: RefObject<HTMLElement>): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      if (ref?.current) {
        setSize({
          width: ref.current.clientWidth,
          height: ref.current.clientHeight,
        });
      } else {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    // Initial size
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ref]);

  return size;
}
