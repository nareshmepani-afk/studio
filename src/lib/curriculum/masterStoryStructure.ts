/**
 * 🏛️ Master Story Structure & Narrative Spine
 *
 * Core Platform Thesis: "Two Lenses, One Living Story"
 * Authoritative Grounding Matrix: C:\Users\home\studio\.agents\ROUTING_MATRIX.md
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English Orthography)
 *
 * Unifies the Mobile Fireside Studio (/studio/fireside) and the Desktop
 * Theatrical Soundstage (/studio) around a single deterministic narrative spine.
 */

export type SceneCaptureStatus =
  | 'locked'
  | 'ready_for_action'
  | 'captured'
  | 'mastered';

export type SuggestedMediaMode = 'audio' | 'video';

export interface MasterStoryScene {
  id: string; // e.g. "part-1-scene-1", "part-1-scene-2"
  partNumber: number;
  partTitle: string;
  sceneNumber: number;
  title: string;
  subtitle: string;
  promptId: string;
  suggestedMediaMode: SuggestedMediaMode;
  defaultStatus: SceneCaptureStatus;
  keySensoryQuestions: {
    en: string[];
    gu: string[];
    pa: string[];
    hi: string[];
  };
}

export interface MasterStoryPart {
  partNumber: number;
  title: string;
  subtitle: string;
  description: string;
  scenes: MasterStoryScene[];
}

/**
 * 6-Part Narrative Curriculum Spine + Family Storytelling
 * The immutable structure shared across mobile and desktop.
 */
