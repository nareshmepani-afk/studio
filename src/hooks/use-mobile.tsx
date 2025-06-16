
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize state to a sensible default (e.g., false).
  // The actual value will be set on the client-side in useEffect.
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // This effect should only run on the client.
    if (typeof window === "undefined") {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Handler for media query changes.
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Set the initial state based on the current media query status.
    setIsMobile(mql.matches);

    // Add the event listener.
    // Using try-catch for broader compatibility, though addEventListener is standard.
    try {
      mql.addEventListener('change', handleChange);
    } catch (e1) {
      // Fallback for older browsers that might use addListener
      try {
        (mql as any).addListener(handleChange);
      } catch (e2) {
        console.error("Failed to add media query listener for resize changes.", e2);
      }
    }

    // Cleanup function to remove the listener when the component unmounts.
    return () => {
      try {
        mql.removeEventListener('change', handleChange);
      } catch (e1) {
        try {
          (mql as any).removeListener(handleChange);
        } catch (e2) {
          console.error("Failed to remove media query listener for resize changes.", e2);
        }
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount.

  return isMobile;
}
