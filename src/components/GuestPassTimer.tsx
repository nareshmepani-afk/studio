'use client';

import { useEffect, useState } from 'react';
import { decodeJwt } from 'jose';
import { Ticket, AlertTriangle } from 'lucide-react';

// Helper to read a specific cookie
const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

// Helper to format the remaining time
const formatTimeLeft = (milliseconds: number) => {
  if (milliseconds <= 0) return 'Expired';

  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 1) return `${days} days`;
  if (hours > 1) return `${hours} hours`;
  return `${minutes} minutes`;
};

export default function GuestPassTimer() {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [passExists, setPassExists] = useState(false);

  useEffect(() => {
    const guestPassToken = getCookie('guest_pass');

    if (guestPassToken) {
      try {
        const payload = decodeJwt(guestPassToken);
        if (payload.exp) {
          setPassExists(true);

          const updateTimer = () => {
            const expirationTime = payload.exp! * 1000;
            const remaining = expirationTime - Date.now();
            setTimeLeft(formatTimeLeft(remaining));
          };

          updateTimer(); // Initial call
          const intervalId = setInterval(updateTimer, 60000); // Update every minute

          return () => clearInterval(intervalId);
        } else {
          setPassExists(false);
        }
      } catch (e) {
        console.error('Invalid guest pass token:', e);
        setPassExists(false);
      }
    } else {
      setPassExists(false);
    }
  }, []);

  if (!passExists) {
    return (
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
        <AlertTriangle className="mx-auto mb-3 text-amber-500" />
        <h3 className="font-bold text-lg">No Active Guest Pass</h3>
        <p className="text-zinc-400 mt-1">Get a pass to view shared archives.</p>
        {/* This button would trigger the API route to issue a new pass */}
        <button className="mt-4 w-full py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400">
          Activate Pass
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-green-950/50 border border-green-700 rounded-2xl text-center">
      <Ticket className="mx-auto mb-3 text-green-400" />
      <h3 className="font-bold text-lg text-green-300">Guest Pass Active</h3>
      <p className="text-zinc-300 mt-2">You have access to shared archives.</p>
      <div className="mt-4 text-4xl font-mono font-bold text-white tabular-nums">
        {timeLeft ? timeLeft : 'Calculating...'}
      </div>
      <p className="text-zinc-400 text-sm">remaining</p>
    </div>
  );
}
