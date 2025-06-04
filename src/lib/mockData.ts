
import type { Memory, Prompt, MemoryCategory, MediaAttachment } from '@/types';

const videoPlaceholderUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; // A real video for testing trim
const audioPlaceholderUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3"; // A real audio for testing

export const mockMemories: Memory[] = [
  {
    id: '1',
    title: 'Trip to the Mountains (Video)',
    date: '2023-07-15T10:00:00.000Z',
    description: 'A wonderful weekend getaway with breathtaking views and challenging hikes. This video is trimmed.',
    category: 'Travel',
    userId: '1',
    mediaAttachments: [{ 
        id: 'media1-1',
        type: 'video', 
        url: videoPlaceholderUrl,
        filename: 'mountain_trip.mp4',
        startTime: 5, // Start at 5 seconds
        endTime: 15,   // End at 15 seconds
        duration: 596 // Actual duration of BigBuckBunny is ~596s
    }],
    imageUrl: 'https://placehold.co/600x400.png', // Fallback or cover image
  },
  {
    id: '2',
    title: 'Family Reunion 2023 (Full Audio)',
    date: '2023-12-23T18:30:00.000Z',
    description: 'Gathered with the whole family for the holidays. So much food and laughter! This is a full audio.',
    category: 'Family',
    userId: '1',
    mediaAttachments: [{
        id: 'media2-1',
        type: 'audio',
        url: audioPlaceholderUrl,
        filename: 'family_reunion.mp3',
        duration: 2 // Actual duration of t-rex-roar is ~2s
    }],
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: '3',
    title: 'Project Alpha Launch (Untrimmed Video)',
    date: '2024-01-20T14:00:00.000Z',
    description: 'Successfully launched Project Alpha after months of hard work. Proud of the team! This video plays in full.',
    category: 'Work',
    userId: '1',
    mediaAttachments: [{
        id: 'media3-1',
        type: 'video',
        url: videoPlaceholderUrl, // Using same video for variety
        filename: 'project_alpha.mp4',
        duration: 596 
        // No startTime or endTime, so should play full
    }],
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: '4',
    title: 'Learning to Bake Sourdough',
    date: '2023-04-10T09:00:00.000Z',
    description: 'My journey into the world of sourdough. Many failed attempts but finally got a good loaf!',
    category: 'Personal',
    imageUrl: 'https://placehold.co/600x400.png', // No media attachment for this one
    userId: '1',
  },
];

export const mockPrompts: Prompt[] = [
  {
    id: 'p1',
    text: 'What was a recent challenge you overcame?',
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p2',
    text: 'Describe a moment that made you laugh out loud.',
    isFlaggedForReuse: true,
    userId: '1',
  },
  {
    id: 'p3',
    text: 'Who is someone you are grateful for today and why?',
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p4',
    text: 'What new skill did you learn recently?',
    isFlaggedForReuse: true,
    userId: '1',
  },
];
