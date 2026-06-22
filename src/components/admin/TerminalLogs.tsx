'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

interface SystemLog {
  id: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO' | string;
  timestamp: Timestamp | null;
}

export function TerminalLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'system_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs: SystemLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedLogs.push({
            id: doc.id,
            message: data.message || '',
            severity: data.severity || 'INFO',
            timestamp: data.timestamp || null,
          });
        });
        setLogs(fetchedLogs.reverse());
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to system logs:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logs]);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'ERROR':
        return 'text-[#ff3b30] text-shadow-neon-red';
      case 'WARNING':
        return 'text-amber-400';
      case 'INFO':
      default:
        return 'text-slate-300';
    }
  };

  const formatTimestamp = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return `[${date.toISOString()}]`;
    } catch {
      return '';
    }
  };

  const systemLogs = logs;
  const logsArray = systemLogs || [];

  return (
    <div 
      ref={containerRef}
      className="p-5 font-mono text-xs space-y-2 max-h-60 overflow-y-auto bg-black/95 select-text scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
    >
      {loading && logsArray.length === 0 ? (
        <div className="text-slate-500 animate-pulse">CONNECTING TO SECURITY CONTEXT GATEWAY...</div>
      ) : logsArray.length === 0 ? (
        <div className="text-slate-500">NO LOG ENTRIES FOUND. INGESTION POOL SECURE.</div>
      ) : (
        logsArray.map((log) => (
          <div 
            key={log.id} 
            className={`leading-relaxed break-all ${getSeverityColor(log.severity)}`}
          >
            <span className="text-slate-500 mr-2 select-none">
              {formatTimestamp(log.timestamp)}
            </span>
            <span>{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
