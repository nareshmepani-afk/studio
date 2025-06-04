
import type { Memory, Prompt, MemoryCategory } from '@/types';

export const mockMemories: Memory[] = [
  {
    id: '1',
    title: 'Trip to the Mountains',
    date: '2023-07-15T10:00:00.000Z',
    description: 'A wonderful weekend getaway with breathtaking views and challenging hikes.',
    category: 'Travel',
    imageUrl: 'https://placehold.co/600x400.png',
    userId: '1',
    media: [{ type: 'video', url: 'placeholder.mp4' }],
  },
  {
    id: '2',
    title: 'Family Reunion 2023',
    date: '2023-12-23T18:30:00.000Z',
    description: 'Gathered with the whole family for the holidays. So much food and laughter!',
    category: 'Family',
    imageUrl: 'https://placehold.co/600x400.png',
    userId: '1',
  },
  {
    id: '3',
    title: 'Project Alpha Launch',
    date: '2024-01-20T14:00:00.000Z',
    description: 'Successfully launched Project Alpha after months of hard work. Proud of the team!',
    category: 'Work',
    imageUrl: 'https://placehold.co/600x400.png',
    userId: '1',
    media: [{ type: 'audio', url: 'placeholder.mp3' }],
  },
  {
    id: '4',
    title: 'Learning to Bake Sourdough',
    date: '2023-04-10T09:00:00.000Z',
    description: 'My journey into the world of sourdough. Many failed attempts but finally got a good loaf!',
    category: 'Personal',
    imageUrl: 'https://placehold.co/600x400.png',
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
