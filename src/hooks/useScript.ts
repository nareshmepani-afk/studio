// src/hooks/useScript.ts
import { useEffect, useState } from 'react';

const useScript = (url: string): boolean => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const existingScript = document.querySelector(`script[src="${url}"]`);

    if (existingScript) {
      // If script already exists, check if it's loaded or wait for load event
      if ((existingScript as any).dataset.loaded) {
        setLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setLoaded(true));
        existingScript.addEventListener('error', () => console.error(`Failed to load script: ${url}`));
      }
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    (script as any).dataset.loaded = 'false'; // Custom attribute to track loading

    const onScriptLoad = () => {
      script.dataset.loaded = 'true';
      setLoaded(true);
    };

    const onScriptError = () => {
      console.error(`Failed to load script: ${url}`);
      // Depending on requirements, you might want to handle error state differently
    };

    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', onScriptError);

    // Append script to document body
    document.body.appendChild(script);

    // Clean up on unmount
    return () => {
      script.removeEventListener('load', onScriptLoad);
      script.removeEventListener('error', onScriptError);
      // Optionally remove the script tag if not needed after unmount,
      // but keeping it might be better if other components use it.
      // if (document.body.contains(script)) {
      //   document.body.removeChild(script);
      // }
    };
  }, [url]); // Re-run effect if script URL changes

  return loaded;
};

export default useScript;