export const MASTER_STORY_STRUCTURE: MasterStoryPart[] = [
  {
    partNumber: 1,
    title: 'Part I: Roots and Foundations',
    subtitle: 'Where the River Began',
    description: 'Ancestral roots, birthplace memories, and the sensory landscape of early childhood.',
    scenes: [
      {
        id: 'part-1-scene-1',
        partNumber: 1,
        partTitle: 'Part I: Roots and Foundations',
        sceneNumber: 1,
        title: 'Child of Two Worlds',
        subtitle: 'Birthplace, family roots, and the soil that nurtured you',
        promptId: 'p1',
        suggestedMediaMode: 'video',
        defaultStatus: 'ready_for_action',
        keySensoryQuestions: {
          en: [
            'What were the sounds and aromas of morning in your birthplace?',
            'Which ancestral stories or proverbs were repeated most frequently in your home?',
          ],
          gu: [
            'તમારા જન્મસ્થળમાં સવારના અવાજો અને સુગંધ કેવી હતી?',
            'તમારા ઘરમાં કઈ વાર્તાઓ વારંવાર કહેવામાં આવતી હતી?',
          ],
          pa: [
            'ਤੁਹਾਡੇ ਜਨਮ ਸਥਾਨ ਦੀਆਂ ਸਵੇਰ ਦੀਆਂ ਆਵਾਜ਼ਾਂ ਅਤੇ ਖੁਸ਼ਬੂਆਂ ਕਿਹੋ ਜਿਹੀਆਂ ਸਨ?',
            'ਤੁਹਾਡੇ ਘਰ ਵਿੱਚ ਕਿਹੜੀਆਂ ਕਹਾਣੀਆਂ ਸਭ ਤੋਂ ਵੱਧ ਦੱਸੀਆਂ ਜਾਂਦੀਆਂ ਸਨ?',
          ],
          hi: [
            'आपके जन्मस्थान में सुबह की आवाज़ें और खुशबू कैसी थीं?',
            'आपके घर में कौन सी कहानियाँ बार-बार सुनाई जाती थीं?',
          ],
        },
      },
      {
        id: 'part-1-scene-2',
        partNumber: 1,
        partTitle: 'Part I: Roots and Foundations',
        sceneNumber: 2,
        title: 'The House I Grew Up In',
        subtitle: 'The walls, rooms, courtyard, and daily rhythms of the family home',
        promptId: 'p2',
        suggestedMediaMode: 'audio',
        defaultStatus: 'ready_for_action',
        keySensoryQuestions: {
          en: [
            'When you close your eyes, which room in that house do you see first?',
            'What was the sound of evening dinnertime inside those walls?',
          ],
          gu: [
            'જ્યારે તમે આંખો બંધ કરો છો, ત્યારે તે ઘરમાં સૌથી પહેલો કયો ઓરડો દેખાય છે?',
            'સાંજે ભોજન સમયે તે ઘરનો વાતાવરણ કેવો હતો?',
          ],
          pa: [
            'ਜਦੋਂ ਤੁਸੀਂ ਅੱਖਾਂ ਬੰਦ ਕਰਦੇ ਹੋ, ਉਸ ਘਰ ਦਾ ਕਿਹੜਾ ਕਮਰਾ ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਦਿਖਾਈ ਦਿੰਦਾ ਹੈ?',
            'ਸ਼ਾਮ ਦੇ ਖਾਣੇ ਵੇਲੇ ਘਰ ਦਾ ਮਾਹੌਲ ਕਿਹੋ ਜਿਹਾ ਹੁੰਦਾ ਸੀ?',
          ],
          hi: [
            'जब आप आँखें बंद करते हैं, तो उस घर का कौन सा कमरा सबसे पहले दिखाई देता है?',
            'शाम के भोजन के समय उस घर का माहौल कैसा था?',
          ],
        },
      },
      {
        id: 'part-1-scene-3',
        partNumber: 1,
        partTitle: 'Part I: Roots and Foundations',
        sceneNumber: 3,
        title: 'School Days & Early Wonder',
        subtitle: 'Innocence, childhood friendships, and the first spark of curiosity',
        promptId: 'p3',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: [
            'Who was the first teacher or mentor who made you feel seen?',
            'What childhood adventure filled you with awe?',
          ],
          gu: ['તમને સૌથી પ્રેરણાદાયી લાગતા શિક્ષક કોણ હતા?'],
          pa: ['ਕਿਹੜੇ ਅਧਿਆਪਕ ਨੇ ਤੁਹਾਡੇ ਉੱਤੇ ਸਭ ਤੋਂ ਵੱਧ ਪ੍ਰਭਾਵ ਪਾਇਆ?'],
          hi: ['किस शिक्षक ने आपके जीवन पर सबसे गहरा प्रभाव डाला?'],
        },
      },
    ],
  },
  {
    partNumber: 2,
    title: 'Part II: Formative Years & Early Echoes',
    subtitle: 'Mentors, Friendships & The First Hardships',
    description: 'Kinship, significant early bonds, and the first encounters with life’s vulnerability.',
    scenes: [
      {
        id: 'part-2-scene-1',
        partNumber: 2,
        partTitle: 'Part II: Formative Years & Early Echoes',
        sceneNumber: 1,
        title: 'Early Mentors & Kinship',
        subtitle: 'The elders and companions who guided your early steps',
        promptId: 'p4_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was the best piece of advice an elder gave you in your youth?'],
          gu: ['તમારા યુવાનીમાં કોઈ વડીલે આપેલી શ્રેષ્ઠ સલાહ કઈ હતી?'],
          pa: ['ਤੁਹਾਡੀ ਜਵਾਨੀ ਵਿੱਚ ਕਿਸੇ ਬਜ਼ੁਰਗ ਵੱਲੋਂ ਦਿੱਤੀ ਗਈ ਸਭ ਤੋਂ ਵਧੀਆ ਸਲਾਹ ਕੀ ਸੀ?'],
          hi: ['आपकी युवावस्था में किसी बुजुर्ग द्वारा दी गई सबसे अच्छी सलाह क्या थी?'],
        },
      },
      {
        id: 'part-2-scene-2',
        partNumber: 2,
        partTitle: 'Part II: Formative Years & Early Echoes',
        sceneNumber: 2,
        title: 'The First Hardships & The Shape of Loss',
        subtitle: 'Early grief, disappointment, and the discovery of inner resilience',
        promptId: 'p5_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['How did you navigate your very first encounter with grief or difficulty?'],
          gu: ['તમે તમારા જીવનના પ્રથમ મોટા પડકારનો સામનો કેવી રીતે કર્યો?'],
          pa: ['ਤੁਸੀਂ ਆਪਣੀ ਜ਼ਿੰਦਗੀ ਦੀ ਪਹਿਲੀ ਵੱਡੀ ਚੁਣੌਤੀ ਦਾ ਸਾਹਮਣਾ ਕਿਵੇਂ ਕੀਤਾ?'],
          hi: ['आपने अपने जीवन की पहली बड़ी चुनौती का सामना कैसे किया?'],
        },
      },
    ],
  },
  {
    partNumber: 3,
    title: 'Part III: Crossroads, Choices & Becoming',
    subtitle: 'Stepping Into the World',
    description: 'Independence, hard-learned lessons, and pivotal life crossroads.',
    scenes: [
      {
        id: 'part-3-scene-1',
        partNumber: 3,
        partTitle: 'Part III: Crossroads, Choices & Becoming',
        sceneNumber: 1,
        title: 'Crossroads of Youth',
        subtitle: 'Pivotal choices that shaped the trajectory of your adult life',
        promptId: 'p6_1',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was a fork in the road where taking the unfamiliar path changed everything?'],
          gu: ['તમારા જીવનનો કયો નિર્ણય સૌથી મહત્વપૂર્ણ સાબિત થયો?'],
          pa: ['ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਦਾ ਕਿਹੜਾ ਫੈਸਲਾ ਸਭ ਤੋਂ ਅਹਿਮ ਸਾਬਤ ਹੋਇਆ?'],
          hi: ['आपके जीवन का कौन सा फैसला सबसे महत्वपूर्ण साबित हुआ?'],
        },
      },
      {
        id: 'part-3-scene-2',
        partNumber: 3,
        partTitle: 'Part III: Crossroads, Choices & Becoming',
        sceneNumber: 2,
        title: 'Lessons Learned the Hard Way',
        subtitle: 'Missteps that forged character, humility, and deeper understanding',
        promptId: 'p7_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was a setback that felt painful then but proved to be a gift later?'],
          gu: ['કઈ ભૂલે તમને જીવનનો સૌથી મોટો પાઠ શીખવ્યો?'],
          pa: ['ਕਿਹੜੀ ਗਲਤੀ ਨੇ ਤੁਹਾਨੂੰ ਜ਼ਿੰਦਗੀ ਦਾ ਸਭ ਤੋਂ ਵੱਡਾ ਸਬਕ ਸਿਖਾਇਆ?'],
          hi: ['किस गलती ने आपको जीवन का सबसे बड़ा सबक सिखाया?'],
        },
      },
    ],
  },
  {
    partNumber: 4,
    title: 'Part IV: Journeys, Love & Milestones',
    subtitle: 'Companionship, Family & Lifelong Bonds',
    description: 'Partnership, marriage, the arrival of children, and building a home of one’s own.',
    scenes: [
      {
        id: 'part-4-scene-1',
        partNumber: 4,
        partTitle: 'Part IV: Journeys, Love & Milestones',
        sceneNumber: 1,
        title: 'Love, Partnership & Companionship',
        subtitle: 'How you met your life partner and the early years of building together',
        promptId: 'p10_1',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was the moment you realised this was the person you wanted to build a life with?'],
          gu: ['તમે તમારા જીવનસાથી સાથે જીવન વિતાવવાનો નિર્ણય ક્યારે લીધો?'],
          pa: ['ਤੁਸੀਂ ਆਪਣੇ ਜੀਵਨ ਸਾਥੀ ਨਾਲ ਜ਼ਿੰਦਗੀ ਬਿਤਾਉਣ ਦਾ ਫੈਸਲਾ ਕਦੋਂ ਕੀਤਾ?'],
          hi: ['आपने अपने जीवनसाथी के साथ जीवन बिताने का फैसला कब किया?'],
        },
      },
      {
        id: 'part-4-scene-2',
        partNumber: 4,
        partTitle: 'Part IV: Journeys, Love & Milestones',
        sceneNumber: 2,
        title: 'The Arrival of Children',
        subtitle: 'The overwhelming transformation of stepping into the role of parent',
        promptId: 'p11_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What did you feel holding your firstborn child for the very first time?'],
          gu: ['તમારા પ્રથમ બાળકને પહેલીવાર ખોળામાં લીધું ત્યારે કેવો અનુભવ થયો હતો?'],
          pa: ['ਆਪਣੇ ਪਹਿਲੇ ਬੱਚੇ ਨੂੰ ਪਹਿਲੀ ਵਾਰ ਗੋਦੀ ਵਿੱਚ ਲੈਂਦੇ ਹੋਏ ਕੀ ਮਹਿਸੂਸ ਹੋਇਆ ਸੀ?'],
          hi: ['अपने पहले बच्चे को पहली बार गोद में लेते समय क्या महसूस हुआ था?'],
        },
      },
    ],
  },
  {
    partNumber: 5,
    title: 'Part V: Wisdom, Hard-Won Truths & Values',
    subtitle: 'The Principles That Endure',
    description: 'Spiritual roots, core moral compass, and ancestral values.',
    scenes: [
      {
        id: 'part-5-scene-1',
        partNumber: 5,
        partTitle: 'Part V: Wisdom, Hard-Won Truths & Values',
        sceneNumber: 1,
        title: 'Guiding Beliefs & Core Values',
        subtitle: 'The convictions that guided your choices through life’s storms',
        promptId: 'p12_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What single principle has never failed you in moments of uncertainty?'],
          gu: ['કયો સિદ્ધાંત તમને હંમેશા સાચો માર્ગ બતાવતો રહ્યો છે?'],
          pa: ['ਕਿਹੜੇ ਅਸੂਲ ਨੇ ਤੁਹਾਨੂੰ ਹਮੇਸ਼ਾ ਸਹੀ ਰਸਤਾ ਦਿਖਾਇਆ ਹੈ?'],
          hi: ['किस सिद्धांत ने आपको हमेशा सही रास्ता दिखाया है?'],
        },
      },
    ],
  },
  {
    partNumber: 6,
    title: 'Part VI: The Continuing Story & Heirloom Legacy',
    subtitle: 'Words for Tomorrow',
    description: 'A blessings blessing, hopes for the great-grandchildren, and words to live by.',
    scenes: [
      {
        id: 'part-6-scene-1',
        partNumber: 6,
        partTitle: 'Part VI: The Continuing Story & Heirloom Legacy',
        sceneNumber: 1,
        title: 'Words to Remember Me By',
        subtitle: 'An enduring message of love and blessing for the generations yet to come',
        promptId: 'p13_1',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What do you want your great-grandchildren to know about the way you loved?'],
          gu: ['તમે તમારી ભવિષ્યની પેઢીઓને પ્રેમ અને જીવન વિશે શું સંદેશ આપવા માંગો છો?'],
          pa: ['ਤੁਸੀਂ ਆਪਣੀਆਂ ਆਉਣ ਵਾਲੀਆਂ ਪੀੜ੍ਹੀਆਂ ਨੂੰ ਕੀ ਸੰਦੇਸ਼ ਦੇਣਾ ਚਾਹੁੰਦੇ ਹੋ?'],
          hi: ['आप अपनी आने वाली पीढ़ियों को प्यार और जीवन के बारे में क्या संदेश देना चाहते हैं?'],
        },
      },
    ],
  },
];

