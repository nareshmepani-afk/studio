import { useState, useEffect } from 'react';

const MOBILE_USER_AGENT_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => {
      setIsMobile(window.innerWidth < 768);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < 768);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
