import React from 'react';

export default function TVLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {children}
    </div>
  );
}
