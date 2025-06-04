
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
  // Part I: Roots and Foundations
  {
    id: 'p1',
    text: {
      en: 'A Child of Two Worlds – Your birthplace, family roots, cultural influences',
      gu: 'ગુજરાતીમાં: A Child of Two Worlds – Your birthplace, family roots, cultural influences',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p2',
    text: {
      en: 'The House I Grew Up In – Daily life, environment, first memories',
      gu: 'ગુજરાતીમાં: The House I Grew Up In – Daily life, environment, first memories',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p3',
    text: {
      en: 'Innocence and Curiosity – School days, early dreams, moments of wonder',
      gu: 'ગુજરાતીમાં: Innocence and Curiosity – School days, early dreams, moments of wonder',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p4',
    text: {
      en: 'Echoes of a Brother, Sister or Friends – Memories and lessons from key people you have met',
      gu: 'ગુજરાતીમાં: Echoes of a Brother, Sister or Friends – Memories and lessons from key people you have met',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p5',
    text: {
      en: 'The Shape of Loss – First encounters with grief and challenges in youth',
      gu: 'ગુજરાતીમાં: The Shape of Loss – First encounters with grief and challenges in youth',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  // Part II: Coming of Age
  {
    id: 'p6',
    text: {
      en: 'Crossroads and Choices – Adolescence, identity, early dilemmas',
      gu: 'ગુજરાતીમાં: Crossroads and Choices – Adolescence, identity, early dilemmas',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p7',
    text: {
      en: 'Learning the Hard Way – Mistakes, guidance, mentors, self-discovery',
      gu: 'ગુજરાતીમાં: Learning the Hard Way – Mistakes, guidance, mentors, self-discovery',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p8',
    text: {
      en: 'Journeys Within and Without – Travel, education, and pivotal personal experiences',
      gu: 'ગુજરાતીમાં: Journeys Within and Without – Travel, education, and pivotal personal experiences',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p9',
    text: {
      en: 'A Person Becoming – Entering adulthood, facing reality, carving your place',
      gu: 'ગુજરાતીમાં: A Person Becoming – Entering adulthood, facing reality, carving your place',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  // Part III: Family, Faith, and Struggles
  {
    id: 'p10',
    text: {
      en: 'Falling in Love with Life – Love, marriage, and parenthood',
      gu: 'ગુજરાતીમાં: Falling in Love with Life – Love, marriage, and parenthood',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p11',
    text: {
      en: 'The Birth of Children – The arrival of your child and your transformation as a parent',
      gu: 'ગુજરાતીમાં: The Birth of Children – The arrival of your child and your transformation as a parent',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p12',
    text: {
      en: 'Holding On, Letting Go – Life’s challenges: financial, emotional, and spiritual',
      gu: 'ગુજરાતીમાં: Holding On, Letting Go – Life’s challenges: financial, emotional, and spiritual',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p13',
    text: {
      en: 'The Test of Fire – Moments of deep struggle and how you rose again',
      gu: 'ગુજરાતીમાં: The Test of Fire – Moments of deep struggle and how you rose again',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p14',
    text: {
      en: 'Faith in the Invisible – Spiritual awakenings, beliefs, and guidance from within',
      gu: 'ગુજરાતીમાં: Faith in the Invisible – Spiritual awakenings, beliefs, and guidance from within',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  // Part IV: Legacy and Lessons
  {
    id: 'p15',
    text: {
      en: 'Wounds into Wisdom – Lessons learned from pain, regret, and healing',
      gu: 'ગુજરાતીમાં: Wounds into Wisdom – Lessons learned from pain, regret, and healing',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p16',
    text: {
      en: 'Letters to Those Who Are Watching – Life advice, reflections on others’ growth, and your pride',
      gu: 'ગુજરાતીમાં: Letters to Those Who Are Watching – Life advice, reflections on others’ growth, and your pride',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p17',
    text: {
      en: 'Conversations with Myself – Philosophy, doubts, humour, and contradictions',
      gu: 'ગુજરાતીમાં: Conversations with Myself – Philosophy, doubts, humour, and contradictions',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p18',
    text: {
      en: 'The Person in the Mirror – Honest self-assessment: habits, joys, and regrets',
      gu: 'ગુજરાતીમાં: The Person in the Mirror – Honest self-assessment: habits, joys, and regrets',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p19',
    text: {
      en: 'The Quiet Victories – Small, unseen moments that shaped your soul',
      gu: 'ગુજરાતીમાં: The Quiet Victories – Small, unseen moments that shaped your soul',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  // Part V: Looking Ahead
  {
    id: 'p20',
    text: {
      en: 'What Still Lies Ahead – Dreams yet to pursue, hopes for the next generation',
      gu: 'ગુજરાતીમાં: What Still Lies Ahead – Dreams yet to pursue, hopes for the next generation',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p21',
    text: {
      en: 'If I Could Do It Again – Reflections on what you’d repeat or change',
      gu: 'ગુજરાતીમાં: If I Could Do It Again – Reflections on what you’d repeat or change',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p22',
    text: {
      en: 'My Final Experiment with Truth – Defining your truth, values, and spiritual clarity',
      gu: 'ગુજરાતીમાં: My Final Experiment with Truth – Defining your truth, values, and spiritual clarity',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p23',
    text: {
      en: 'The Story Continues – A hopeful note on legacy, family, and the unknown',
      gu: 'ગુજરાતીમાં: The Story Continues – A hopeful note on legacy, family, and the unknown',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
  {
    id: 'p24',
    text: {
      en: 'Time Travel, Reflections — Reminders to revisit and reflect on older entries',
      gu: 'ગુજરાતીમાં: Time Travel, Reflections — Reminders to revisit and reflect on older entries',
    },
    isFlaggedForReuse: false,
    userId: '1',
  },
];
