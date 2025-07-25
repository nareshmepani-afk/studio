// src/hooks/useScript.ts
import { useEffect, useState } from 'react';

const useScript = (url: string): boolean => {
  console.log(`useScript: Hook called for URL: ${url}`);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log(`useScript: useEffect running for URL: ${url}`);
    const existingScript = document.querySelector(`script[src="${url}"]`);
    console.log(`useScript: Checking for existing script: ${existingScript ? 'Found' : 'Not Found'}`);

    if (existingScript) {
      console.log('useScript: Script already exists, checking load status.');
      if ((existingScript as any).dataset.loaded) {
        console.log('useScript: Existing script already marked as loaded.');
        setLoaded(true);
      } else {
        console.log('useScript: Existing script not marked loaded, adding listeners.');
        existingScript.addEventListener('load', () => {
          console.log(`useScript: Existing script loaded event for URL: ${url}`);
          setLoaded(true);
        });
        existingScript.addEventListener('error', () => {
          console.error(`useScript: Failed to load EXISTING script: ${url}`);
        });
      }
      return;
    }

    // Create script element
    console.log('useScript: Creating new script element.');
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    (script as any).dataset.loaded = 'false'; // Custom attribute to track loading

    const onScriptLoad = () => {
      console.log(`useScript: New script loaded event for URL: ${url}`);
      script.dataset.loaded = 'true';
      setLoaded(true);
    };

    const onScriptError = () => {
      console.error(`useScript: Failed to load NEW script: ${url}`);
      // Depending on requirements, you might want to handle error state differently
    };

    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', onScriptError);

    // Append script to document body
    console.log('useScript: Appending new script to document body.');
    document.body.appendChild(script);

    // Clean up on unmount
    return () => {
      console.log(`useScript: Cleanup running for URL: ${url}`);
      script.removeEventListener('load', onScriptLoad);
      script.removeEventListener('error', onScriptError);
      // Optionally remove the script tag if not needed after unmount,
      // but keeping it might be better if other components use it.
      // if (document.body.contains(script)) {
      //   console.log(`useScript: Removing script from body: ${url}`);
      //   document.body.removeChild(script);
      // }
    };
  }, [url]); // Re-run effect if script URL changes

  return loaded;
};

export default useScript;
