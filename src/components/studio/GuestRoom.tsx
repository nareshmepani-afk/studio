'use client';

import React from 'react';

// Define a placeholder for the memory data type
type MemoryData = any;

interface RoomProps {
    data: MemoryData;
    update: (updatedData: MemoryData) => void;
}

const GuestRoom = ({ data, update }: RoomProps) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">The Guest Room</h2>
      <p>Focus: Sensory Details</p>
      {/* UI Elements for media upload (photos/audio) and vibe adjectives will go here */}
    </div>
  );
};

export default GuestRoom;
