
'use client';

import React from 'react';

interface SessionIdWitnessProps {
  sessionId: string | null | undefined;
}

const SessionIdWitness: React.FC<SessionIdWitnessProps> = ({ sessionId }) => {
  const witnessStyle: React.CSSProperties = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(255, 255, 0, 0.85)',
    color: '#000',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
    zIndex: 9999,
    border: '2px solid #000',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  };

  return (
    <div style={witnessStyle}>
      <strong>Witnessing Session ID:</strong>
      <pre
        style={{
          margin: '4px 0 0 0',
          padding: '4px',
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '4px',
        }}
      >
        {sessionId || 'NULL_OR_UNDEFINED'}
      </pre>
    </div>
  );
};

export default SessionIdWitness;
