
import type { Memory, Prompt, PromptGroup, MediaAttachment, EmotionTag } from '@/types';

const videoPlaceholderUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; // A real video for testing trim
const audioPlaceholderUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3"; // A real audio for testing

export const mockMemories: Memory[] = [
  {
    id: '1',
    title: 'Trip to the Mountains (Video)',
    date: '2023-07-15T10:00:00.000Z',
    description: 'A wonderful weekend getaway with breathtaking views and challenging hikes. This video is trimmed.',
    emotionTags: ['Happy', 'Excitement', 'Peace'],
    userId: '1',
    location: 'Swiss Alps',
    country: 'Switzerland',
    mediaAttachments: [{
        id: 'media1-1',
        type: 'video',
        url: videoPlaceholderUrl,
        filename: 'mountain_trip.mp4',
        startTime: 5, // Start at 5 seconds
        endTime: 15,   // End at 15 seconds
        duration: 596, // Actual duration of BigBuckBunny is ~596s
        size: 5 * 1024 * 1024, // Approx 5MB for the sample segment
    }],
    imageUrl: 'https://placehold.co/600x400.png', // Fallback or cover image
    isLegacy: true, // Marked for Legacy Chest
    promptId: 'p1', // Linked to "A Child of Two Worlds"
  },
  {
    id: '2',
    title: 'Family Reunion 2023 (Full Audio)',
    date: '2023-12-23T18:30:00.000Z',
    description: 'Gathered with the whole family for the holidays. So much food and laughter! This is a full audio.',
    emotionTags: ['Joy', 'Love', 'Nostalgia'],
    userId: '1',
    location: 'Grandma\'s House, Devon',
    country: 'UK',
    mediaAttachments: [{
        id: 'media2-1',
        type: 'audio',
        url: audioPlaceholderUrl,
        filename: 'family_reunion.mp3',
        duration: 2, // Actual duration of t-rex-roar is ~2s
        size: 45 * 1024, // Approx 45KB
    }],
    imageUrl: 'https://placehold.co/600x400.png',
    isLegacy: false,
    promptId: 'p2', // Linked to "The House I Grew Up In"
  },
  {
    id: '3',
    title: 'Project Alpha Launch (Untrimmed Video)',
    date: '2024-01-20T14:00:00.000Z',
    description: 'Successfully launched Project Alpha after months of hard work. Proud of the team! This video plays in full.',
    emotionTags: ['Gratitude', 'Excitement'],
    userId: '1',
    // No location/country for this one
    mediaAttachments: [{
        id: 'media3-1',
        type: 'video',
        url: videoPlaceholderUrl, // Using same video for variety
        filename: 'project_alpha.mp4',
        duration: 596,
        size: 5 * 1024 * 1024, // Approx 5MB for the sample segment
        // No startTime or endTime, so should play full
    }],
    imageUrl: 'https://placehold.co/600x400.png',
    isLegacy: true, // Also marked for Legacy Chest
  },
  {
    id: '4',
    title: 'Learning to Bake Sourdough',
    date: '2023-04-10T09:00:00.000Z',
    description: 'My journey into the world of sourdough. Many failed attempts but finally got a good loaf!',
    emotionTags: ['Reflective', 'Hope', 'Funny'],
    imageUrl: 'https://placehold.co/600x400.png', // No media attachment for this one
    userId: '1',
    location: 'Home Kitchen',
    country: 'UK',
    isLegacy: false,
  },
];

