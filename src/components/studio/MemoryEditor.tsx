'use client';

import { useState } from 'react';
import HostRoom from './HostRoom';
import StorytellerRoom from './StorytellerRoom';
import GuestRoom from './GuestRoom';
import InterviewerRoom from './InterviewerRoom';

// Define a placeholder for the memory data type
type MemoryData = any;

interface MemoryEditorProps {
    memoryData: MemoryData;
    onUpdate: (updatedData: MemoryData) => void;
}

const MemoryEditor = ({ memoryData, onUpdate }: MemoryEditorProps) => {
    const [activeRoom, setActiveRoom] = useState<'host' | 'story' | 'guest' | 'interview'>('host');

    const handleUpdate = (updatedData: MemoryData) => {
        onUpdate(updatedData);
    };

    const renderRoom = () => {
        switch (activeRoom) {
            case 'host':
                return <HostRoom data={memoryData} update={handleUpdate} />;
            case 'story':
                return <StorytellerRoom data={memoryData} update={handleUpdate} />;
            case 'guest':
                return <GuestRoom data={memoryData} update={handleUpdate} />;
            case 'interview':
                return <InterviewerRoom data={memoryData} update={handleUpdate} />;
            default:
                return <div>Select a room to begin editing.</div>;
        }
    };

    return (
        <div>
            <nav className="flex space-x-4 p-4 bg-gray-800">
                <button onClick={() => setActiveRoom('host')} className={`px-4 py-2 rounded ${activeRoom === 'host' ? 'bg-blue-500' : 'bg-gray-700'}`}>Host</button>
                <button onClick={() => setActiveRoom('story')} className={`px-4 py-2 rounded ${activeRoom === 'story' ? 'bg-blue-500' : 'bg-gray-700'}`}>Storyteller</button>
                <button onClick={() => setActiveRoom('guest')} className={`px-4 py-2 rounded ${activeRoom === 'guest' ? 'bg-blue-500' : 'bg-gray-700'}`}>Guest</button>
                <button onClick={() => setActiveRoom('interview')} className={`px-4 py-2 rounded ${activeRoom === 'interview' ? 'bg-blue-500' : 'bg-gray-700'}`}>Interviewer</button>
            </nav>
            <div className="p-4">
                {renderRoom()}
            </div>
        </div>
    );
};

export default MemoryEditor;
