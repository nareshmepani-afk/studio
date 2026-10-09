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
  localizedTitles?: {
    en: string;
    gu: string;
    pa: string;
    hi: string;
  };
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
  id: string; // e.g. "part-i", "part-ii"
  partNumber: number;
  title: string;
  localizedTitles: {
    en: string;
    gu: string;
    pa: string;
    hi: string;
  };
  subtitle: string;
  description: string;
  scenes: MasterStoryScene[];
  isAnthology?: boolean;
  isDemo?: boolean;
}

/**
 * 6-Part Narrative Curriculum Spine + Family Storytelling
 * The immutable structure shared across mobile and desktop.
 */
export const MASTER_STORY_STRUCTURE: MasterStoryPart[] = [
  {
    id: 'part-i',
    partNumber: 1,
    title: 'Part I: Roots and Foundations',
    localizedTitles: {
      en: 'Part I: Roots and Foundations',
      gu: 'ભાગ I: મૂળ અને પાયા',
      pa: 'ਭਾਗ I: ਜੜ੍ਹਾਂ ਅਤੇ ਬੁਨਿਆਦ',
      hi: 'भाग I: जड़ें और नींव',
    },
    subtitle: 'Where the River Began',
    description: 'Ancestral roots, birthplace memories, and the sensory landscape of early childhood.',
    scenes: [
      {
        id: 'part-1-scene-1',
        partNumber: 1,
        partTitle: 'Part I: Roots and Foundations',
        sceneNumber: 1,
        title: 'A Child of Two Worlds',
        localizedTitles: {
          en: 'A Child of Two Worlds',
          gu: 'બે દુનિયાનું બાળક',
          pa: 'ਦੋ ਦੁਨੀਆ ਦਾ ਬੱਚਾ',
          hi: 'दो दुनिया का बच्चा',
        },
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
        localizedTitles: {
          en: 'The House I Grew Up In',
          gu: 'હું જે ઘરમાં મોટો થયો',
          pa: 'ਉਹ ਘਰ ਜਿੱਥੇ ਮੈਂ ਵੱਡਾ ਹੋਇਆ',
          hi: 'वह घर जहाँ मैं बड़ा हुआ',
        },
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
        localizedTitles: {
          en: 'Innocence and Curiosity',
          gu: 'નિર્દોષતા અને જિજ્ઞાસા',
          pa: 'ਮਾਸੂਮੀਅਤ ਅਤੇ ਉਤਸੁਕਤਾ',
          hi: 'मासूमियत और जिज्ञासा',
        },
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
      {
        id: 'part-1-scene-4',
        partNumber: 1,
        partTitle: 'Part I: Roots and Foundations',
        sceneNumber: 4,
        title: 'Traditions, Feasts & Sacred Days',
        localizedTitles: {
          en: 'Traditions, Feasts & Sacred Days',
          gu: 'પરંપરાઓ, તહેવારો અને પવિત્ર દિવસો',
          pa: 'ਰੀਤਾਂ, ਤਿਉਹਾਰ ਅਤੇ ਪਵਿੱਤਰ ਦਿਨ',
          hi: 'परंपराएं, त्योहार और पावन दिन',
        },
        subtitle: 'The great festivals, family gatherings, blessings, and customs that bound you together',
        promptId: 'p3_b',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: [
            'Which festival or family gathering did you anticipate most excitedly as a child?',
            'What sacred blessings or customs did the family elders bestow?',
          ],
          gu: ['બાળપણમાં તમને કયા તહેવારની સૌથી વધુ આતુરતાથી રાહ રહેતી?'],
          pa: ['ਬਚਪਨ ਵਿੱਚ ਤੁਸੀਂ ਕਿਸ ਤਿਉਹਾਰ ਦਾ ਸਭ ਤੋਂ ਵੱਧ ਚਾਅ ਨਾਲ ਇੰਤਜ਼ਾਰ ਕਰਦੇ ਸੀ?'],
          hi: ['बचपन में आपको किस त्योहार का सबसे ज्यादा बेसब्री से इंतजार रहता था?'],
        },
      },
    ],
  },
  {
    id: 'part-ii',
    partNumber: 2,
    title: 'Part II: Formative Years & Early Echoes',
    localizedTitles: {
      en: 'Part II: Crossroads and Identity',
      gu: 'ભાગ II: આંતરછેદ અને ઓળખ',
      pa: 'ਭਾਗ II: ਚੌਰਾਹੇ ਅਤੇ ਪਛਾਣ',
      hi: 'भाग II: मोड़ और पहचान',
    },
    subtitle: 'Mentors, Friendships & The First Hardships',
    description: 'Kinship, significant early bonds, and the first encounters with life’s vulnerability.',
    scenes: [
      {
        id: 'part-2-scene-1',
        partNumber: 2,
        partTitle: 'Part II: Formative Years & Early Echoes',
        sceneNumber: 1,
        title: 'Early Mentors & Kinship',
        localizedTitles: {
          en: 'Formative Friendships',
          gu: 'રચનાત્મક મિત્રતા',
          pa: 'ਬਚਪਨ ਦੀ ਦੋਸਤੀ',
          hi: 'बचपन की दोस्ती',
        },
        subtitle: 'The elders and companions who guided your early steps',
        promptId: 'p4',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was the best piece of advice an elder gave you in your youth?'],
          gu: ['તમારા યુવાનીમાં કોઈ વડીલે આપેલી શ્રેષ્ઠ સલાહ કઈ હતી?'],
          pa: ['ਤੁਹਾਡੀ ਜਵਾਨੀ ਵਿੱਚ ਕਿਸੇ બਜ਼ੁਰਗ ਵੱਲੋਂ ਦਿੱਤੀ ਗਈ સભ તોં વਧੀઆ સલાહ કી સી?'],
          hi: ['आपकी युवावस्था में किसी बुजुर्ग द्वारा दी गई सबसे अच्छी सलाह क्या थी?'],
        },
      },
      {
        id: 'part-2-scene-2',
        partNumber: 2,
        partTitle: 'Part II: Formative Years & Early Echoes',
        sceneNumber: 2,
        title: 'The First Hardships & The Shape of Loss',
        localizedTitles: {
          en: 'First Encounters with Hardship',
          gu: 'મુશ્કેલી સાથે પ્રથમ મુલાકાત',
          pa: 'ਮੁਸ਼ਕਿਲਾਂ ਨਾਲ ਪਹਿਲਾ ਸਾਹਮਣਾ',
          hi: 'मुश्किलों से पहला सामना',
        },
        subtitle: 'Early grief, disappointment, and the discovery of inner resilience',
        promptId: 'p5',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['How did you navigate your very first encounter with grief or difficulty?'],
          gu: ['તમે તમારા જીવનના પ્રથમ મોટા પડકારનો સામનો કેવી રીતે કર્યો?'],
          pa: ['ਤੁਸੀਂ ਆਪਣੀ ਜ਼ਿੰਦਗੀ ਦੀ ਪਹਿਲੀ ਵੱਡੀ ਚੁਣੌਤੀ ਦਾ ਸਾਹਮਣਾ ਕਿਵੇਂ ਕੀਤਾ?'],
          hi: ['आपने अपने जीवन की पहली बड़ी चुनौती का सामना कैसे किया?'],
        },
      },
      {
        id: 'part-2-scene-3',
        partNumber: 2,
        partTitle: 'Part II: Formative Years & Early Echoes',
        sceneNumber: 3,
        title: 'Crossroads of Youth',
        localizedTitles: {
          en: 'Crossroads and Choices',
          gu: 'આંતરછેદ અને પસંદગીઓ',
          pa: 'ਚੌਰਾਹੇ ਅਤੇ ਫੈસਲੇ',
          hi: 'मोड़ और फैसले',
        },
        subtitle: 'Pivotal choices that shaped the trajectory of your adult life',
        promptId: 'p6',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was a fork in the road where taking the unfamiliar path changed everything?'],
          gu: ['તમારા જીવનનો કયો નિર્ણય સૌથી મહત્વપૂર્ણ સાબિત થયો?'],
          pa: ['ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਦਾ ਕਿਹੜਾ ਫੈਸਲਾ ਸਭ ਤੋਂ ਅਹਿਮ સાબિત થયો?'],
          hi: ['आपके जीवन का कौन सा फैसला सबसे महत्वपूर्ण साबित हुआ?'],
        },
      },
      {
        id: 'part-2-scene-4',
        partNumber: 2,
        partTitle: 'Part II: Formative Years & Early Echoes',
        sceneNumber: 4,
        title: 'Lessons Learned the Hard Way',
        localizedTitles: {
          en: 'Learning the Hard Way',
          gu: 'અઘરી રીતે શીખવું',
          pa: 'ਮੁਸ਼ਕਿਲ ਰਾਹਾਂ ਤੋਂ ਸਿੱਖਿਆ',
          hi: 'कठिन राहों से सीख',
        },
        subtitle: 'Missteps that forged character, humility, and deeper understanding',
        promptId: 'p7',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was a setback that felt painful then but proved to be a gift later?'],
          gu: ['કઈ ભૂલે તમને જીવનનો સૌથી મોટો પાઠ શીખવ્યો?'],
          pa: ['ਕਿਹੜી ਗਲਤੀ ਨੇ ਤੁਹਾਨੂੰ ਜ਼ਿੰਦਗੀ ਦਾ સભ તોં વડ્ડા સબક શીખવ્યો?'],
          hi: ['किस गलती ने आपको जीवन का सबसे बड़ा सबक सिखाया?'],
        },
      },
    ],
  },
  {
    id: 'part-iii',
    partNumber: 3,
    title: 'Part III: Love, Partnership & Commitment',
    localizedTitles: {
      en: 'Part III: Love and Commitment',
      gu: 'ભાગ III: પ્રેમ અને પ્રતિબદ્ધતા',
      pa: 'ਭਾਗ III: ਪਿਆਰ ਅਤੇ ਵਚਨਬੱਧਤਾ',
      hi: 'भाग III: प्रेम और प्रतिबद्धता',
    },
    subtitle: 'Stepping Into the World & Building Together',
    description: 'Independence, partnership, marriage, and creating a home of one’s own.',
    scenes: [
      {
        id: 'part-3-scene-1',
        partNumber: 3,
        partTitle: 'Part III: Love, Partnership & Commitment',
        sceneNumber: 1,
        title: 'Journeys Within and Without',
        localizedTitles: {
          en: 'Journeys Within and Without',
          gu: 'અંદર અને બહારની મુસાફરી',
          pa: 'ਅੰਦਰੂਨੀ ਅਤੇ ਬਾਹਰੀ ਯਾਤਰਾਵਾਂ',
          hi: 'भीतरी और बाहरी यात्राएं',
        },
        subtitle: 'Significant travels, educational experiences, and broadening horizons',
        promptId: 'p8',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What journey or educational transition first broadened your worldview?'],
          gu: ['કઈ મુસાફરી કે અભ્યાસે તમારા જીવનનો દ્રષ્ટિકોણ બદલી નાખ્યો?'],
          pa: ['ਕਿਹੜੀ ਯਾਤਰਾ ਨੇ ਤੁਹਾਡੇ ਸੋਚਣ ਦਾ ਤਰੀਕਾ ਬਦਲਿਆ?'],
          hi: ['किस यात्रा या शिक्षा ने आपकी सोच का दायरा बढ़ाया?'],
        },
      },
      {
        id: 'part-3-scene-2',
        partNumber: 3,
        partTitle: 'Part III: Love, Partnership & Commitment',
        sceneNumber: 2,
        title: 'Facing Reality',
        localizedTitles: {
          en: 'Facing Reality',
          gu: 'વાસ્તવિકતાનો સામનો કરવો',
          pa: 'ਅਸਲੀਅਤ ਦਾ ਸਾਹਮਣਾ',
          hi: 'हकीकत का सामना',
        },
        subtitle: 'The transition to full adulthood, early wages, and personal independence',
        promptId: 'p9',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was the moment you first felt truly responsible for your own destiny?'],
          gu: ['તમને ક્યારે લાગ્યું કે હવે તમે સંપૂર્ણપણે સ્વનિર્ભર છો?'],
          pa: ['ਤੁਹਾਨੂੰ ਕਦੋਂ ਅਹਿਸਾਸ ਹੋਇਆ ਕਿ ਤੁਸੀਂ ਆਤਮ-ਨਿਰਭਰ ਹੋ ਗਏ ਹੋ?'],
          hi: ['आपको कब लगा कि अब आप पूरी तरह अपने पैरों पर खड़े हैं?'],
        },
      },
      {
        id: 'part-3-scene-3',
        partNumber: 3,
        partTitle: 'Part III: Love, Partnership & Commitment',
        sceneNumber: 3,
        title: 'Love, Partnership & Companionship',
        localizedTitles: {
          en: 'Falling in Love',
          gu: 'પ્રેમમાં પડવું',
          pa: 'ਪਿਆਰ ਵਿੱਚ ਪੈਣਾ',
          hi: 'प्यार में पड़ना',
        },
        subtitle: 'How you met your life partner and the early years of building together',
        promptId: 'p10',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was the moment you realised this was the person you wanted to build a life with?'],
          gu: ['તમે તમારા જીવનસાથી સાથે જીવન વિતાવવાનો નિર્ણય ક્યારે લીધો?'],
          pa: ['ਤੁਸੀਂ ਆਪਣੇ ਜੀਵન ਸਾਥੀ ਨਾਲ ਜ਼ਿੰਦਗੀ ਬਿਤਾਉਣ ਦਾ ਫੈਸਲਾ ਕਦੋਂ ਕੀਤਾ?'],
          hi: ['आपने अपने जीवनसाथी के साथ जीवन बिताने का फैसला कब किया?'],
        },
      },
      {
        id: 'part-3-scene-4',
        partNumber: 3,
        partTitle: 'Part III: Love, Partnership & Commitment',
        sceneNumber: 4,
        title: 'The Arrival of Children',
        localizedTitles: {
          en: 'The Birth of Children',
          gu: 'બાળકોનો જન્મ',
          pa: 'ਬੱਚਿਆਂ ਦਾ ਜਨਮ',
          hi: 'बच्चों का जन्म',
        },
        subtitle: 'The overwhelming transformation of stepping into the role of parent',
        promptId: 'p11',
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
    id: 'part-iv',
    partNumber: 4,
    title: 'Part IV: Trials, Triumphs & Milestones',
    localizedTitles: {
      en: 'Part IV: Trials and Resilience',
      gu: 'ભાગ IV: પરીક્ષણો અને સ્થિતિસ્થાપકતા',
      pa: 'ਭਾਗ IV: ਇਮਤਿਹਾਨ ਅਤੇ ਹੌਸਲਾ',
      hi: 'भाग IV: परीक्षाएं और धैर्य',
    },
    subtitle: 'Holding On, Letting Go & Rising Again',
    description: 'Trials, financial storms, spiritual fortitude, and transforming painful wounds into enduring wisdom.',
    scenes: [
      {
        id: 'part-4-scene-1',
        partNumber: 4,
        partTitle: 'Part IV: Trials, Triumphs & Milestones',
        sceneNumber: 1,
        title: 'Holding On and Letting Go',
        localizedTitles: {
          en: 'Holding On and Letting Go',
          gu: 'પકડી રાખવું અને છોડી દેવું',
          pa: 'ਸੰਭਾਲਣਾ ਅਤੇ ਛੱਡਣਾ',
          hi: 'थामे रखना और जाने देना',
        },
        subtitle: 'Navigating financial, emotional, or family storms with quiet resolve',
        promptId: 'p12',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was a storm where you had to choose between holding on and letting go?'],
          gu: ['કયા મુશ્કેલ સમયે તમારે પકડી રાખવું કે છોડી દેવું તેનો નિર્ણય કરવો પડ્યો?'],
          pa: ['ਕਿਹੜੇ ਔਖੇ ਮੋੜ \'ਤੇ ਤੁਹਾਨੂੰ ਸੰਭਾਲਣ ਜਾਂ ਛੱਡਣ ਦਾ ਫੈਸਲਾ ਕਰਨਾ ਪਿਆ?'],
          hi: ['किस कठिन मोड़ पर आपको थामे रखने या जाने देने का फैसला करना पड़ा?'],
        },
      },
      {
        id: 'part-4-scene-2',
        partNumber: 4,
        partTitle: 'Part IV: Trials, Triumphs & Milestones',
        sceneNumber: 2,
        title: 'The Test of Fire',
        localizedTitles: {
          en: 'The Test of Fire',
          gu: 'અગ્નિ પરીક્ષા',
          pa: 'ਅੱਗ ਦੀ ਪ੍ਰੀਖਿਆ',
          hi: 'अग्नि परीक्षा',
        },
        subtitle: 'Moments that pushed you to your absolute limits and tested your faith',
        promptId: 'p13',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What season pushed you to the brink of your endurance, and what carried you through?'],
          gu: ['કયા સંઘર્ષે તમારી ધીરજની ખરી કસોટી લીધી અને તમને બહાર કાઢ્યા?'],
          pa: ['ਕਿਸ ਸੰਘਰਸ਼ ਨੇ ਤੁਹਾਡੇ ਸਬਰ ਨੂੰ ਪਰਖਿਆ ਅਤੇ ਤੁਹਾਨੂੰ ਪਾਰ ਲੰਘਾਇਆ?'],
          hi: ['किस संघर्ष ने आपके धैर्य की सच्ची परीक्षा ली और आपको संभाला?'],
        },
      },
      {
        id: 'part-4-scene-3',
        partNumber: 4,
        partTitle: 'Part IV: Trials, Triumphs & Milestones',
        sceneNumber: 3,
        title: 'Faith in the Invisible',
        localizedTitles: {
          en: 'Faith in the Invisible',
          gu: 'અદ્રશ્યમાં વિશ્વાસ',
          pa: 'ਅਣਦੇਖੇ \'ਤੇ ਵਿਸ਼ਵਾਸ',
          hi: 'अदृश्य पर विश्वास',
        },
        subtitle: 'Your spiritual anchor, prayer, and inner light through uncertain seasons',
        promptId: 'p14',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What prayer, belief, or unseen guidance gave you courage when the path was dark?'],
          gu: ['કઈ પ્રાર્થના કે શ્રદ્ધાએ તમને અંધકારમાં પણ સાચો માર્ગ બતાવ્યો?'],
          pa: ['ਕਿਹੜੀ ਅਰਦਾਸ ਜਾਂ ਵਿਸ਼ਵਾਸ ਨੇ ਤੁਹਾਨੂੰ ਹਨੇਰੇ ਵਿੱਚ ਵੀ ਰੌਸ਼ਨੀ ਦਿਖਾਈ?'],
          hi: ['किस प्रार्थना या विश्वास ने आपको कठिन राहों में हिम्मत और रोशनी दी?'],
        },
      },
      {
        id: 'part-4-scene-4',
        partNumber: 4,
        partTitle: 'Part IV: Trials, Triumphs & Milestones',
        sceneNumber: 4,
        title: 'Wounds into Wisdom',
        localizedTitles: {
          en: 'Wounds into Wisdom',
          gu: 'ઘા માંથી જ્ઞાન',
          pa: 'ਜ਼ਖ਼ਮਾਂ ਤੋਂ ਸਿਆਣਪ',
          hi: 'घावों से सीख',
        },
        subtitle: 'Transforming past heartbreak and painful scars into compassion and quiet strength',
        promptId: 'p15',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['How did enduring that hardship reshape your heart and soften how you judge others?'],
          gu: ['તે મુશ્કેલીએ તમારા હૃદયને કેવી રીતે વધુ દયાળુ અને સમજદાર બનાવ્યું?'],
          pa: ['ਉਸ ਤਜਰਬੇ ਨੇ ਤੁਹਾਡੇ ਦਿਲ ਨੂੰ ਕਿਵੇਂ ਹੋਰ ਨਰਮ ਅਤੇ ਸਮਝਦਾਰ ਬਣਾਇਆ?'],
          hi: ['उस अनुभव ने आपके मन को कैसे और अधिक संवेदनशील और मजबूत बनाया?'],
        },
      },
    ],
  },
  {
    id: 'part-v',
    partNumber: 5,
    title: 'Part V: Wisdom, Hard-Won Truths & Values',
    localizedTitles: {
      en: 'Part V: Wisdom and Reflection',
      gu: 'ભાગ V: જ્ઞાન અને પ્રતિબિંબ',
      pa: 'ਭਾਗ V: ਸਿਆਣਪ અને ਵਿਚਾਰ',
      hi: 'भाग V: ज्ञान और चिंतन',
    },
    subtitle: 'The Principles That Endure',
    description: 'Guiding moral compass, self-reflection, quiet victories, and letters to the future.',
    scenes: [
      {
        id: 'part-5-scene-1',
        partNumber: 5,
        partTitle: 'Part V: Wisdom, Hard-Won Truths & Values',
        sceneNumber: 1,
        title: 'Letters to Those Watching',
        localizedTitles: {
          en: 'Letters to Those Watching',
          gu: 'જોનારાઓને પત્રો',
          pa: 'ਦੇਖਣ ਵਾਲਿਆਂ ਨੂੰ ਚਿੱਠੀਆਂ',
          hi: 'देखने वालों को पत्र',
        },
        subtitle: 'Essential advice and timeless principles for children and grandchildren',
        promptId: 'p16',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What core guidance would you write in a letter to your young descendants?'],
          gu: ['તમારા સંતાનો અને પૌત્રો માટે તમે કઈ જીવન-સૂત્ર પત્રમાં લખવા માંગો છો?'],
          pa: ['ਆਪਣੀਆਂ ਆਉਣ ਵਾਲੀਆਂ ਪੀੜ੍ਹੀਆਂ ਨੂੰ ਤੁਸੀਂ ਕਿਹੜੀ ਜੀਵਨ-ਸੇਧ ਦੇਣੀ ਚਾਹੋਗੇ?'],
          hi: ['अपनी आने वाली पीढ़ी को आप कौन सा सबसे बड़ा जीवन-मंत्र देना चाहेंगे?'],
        },
      },
      {
        id: 'part-5-scene-2',
        partNumber: 5,
        partTitle: 'Part V: Wisdom, Hard-Won Truths & Values',
        sceneNumber: 2,
        title: 'Conversations with Myself',
        localizedTitles: {
          en: 'Conversations with Myself',
          gu: 'મારી સાથે વાતચીત',
          pa: 'ਆਪਣੇ ਆਪ ਨਾਲ ਗੱਲਾਂ',
          hi: 'अपने आप से बातें',
        },
        subtitle: 'Solitude, quiet contemplation, and your deeply personal life philosophy',
        promptId: 'p17',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['In your quietest moments of solitude, what truth do you whisper to yourself?'],
          gu: ['શાંત એકાંતમાં તમારા અંતરાત્મા સાથે તમે કઈ વાત કરો છો?'],
          pa: ['ਸ਼ਾਂਤ ਇਕਾਂਤ ਵਿੱਚ ਤੁਸੀਂ ਆਪਣੇ ਆਪ ਨੂੰ ਕਿਹੜਾ ਸੱਚ ਯਾਦ ਕਰਵਾਉਂਦੇ ਹੋ?'],
          hi: ['शांत एकांत में आप अपने दिल से कौन सी बात कहते हैं?'],
        },
      },
      {
        id: 'part-5-scene-3',
        partNumber: 5,
        partTitle: 'Part V: Wisdom, Hard-Won Truths & Values',
        sceneNumber: 3,
        title: 'The Person in the Mirror',
        localizedTitles: {
          en: 'The Person in the Mirror',
          gu: 'અરીસામાં વ્યક્તિ',
          pa: 'ਸ਼ੀਸ਼ੇ ਵਿਚਲਾ ਇਨਸਾਨ',
          hi: 'आईने में अक्स',
        },
        subtitle: 'An honest self-reckoning and peaceful acceptance of who you have become',
        promptId: 'p18',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['When you look in the mirror today, what character traits are you proudest of?'],
          gu: ['આજે અરીસામાં જોતા તમને તમારા કયા ગુણ પર સૌથી વધુ ગર્વ થાય છે?'],
          pa: ['ਅੱਜ ਸ਼ੀਸ਼ੇ ਵਿੱਚ ਦੇਖਦਿਆਂ ਤੁਹਾਨੂੰ ਆਪਣੇ ਕਿਹੜੇ ਗੁਣ \'ਤੇ ਸਭ ਤੋਂ ਵੱਧ ਮਾਣ ਹੁੰਦਾ ਹੈ?'],
          hi: ['आज आईने में देखते हुए आपको अपनी किस खूबी पर सबसे ज्यादा गर्व होता है?'],
        },
      },
      {
        id: 'part-5-scene-4',
        partNumber: 5,
        partTitle: 'Part V: Wisdom, Hard-Won Truths & Values',
        sceneNumber: 4,
        title: 'The Quiet Victories',
        localizedTitles: {
          en: 'The Quiet Victories',
          gu: 'શાંત વિજય',
          pa: 'ਸ਼ਾਂਤ ਜਿੱਤਾਂ',
          hi: 'खामोश जीत',
        },
        subtitle: 'Small, unheralded moments of grace and integrity that shaped your spirit',
        promptId: 'p19',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What was a small, unseen act of kindness or honesty that you cherish most?'],
          gu: ['કોઈ એવું નાનું પણ મૂલ્યવાન કાર્ય જેણે તમારા આત્માને સાચી શાંતિ આપી?'],
          pa: ['ਕੋਈ ਅਜਿਹੀ ਛੋਟੀ ਪਰ ਨੇਕ ਗੱਲ ਜਿਸ ਨੇ ਤੁਹਾਡੇ ਮਨ ਨੂੰ ਸੱਚਾ ਸਕੂਨ ਦਿੱਤਾ?'],
          hi: ['कोई ऐसा छोटा पर नेक काम जिसने आपके मन को सच्ची संतुष्टि और शांति दी?'],
        },
      },
    ],
  },
  {
    id: 'part-vi',
    partNumber: 6,
    title: 'Part VI: The Continuing Story & Heirloom Legacy',
    localizedTitles: {
      en: 'Part VI: Legacy & Horizons',
      gu: 'ભાગ VI: વારસો અને ક્ષિતિજો',
      pa: 'ਭਾਗ VI: ਵਿਰਾਸਤ ਅਤੇ ਦਿਸਹੱਦੇ',
      hi: 'भाग VI: विरासत और क्षितिज',
    },
    subtitle: 'Words for Tomorrow',
    description: 'Dreams ahead, relived joys, authentic conviction, and a blessing that will echo for 100 years.',
    scenes: [
      {
        id: 'part-6-scene-1',
        partNumber: 6,
        partTitle: 'Part VI: The Continuing Story & Heirloom Legacy',
        sceneNumber: 1,
        title: 'What Still Lies Ahead',
        localizedTitles: {
          en: 'What Still Lies Ahead',
          gu: 'હજી શું આગળ છે',
          pa: 'ਅਜੇ ਕੀ ਅੱਗੇ ਹੈ',
          hi: 'जो अभी आगे है',
        },
        subtitle: 'Hopes, aspirations, and curiosity about the future for family and community',
        promptId: 'p20',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What exciting horizon or future milestone do you still look forward to seeing?'],
          gu: ['ભવિષ્યના કયા સપના કે સારા દિવસો જોવાની તમને હજી પણ ઉત્સુકતા છે?'],
          pa: ['ਭਵਿੱਖ ਦੇ ਕਿਹੜੇ ਸੁਪਨੇ ਜਾਂ ਚੰਗੇ ਦਿਨ ਦੇਖਣ ਦੀ ਤੁਹਾਨੂੰ ਅਜੇ ਵੀ ਤਾਂਘ ਹੈ?'],
          hi: ['भविष्य के किन सपनों या पलों को देखने की आपको आज भी उत्सुकता है?'],
        },
      },
      {
        id: 'part-6-scene-2',
        partNumber: 6,
        partTitle: 'Part VI: The Continuing Story & Heirloom Legacy',
        sceneNumber: 2,
        title: 'If I Could Do It Again',
        localizedTitles: {
          en: 'If I Could Do It Again',
          gu: 'જો હું તે ફરી કરી શકું',
          pa: 'ਜੇ ਮੈਂ ਦੁਬਾਰਾ ਕਰ ਸਕਾਂ',
          hi: 'अगर मैं दोबारा जी सकूं',
        },
        subtitle: 'Reflections on choices made, joyful paths walked, and what you would relive',
        promptId: 'p21',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['If you could relive one magical afternoon from your life, which would it be?'],
          gu: ['જો તમે તમારા જીવનની કોઈ એક સુંદર સાંજ ફરી જીવી શકો, તો તે કઈ હશે?'],
          pa: ['ਜੇ ਤੁਸੀਂ ਆਪਣੀ ਜ਼ਿੰਦਗੀ ਦਾ ਕੋਈ ਇੱਕ ਖ਼ੂਬਸੂਰਤ ਪਲ ਦੁਬਾਰਾ ਜੀ ਸਕੋ, ਤਾਂ ਉਹ ਕਿਹੜਾ ਹੋਵੇਗਾ?'],
          hi: ['अगर आप अपनी जिंदगी की कोई एक सुनहरी शाम दोबारा जी सकें, तो वह कौन सी होगी?'],
        },
      },
      {
        id: 'part-6-scene-3',
        partNumber: 6,
        partTitle: 'Part VI: The Continuing Story & Heirloom Legacy',
        sceneNumber: 3,
        title: 'Living Authentically',
        localizedTitles: {
          en: 'Living Authentically',
          gu: 'પ્રામાણિકપણે જીવવું',
          pa: 'ਸੱਚੀ ਜ਼ਿੰਦਗੀ ਜਿਊਣਾ',
          hi: 'सच्चाई से जीना',
        },
        subtitle: 'Standing firmly by your core truths and living without apology or pretence',
        promptId: 'p22',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What conviction did you refuse to compromise, even when it cost you?'],
          gu: ['કયા સત્ય કે સિદ્ધાંત સાથે તમે કોઈ દિવસ સમાધાન ન કર્યું?'],
          pa: ['ਕਿਹੜੇ સੱਚ ਜਾਂ ਅਸੂਲ ਨਾਲ ਤੁਸੀਂ ਕਦੇ ਕੋਈ ਸਮਝੌਤਾ ਨਹੀਂ ਕੀਤਾ?'],
          hi: ['किस सच या सिद्धांत से आपने कभी कोई समझौता नहीं किया?'],
        },
      },
      {
        id: 'part-6-scene-4',
        partNumber: 6,
        partTitle: 'Part VI: The Continuing Story & Heirloom Legacy',
        sceneNumber: 4,
        title: 'Words to Remember Me By',
        localizedTitles: {
          en: 'The Story Continuing',
          gu: 'વાર્તા ચાલુ છે',
          pa: 'ਚੱਲਦੀ ਕਹਾਣੀ',
          hi: 'चलती कहानी',
        },
        subtitle: 'An enduring message of love, blessing, and truth for generations to hold close',
        promptId: 'p23',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['If your great-grandchildren listen to your voice 100 years from now, what blessing do you leave them?'],
          gu: ['સો વર્ષ પછી તમારી નવી પેઢી તમારો અવાજ સાંભળે, તો તમે તેમને કયો આશીર્વાદ આપશો?'],
          pa: ['ਸੌ ਸਾਲ ਬਾਅਦ ਤੁਹਾਡੀ ਨਵੀਂ ਪੀੜ੍ਹੀ ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸੁਣੇ, ਤਾਂ ਤੁਸੀਂ ਉਹਨਾਂ ਨੂੰ ਕੀ ਅਸੀਸ ਦੇਵੋਗੇ?'],
          hi: ['सौ साल बाद जब आपकी आने वाली पीढ़ी आपकी आवाज सुने, तो आप उन्हें क्या आशीर्वाद देंगे?'],
        },
      },
      {
        id: 'part-6-scene-5',
        partNumber: 6,
        partTitle: 'Part VI: The Continuing Story & Heirloom Legacy',
        sceneNumber: 5,
        title: 'Time Travel: The Power of Looking Back',
        localizedTitles: {
          en: 'Time Travel',
          gu: 'સમય પ્રવાસ',
          pa: 'ਸਮੇਂ ਦੀ ਯਾਤਰਾ',
          hi: 'समय की यात्रा',
        },
        subtitle: 'The importance of reflection, integration, and honouring how far you have travelled',
        promptId: 'p24',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: [
            'Why is it vital to pause and reflect upon the journey and experiences of your life?',
            'What does looking back reveal about the person you have steadily become?',
          ],
          gu: [
            'જીવનની આખી મુસાફરી પર પાછળ વળીને જોવું અને તેનું મૂલ્યાંકન કરવું કેમ જરૂરી છે?',
            'પાછળ જોવાથી તમને તમારા પોતાના વિકાસ વિશે શું સમજાય છે?',
          ],
          pa: [
            'ਜ਼ਿੰਦਗੀ ਦੇ ਸਫ਼ਰ ਨੂੰ ਪਿੱਛੇ ਮੁੜ ਕੇ ਵੇਖਣਾ ਅਤੇ ਸਮਝਣਾ ਕਿਉਂ ਜ਼ਰੂਰੀ ਹੈ?',
            'ਪਿੱਛੇ ਵੇਖਣ ਨਾਲ ਤੁਹਾਨੂੰ ਆਪਣੇ ਬਾਰੇ ਕੀ ਨਵੀਂ ਸਮਝ ਮਿਲਦੀ ਹੈ?',
          ],
          hi: [
            'जिंदगी के सफर को पीछे मुड़कर देखना और उसका अनुभव करना क्यों जरूरी है?',
            'पीछे देखने से आपको अपने व्यक्तित्व के विकास के बारे में क्या समझ आता है?',
          ],
        },
      },
    ],
  },
  {
    id: 'family-storytelling',
    partNumber: 7,
    title: 'ANTHOLOGY: FAMILY STORYTELLING',
    localizedTitles: {
      en: 'Family Storytelling',
      gu: 'કૌટુંબિક વાર્તાલાપ',
      pa: 'ਪਰਿਵਾਰਕ ਕਹਾਣੀਆਂ',
      hi: 'पारिवारिक कहानियां',
    },
    subtitle: 'Ancestral Lore, Traditions & Messages for the Future',
    description: 'Cherished memories of grandparents, ancestral roots, customs, and lasting wisdom for posterity.',
    isAnthology: true,
    scenes: [
      {
        id: 'family-scene-1',
        partNumber: 7,
        partTitle: 'ANTHOLOGY: FAMILY STORYTELLING',
        sceneNumber: 1,
        title: 'Memories of Elders',
        localizedTitles: {
          en: 'Memories of Elders',
          gu: 'વડીલોની યાદો',
          pa: 'ਵੱਡਿਆਂ ਦੀਆਂ ਯਾਦਾਂ',
          hi: 'बुजुर्गों की यादें',
        },
        subtitle: 'Cherished stories of grandparents and ancestors who came before',
        promptId: 'fs1_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['Share a cherished memory of a grandparent or elder. What made them special to you?'],
          gu: ['દાદા-દાદી કે કોઈ વડીલની વહાલી યાદ જણાવો. તેમનામાં શું ખાસ હતું?'],
          pa: ['ਦਾਦਾ-ਦਾਦੀ ਜਾਂ ਕਿਸੇ ਬਜ਼ੁਰਗ ਦੀ ਪਿਆਰੀ ਯਾਦ ਸਾਂਝੀ ਕਰੋ। ਉਹਨਾਂ ਵਿੱਚ ਕੀ ਖਾਸ ਸੀ?'],
          hi: ['दादा-दादी या किसी बुजुर्ग की प्यारी याद साझा करें। उनमें क्या खास था?'],
        },
      },
      {
        id: 'family-scene-2',
        partNumber: 7,
        partTitle: 'ANTHOLOGY: FAMILY STORYTELLING',
        sceneNumber: 2,
        title: 'Family Traditions',
        localizedTitles: {
          en: 'Family Traditions',
          gu: 'કૌટુંબિક પરંપરાઓ',
          pa: 'ਪਰਿਵਾਰਕ ਰੀਤਾਂ',
          hi: 'पारिवारिक परंपराएं',
        },
        subtitle: 'Customs and celebrations passed down through the generations',
        promptId: 'fs2_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What unique custom, recipe, or holiday ritual defined your family life?'],
          gu: ['કઈ ખાસ પરંપરા, વાનગી કે તહેવારની રીત તમારા પરિવારની ઓળખ હતી?'],
          pa: ['ਕਿਹੜੀ ਖਾਸ ਰੀਤ, ਪਕਵਾਨ ਜਾਂ ਤਿਉਹਾਰ ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਦੀ ਪਛਾਣ ਸੀ?'],
          hi: ['कौन सी खास परंपरा, व्यंजन या त्योहार आपके परिवार की पहचान था?'],
        },
      },
      {
        id: 'family-scene-3',
        partNumber: 7,
        partTitle: 'ANTHOLOGY: FAMILY STORYTELLING',
        sceneNumber: 3,
        title: 'Historical Events',
        localizedTitles: {
          en: 'Historical Events',
          gu: 'ઐતિહાસિક ઘટનાઓ',
          pa: 'ਇਤਿਹਾਸਕ ਘਟਨਾਵਾਂ',
          hi: 'ऐतिहासिक घटनाएं',
        },
        subtitle: 'Great historical moments and migrations that shaped your family’s journey',
        promptId: 'fs3_1',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['Which major historical event directly impacted your family or caused a migration?'],
          gu: ['કઈ મોટી ઐતિહાસિક ઘટના કે સ્થળાંતરે તમારા પરિવારના જીવનને નવો વળાંક આપ્યો?'],
          pa: ['ਕਿਸ ਵੱਡੀ ਇਤਿਹਾਸਕ ਘਟਨਾ ਨੇ ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਦੇ ਜੀਵਨ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕੀਤਾ?'],
          hi: ['किस बड़ी ऐतिहासिक घटना या विस्थापन ने आपके परिवार के जीवन को बदला?'],
        },
      },
      {
        id: 'family-scene-4',
        partNumber: 7,
        partTitle: 'ANTHOLOGY: FAMILY STORYTELLING',
        sceneNumber: 4,
        title: 'Parental Values',
        localizedTitles: {
          en: 'Parental Values',
          gu: 'માતાપિતાના મૂલ્યો',
          pa: 'ਮਾਪਿਆਂ ਦੇ સંਸਕਾਰ',
          hi: 'माता-पिता के संस्कार',
        },
        subtitle: 'The core principles, moral compass, and work ethic your parents instilled',
        promptId: 'fs4_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What core value or unbending principle did your parents pass down to you?'],
          gu: ['તમારા માતાપિતાએ તમને કયો સૌથી મોટો સંસ્કાર કે સિદ્ધાંત આપ્યો?'],
          pa: ['ਤੁਹਾਡੇ ਮਾਪਿਆਂ ਨੇ ਤੁਹਾਨੂੰ ਕਿਹੜਾ સਭ ਤੋਂ ਵੱਡਾ ਅਸੂਲ ਦਿੱਤਾ?'],
          hi: ['आपके माता-पिता ने आपको कौन सा सबसे बड़ा संस्कार या सिद्धांत दिया?'],
        },
      },
      {
        id: 'family-scene-5',
        partNumber: 7,
        partTitle: 'ANTHOLOGY: FAMILY STORYTELLING',
        sceneNumber: 5,
        title: 'Admired Ancestors',
        localizedTitles: {
          en: 'Admired Ancestors',
          gu: 'પ્રશંસનીય પૂર્વજો',
          pa: 'ਸਤਿਕਾਰਯੋਗ ਪੁਰਖੇ',
          hi: 'आदरणीय पूर्वज',
        },
        subtitle: 'Legends, grit, and stories of ancestors you never met but deeply revere',
        promptId: 'fs5_1',
        suggestedMediaMode: 'audio',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['Which ancestor’s story of sacrifice or courage fills you with greatest pride?'],
          gu: ['કયા પૂર્વજની હિંમત કે ત્યાગની વાર્તા તમને ગર્વથી ભરી દે છે?'],
          pa: ['ਕਿਸ ਪੁਰਖੇ ਦੀ ਕੁਰਬਾਨੀ ਜਾਂ ਦਲੇਰੀ ਤੁਹਾਨੂੰ સਭ ਤੋਂ ਵੱਧ ਪ੍ਰੇਰਿਤ ਕਰਦੀ ਹੈ?'],
          hi: ['किस पूर्वज के बलिदान या साहस की कहानी आपको सबसे ज्यादा प्रेरित करती है?'],
        },
      },
      {
        id: 'family-scene-6',
        partNumber: 7,
        partTitle: 'ANTHOLOGY: FAMILY STORYTELLING',
        sceneNumber: 6,
        title: 'A Message for the Future',
        localizedTitles: {
          en: 'A Message for the Future',
          gu: 'ભવિષ્ય માટે સંદેશ',
          pa: 'ભਵਿੱਖ ਲਈ ਸੁਨੇਹਾ',
          hi: 'भविष्य के लिए संदेश',
        },
        subtitle: 'Direct counsel, hope, and blessing for the generations yet to be born',
        promptId: 'fs6_1',
        suggestedMediaMode: 'video',
        defaultStatus: 'locked',
        keySensoryQuestions: {
          en: ['What hope or eternal advice do you wish to bestow upon your family’s future generations?'],
          gu: ['તમારા પરિવારની ભાવિ પેઢીઓને તમે કયો સંદેશ કે આશીર્વાદ આપવા માંગો છો?'],
          pa: ['ਆਪਣੇ ਪਰਿਵਾਰ ਦੀਆਂ ਆਉਣ ਵਾਲੀਆਂ ਪੀੜ੍ਹੀਆਂ ਨੂੰ ਤੁਸੀਂ ਕੀ ਸੁਨੇਹਾ ਜਾਂ ਅਸੀਸ ਦੇਣੀ ਚਾਹੁੰਦੇ ਹੋ?'],
          hi: ['अपने परिवार की आने वाली पीढ़ियों को आप क्या संदेश या आशीर्वाद देना चाहते हैं?'],
        },
      },
    ],
  },
  {
    id: 'historical-showcase',
    partNumber: 8,
    title: 'Historical Experiments (Demo)',
    localizedTitles: {
      en: 'Historical Experiments (Demo)',
      gu: 'Historical Experiments (Demo)',
      pa: 'Historical Experiments (Demo)',
      hi: 'Historical Experiments (Demo)',
    },
    subtitle: 'Albert Einstein: Spacetime & Imagination Sandbox',
    description: 'Test-drive the complete 5-Act Studio, teleprompter, and sensory anchors with Albert Einstein’s spacetime memoir.',
    isDemo: true,
    scenes: [
      {
        id: 'demo-einstein-scene',
        partNumber: 8,
        partTitle: 'Historical Experiments (Demo)',
        sceneNumber: 1,
        title: 'Albert Einstein: Spacetime & Imagination',
        localizedTitles: {
          en: 'Albert Einstein: Spacetime & Imagination',
          gu: 'Albert Einstein: Spacetime & Imagination',
          pa: 'Albert Einstein: Spacetime & Imagination',
          hi: 'Albert Einstein: Spacetime & Imagination',
        },
        subtitle: 'Before the equations, before the Nobel, before spacetime—there was only a boy, a trembling brass compass, and the invisible wonder of the unseen world.',
        promptId: 'p_einstein',
        suggestedMediaMode: 'video',
        defaultStatus: 'ready_for_action',
        keySensoryQuestions: {
          en: [
            'Cold Brass Pocket Compass: Cold metallic casing resting in a child’s trembling hand...',
            'Trembling Magnetic Needle (Unseen North): Slender needle stubbornly pointing to the mysterious north...',
            'Munich Bedroom Rain & Linens: Quiet rain against the glass, warmth of sickbed blankets...',
          ],
          gu: [
            'Cold Brass Pocket Compass: Cold metallic casing resting in a child’s trembling hand...',
            'Trembling Magnetic Needle (Unseen North): Slender needle stubbornly pointing to the mysterious north...',
            'Munich Bedroom Rain & Linens: Quiet rain against the glass, warmth of sickbed blankets...',
          ],
          pa: [
            'Cold Brass Pocket Compass: Cold metallic casing resting in a child’s trembling hand...',
            'Trembling Magnetic Needle (Unseen North): Slender needle stubbornly pointing to the mysterious north...',
            'Munich Bedroom Rain & Linens: Quiet rain against the glass, warmth of sickbed blankets...',
          ],
          hi: [
            'Cold Brass Pocket Compass: Cold metallic casing resting in a child’s trembling hand...',
            'Trembling Magnetic Needle (Unseen North): Slender needle stubbornly pointing to the mysterious north...',
            'Munich Bedroom Rain & Linens: Quiet rain against the glass, warmth of sickbed blankets...',
          ],
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
 * Helper to resolve the parent MasterStoryPart for a given sceneId (defaults to Part I)
 */
export function getPartForScene(sceneId?: string): MasterStoryPart {
  if (sceneId) {
    for (const part of MASTER_STORY_STRUCTURE) {
      if (part.scenes.some((s) => s.id === sceneId)) {
        return part;
      }
    }
  }
  return MASTER_STORY_STRUCTURE[0];
}

/**
 * Resolves a canonical MasterStoryScene from a Desktop promptId (e.g. "p1", "p4") or sceneId
 */
export function resolveSceneFromPromptId(promptId: string): MasterStoryScene | undefined {
  if (!promptId) return undefined;
  // Pass 1: Exact match on promptId or scene id
  for (const part of MASTER_STORY_STRUCTURE) {
    const exact = part.scenes.find((s) => s.promptId === promptId || s.id === promptId);
    if (exact) return exact;
  }
  // Pass 2: Base prefix fallback (e.g. "p1_take2" -> "p1")
  const basePromptId = promptId.split('_')[0];
  for (const part of MASTER_STORY_STRUCTURE) {
    const prefixMatch = part.scenes.find(
      (s) => s.promptId === basePromptId || s.promptId.split('_')[0] === basePromptId
    );
    if (prefixMatch) return prefixMatch;
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
  const allScenes = MASTER_STORY_STRUCTURE.filter((p) => !p.isDemo).flatMap((p) => p.scenes);
  const currentIndex = allScenes.findIndex((s) => s.id === currentSceneId);
  if (currentIndex >= 0 && currentIndex < allScenes.length - 1) {
    return allScenes[currentIndex + 1].id;
  }
  return null;
}

