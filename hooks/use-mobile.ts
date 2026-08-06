import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_LANDSCAPE_MAX_WIDTH = 950;
const MOBILE_LANDSCAPE_MAX_HEIGHT = 500;

export function isMobileViewport(width: number, height: number): boolean {
  return (
    width < MOBILE_BREAKPOINT ||
    (width <= MOBILE_LANDSCAPE_MAX_WIDTH &&
      height <= MOBILE_LANDSCAPE_MAX_HEIGHT)
  );
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px), ` +
        `(max-width: ${MOBILE_LANDSCAPE_MAX_WIDTH}px) and ` +
        `(max-height: ${MOBILE_LANDSCAPE_MAX_HEIGHT}px)`
    );
    const onChange = () => {
      setIsMobile(isMobileViewport(window.innerWidth, window.innerHeight));
    };
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
