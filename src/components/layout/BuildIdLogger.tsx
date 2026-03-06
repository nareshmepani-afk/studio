"use client";

import { useEffect } from "react";

const BuildIdLogger = () => {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BUILD_ID) {
      console.log(`Build ID: ${process.env.NEXT_PUBLIC_BUILD_ID}`);
    }
  }, []);

  return null;
};

export default BuildIdLogger;
