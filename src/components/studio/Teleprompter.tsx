import React from 'react';

interface TeleprompterProps {
  text: string;
  scrollSpeed: number;
  fontSize: number;
}

const Teleprompter: React.FC<TeleprompterProps> = ({ text, scrollSpeed, fontSize }) => {
  return (
    <div
      style={{
        fontFamily: 'Playfair Display, serif',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        color: 'white',
        padding: '20px',
        overflowY: 'scroll',
        height: '100%',
      }}
    >
      <p style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.3s' }}>{text}</p>
    </div>
  );
};

export default Teleprompter;
