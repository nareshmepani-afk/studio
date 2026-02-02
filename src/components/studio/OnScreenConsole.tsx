"use client";

import { useState, useEffect } from 'react';

interface LogEntry {
  type: 'log' | 'error' | 'warn';
  message: any[];
}

export const OnScreenConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const originalConsole = { ...console };

    const intercept = (type: LogEntry['type']) => (...args: any[]) => {
      setLogs(prevLogs => [...prevLogs, { type, message: args }]);
      originalConsole[type](...args);
    };

    console.log = intercept('log');
    console.error = intercept('error');
    console.warn = intercept('warn');

    return () => {
      Object.assign(console, originalConsole);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      right: '10px',
      maxHeight: '200px',
      overflowY: 'auto',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid white', paddingBottom: '5px', marginBottom: '5px' }}>
        On-Screen Console
      </div>
      {logs.map((log, index) => (
        <div key={index} style={{ color: log.type === 'error' ? 'red' : log.type === 'warn' ? 'yellow' : 'white', marginBottom: '5px' }}>
          <strong>{log.type.toUpperCase()}:</strong> {log.message.map(m => JSON.stringify(m)).join(' ')}
        </div>
      ))}
    </div>
  );
};