export const mockPromptGroups: PromptGroup[] = [
  {
    id: 'part-i',
    title: {
      en: 'Part I: Roots and Foundations',
      gu: 'ભાગ I: મૂળ અને પાયા',
    },
    prompts: [
      {
        id: 'p1',
        text: {
          en: 'A Child of Two Worlds – Your birthplace, family roots, cultural influences',
          gu: 'બે દુનિયાનું બાળક – તમારું જન્મસ્થળ, કુટુંબના મૂળ, સાંસ્કૃતિક પ્રભાવો',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p2',
        text: {
          en: 'The House I Grew Up In – Daily life, environment, first memories',
          gu: 'હું જે ઘરમાં મોટો થયો – દૈનિક જીવન, પર્યાવરણ, પ્રથમ યાદો',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p3',
        text: {
          en: 'Innocence and Curiosity – School days, early dreams, moments of wonder',
          gu: 'નિર્દોષતા અને જિજ્ઞાસા – શાળાના દિવસો, પ્રારંભિક સપના, આશ્ચર્યની ક્ષણો',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p4',
        text: {
          en: 'Echoes of a Brother, Sister or Friends – Memories and lessons from key people you have met',
          gu: 'ભાઈ, બહેન કે મિત્રોના પડઘા – તમે મળેલા મુખ્ય લોકો પાસેથી યાદો અને પાઠ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p5',
        text: {
          en: 'The Shape of Loss – First encounters with grief and challenges in youth',
          gu: 'નુકશાનનો આકાર – યુવાનીમાં દુઃખ અને પડકારો સાથે પ્રથમ મુલાકાત',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
    ],
  },
  {
    id: 'part-ii',
    title: {
      en: 'Part II: Coming of Age',
      gu: 'ભાગ II: યુવાનીમાં આગમન',
    },
    prompts: [
      {
        id: 'p6',
        text: {
          en: 'Crossroads and Choices – Adolescence, identity, early dilemmas',
          gu: 'ક્રોસરોડ્સ અને પસંદગીઓ – કિશોરાવસ્થા, ઓળખ, પ્રારંભિક દ્વિધાઓ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p7',
        text: {
          en: 'Learning the Hard Way – Mistakes, guidance, mentors, self-discovery',
          gu: 'કઠિન રીતે શીખવું – ભૂલો, માર્ગદર્શન, માર્ગદર્શકો, આત્મ-શોધ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p8',
        text: {
          en: 'Journeys Within and Without – Travel, education, and pivotal personal experiences',
          gu: 'અંદર અને બહારની મુસાફરી – પ્રવાસ, શિક્ષણ અને મુખ્ય વ્યક્તિગત અનુભવો',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p9',
        text: {
          en: 'A Person Becoming – Entering adulthood, facing reality, carving your place',
          gu: 'એક વ્યક્તિ બની રહી છે – પુખ્તાવસ્થામાં પ્રવેશ, વાસ્તવિકતાનો સામનો કરવો, તમારું સ્થાન બનાવવું',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
    ],
  },
  {
    id: 'part-iii',
    title: {
      en: 'Part III: Family, Faith, and Struggles',
      gu: 'ભાગ III: કુટુંબ, શ્રદ્ધા અને સંઘર્ષો',
    },
    prompts: [
      {
        id: 'p10',
        text: {
          en: 'Falling in Love with Life – Love, marriage, and parenthood',
          gu: 'જીવન સાથે પ્રેમમાં પડવું – પ્રેમ, લગ્ન અને વાલીપણું',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p11',
        text: {
          en: 'The Birth of Children – The arrival of your child and your transformation as a parent',
          gu: 'બાળકોનો જન્મ – તમારા બાળકનું આગમન અને માતાપિતા તરીકે તમારું પરિવર્તન',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p12',
        text: {
          en: 'Holding On, Letting Go – Life’s challenges: financial, emotional, and spiritual',
          gu: 'પકડી રાખવું, જવા દેવું – જીવનના પડકારો: નાણાકીય, ભાવનાત્મક અને આધ્યાત્મિક',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p13',
        text: {
          en: 'The Test of Fire – Moments of deep struggle and how you rose again',
          gu: 'અગ્નિપરીક્ષા – ઊંડા સંઘર્ષની ક્ષણો અને તમે ફરીથી કેવી રીતે ઉભા થયા',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p14',
        text: {
          en: 'Faith in the Invisible – Spiritual awakenings, beliefs, and guidance from within',
          gu: 'અદ્રશ્યમાં વિશ્વાસ – આધ્યાત્મિક જાગૃતિ, માન્યતાઓ અને અંદરથી માર્ગદર્શન',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
    ],
  },
  {
    id: 'part-iv',
    title: {
      en: 'Part IV: Legacy and Lessons',
      gu: 'ભાગ IV: વારસો અને પાઠ',
    },
    prompts: [
      {
        id: 'p15',
        text: {
          en: 'Wounds into Wisdom – Lessons learned from pain, regret, and healing',
          gu: 'ઘામાંથી શાણપણ – પીડા, પસ્તાવો અને ઉપચારમાંથી શીખેલા પાઠ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p16',
        text: {
          en: 'Letters to Those Who Are Watching – Life advice, reflections on others’ growth, and your pride',
          gu: 'જેઓ જોઈ રહ્યા છે તેમને પત્રો – જીવન સલાહ, અન્યોના વિકાસ પર પ્રતિબિંબ અને તમારો ગર્વ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p17',
        text: {
          en: 'Conversations with Myself – Philosophy, doubts, humour, and contradictions',
          gu: 'મારી સાથે વાતચીત – ફિલોસોફી, શંકાઓ, રમૂજ અને વિરોધાભાસ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p18',
        text: {
          en: 'The Person in the Mirror – Honest self-assessment: habits, joys, and regrets',
          gu: 'અરીસામાં વ્યક્તિ – પ્રમાણિક સ્વ-મૂલ્યાંકન: ટેવો, આનંદ અને પસ્તાવો',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p19',
        text: {
          en: 'The Quiet Victories – Small, unseen moments that shaped your soul',
          gu: 'શાંત વિજયો – નાની, અદ્રશ્ય ક્ષણો જેણે તમારા આત્માને આકાર આપ્યો',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
    ],
  },
  {
    id: 'part-v',
    title: {
      en: 'Part V: Looking Ahead',
      gu: 'ભાગ V: આગળ જોવું',
    },
    prompts: [
      {
        id: 'p20',
        text: {
          en: 'What Still Lies Ahead – Dreams yet to pursue, hopes for the next generation',
          gu: 'આગળ શું છે – હજુ સિદ્ધ કરવાના સપના, આગામી પેઢી માટે આશાઓ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p21',
        text: {
          en: 'If I Could Do It Again – Reflections on what you’d repeat or change',
          gu: 'જો હું ફરીથી કરી શકું – તમે શું પુનરાવર્તન કરશો અથવા બદલશો તેના પર પ્રતિબિંબ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p22',
        text: {
          en: 'My Final Experiment with Truth – Defining your truth, values, and spiritual clarity',
          gu: 'સત્ય સાથેનો મારો અંતિમ પ્રયોગ – તમારું સત્ય, મૂલ્યો અને આધ્યાત્મિક સ્પષ્ટતા વ્યાખ્યાયિત કરવી',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p23',
        text: {
          en: 'The Story Continues – A hopeful note on legacy, family, and the unknown',
          gu: 'વાર્તા ચાલુ રહે છે – વારસો, કુટુંબ અને અજ્ઞાત પર એક આશાસ્પદ નોંધ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'p24',
        text: {
          en: 'Time Travel, Reflections — Reminders to revisit and reflect on older entries',
          gu: 'સમય યાત્રા, પ્રતિબિંબ — જૂની એન્ટ્રીઓની ફરી મુલાકાત લેવા અને તેના પર પ્રતિબિંબિત કરવા માટેના રીમાઇન્ડર્સ',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
    ],
  },
  {
    id: 'family-stories',
    title: {
      en: 'Family Storytelling & Oral History',
      gu: 'કૌટુંબિક વાર્તાકથન અને મૌખિક ઇતિહાસ',
    },
    prompts: [
      {
        id: 'fs1',
        text: {
          en: 'Share a cherished memory of a grandparent or elder.',
          gu: 'દાદા-દાદી અથવા કોઈ વડીલની વહાલી યાદ શેર કરો.',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'fs2',
        text: {
          en: 'What is a family tradition that has been passed down through generations?',
          gu: 'એવી કઈ પારિવારિક પરંપરા છે જે પેઢીઓથી ચાલી આવી રહી છે?',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'fs3',
        text: {
          en: 'Describe a significant historical event that impacted your family.',
          gu: 'તમારા પરિવાર પર અસર કરનાર કોઈ મહત્વપૂર્ણ ઐતિહાસિક ઘટનાનું વર્ણન કરો.',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'fs4',
        text: {
          en: 'What values did your parents or guardians instill in you?',
          gu: 'તમારા માતાપિતા અથવા વાલીઓએ તમારામાં કયા મૂલ્યો રોપ્યા?',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
      {
        id: 'fs5',
        text: {
          en: 'Tell a story about an ancestor that you admire.',
          gu: 'તમે જે પૂર્વજની પ્રશંસા કરો છો તેમના વિશે એક વાર્તા કહો.',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
       {
        id: 'fs6',
        text: {
          en: 'Record a message for your children or grandchildren to hear in the future.',
          gu: 'તમારા બાળકો અથવા પૌત્ર-પૌત્રીઓ માટે ભવિષ્યમાં સાંભળવા માટે એક સંદેશ રેકોર્ડ કરો.',
        },
        isFlaggedForReuse: false,
        userId: '1',
      },
    ]
  }
];


// For MemoryForm inspiration prompts, we'll keep a flat list for easier random selection
// This is derived from the groups above.
export const mockPrompts: Prompt[] = mockPromptGroups.reduce((acc, group) => acc.concat(group.prompts), [] as Prompt[]);