/**
 * Helper to resolve a scene by ID
 */
export function getSceneById(sceneId: string): MasterStoryScene | undefined {
  for (const part of MASTER_STORY_STRUCTURE) {
    const matched = part.scenes.find((s) => s.id === sceneId);
    if (matched) return matched;
  }
  return undefined;
}

/**
 * Resolves a canonical MasterStoryScene from a Desktop promptId (e.g. "p1") or sceneId
 */
export function resolveSceneFromPromptId(promptId: string): MasterStoryScene | undefined {
  if (!promptId) return undefined;
  for (const part of MASTER_STORY_STRUCTURE) {
    const matched = part.scenes.find((s) => s.promptId === promptId || s.id === promptId);
    if (matched) return matched;
  }
  return undefined;
}

/**
 * Resolves the Desktop promptId (e.g. "p1") from a Fireside sceneId (e.g. "part-1-scene-1")
 */
export function resolvePromptIdFromSceneId(sceneId: string): string | undefined {
  if (!sceneId) return undefined;
  const scene = getSceneById(sceneId);
  return scene?.promptId;
}

/**
 * Maps Desktop productionStage (0..3) to Fireside actsCompleted array
 */
export function mapProductionStageToActsCompleted(stage: number): string[] {
  if (stage >= 3) return ['act1', 'act2', 'act3', 'act4'];
  if (stage === 2) return ['act1', 'act2', 'act3'];
  if (stage === 1) return ['act1', 'act2'];
  if (stage === 0) return ['act1'];
  return [];
}

/**
 * Maps Fireside actsCompleted array to Desktop productionStage (0..3)
 */
export function mapActsCompletedToProductionStage(acts: string[]): number {
  if (!Array.isArray(acts) || acts.length === 0) return 0;
  if (acts.includes('act4')) return 3;
  if (acts.includes('act3')) return 2;
  if (acts.includes('act2')) return 2;
  if (acts.includes('act1')) return 1;
  return 0;
}

/**
 * Computes next sequential scene ID for auto-advancing mobile carousel
 */
export function getNextSceneId(currentSceneId: string): string | null {
  const allScenes = MASTER_STORY_STRUCTURE.flatMap((p) => p.scenes);
  const currentIndex = allScenes.findIndex((s) => s.id === currentSceneId);
  if (currentIndex >= 0 && currentIndex < allScenes.length - 1) {
    return allScenes[currentIndex + 1].id;
  }
  return null;
}

