"use client";

import { useEffect } from "react";

const BuildIdLogger = () => {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_COMMIT_HASH) {
      console.log(`Commit Hash: ${process.env.NEXT_PUBLIC_COMMIT_HASH}`);
    }
  }, []);

  return null;
};

export default BuildIdLogger;
