'''
import { useState, useEffect } from 'react';

const MOBILE_USER_AGENT_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const MAX_MOBILE_WIDTH = 768; // Common tablet breakpoint

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Client-side only check
    const userAgent = navigator.userAgent;
    const isUserAgentMobile = MOBILE_USER_AGENT_REGEX.test(userAgent);

    // Check screen width for more reliability (e.g., small desktop windows)
    const screenWidth = window.innerWidth;
    const isSmallScreen = screenWidth < MAX_MOBILE_WIDTH;

    // Consider it mobile if either is true, but prioritize user agent for devices that aren't just small screens.
    setIsMobile(isUserAgentMobile || isSmallScreen);

    const handleResize = () => {
      const newScreenWidth = window.innerWidth;
      setIsMobile(MOBILE_USER_AGENT_REGEX.test(navigator.userAgent) || newScreenWidth < MAX_MOBILE_WIDTH);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

'''