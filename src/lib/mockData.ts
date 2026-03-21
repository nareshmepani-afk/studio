import type { Prompt, PromptGroup } from '@/types';

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
        title: 'A Child of Two Worlds',
        description: 'Your birthplace, family roots, and cultural influences.',
        text: {
          en: 'A Child of Two Worlds – Your birthplace, family roots, cultural influences',
          gu: 'બે દુનિયાનું બાળક – તમારું જન્મસ્થળ, કુટુંબના મૂળ, સાંસ્કૃતિક પ્રભાવો',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p2',
        title: 'The House I Grew Up In',
        description: 'Daily life, environment, and your very first memories.',
        text: {
          en: 'The House I Grew Up In – Daily life, environment, first memories',
          gu: 'હું જે ઘરમાં મોટો થયો – દૈનિક જીવન, પર્યાવરણ, પ્રથમ યાદો',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p3',
        title: 'Innocence and Curiosity',
        description: 'School days, early dreams, and moments of wonder.',
        text: {
          en: 'Innocence and Curiosity – School days, early dreams, moments of wonder',
          gu: 'નિર્દોષતા અને જિજ્ઞાસા – શાળાના દિવસો, પ્રારંભિક સપના, આશ્ચર્યની ક્ષણો',
        },
        isFlaggedForReuse: false,
      },
    ],
  },
  {
    id: 'part-ii',
    title: {
      en: 'Part II: Crossroads and Identity',
      gu: 'ભાગ II: આંતરછેદ અને ઓળખ',
    },
    prompts: [
      {
        id: 'p4',
        title: 'Formative Friendships',
        description: 'Key relationships that shaped your youth.',
        text: {
          en: 'Formative Friendships – Key relationships that shaped your youth',
          gu: 'રચનાત્મક મિત્રતા – તમારા યુવાનીને આકાર આપનાર મુખ્ય સંબંધો',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p5',
        title: 'First Encounters with Hardship',
        description: 'Processing early loss or significant challenges.',
        text: {
          en: 'First Encounters with Hardship – Processing early loss or challenges',
          gu: 'મુશ્કેલી સાથે પ્રથમ મુલાકાત – પ્રારંભિક નુકસાન અથવા પડકારોની પ્રક્રિયા',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p6',
        title: 'Crossroads and Choices',
        description: 'Identity formation and pivotal adolescent decisions.',
        text: {
          en: 'Crossroads and Choices – Identity formation and pivotal decisions',
          gu: 'આંતરછેદ અને પસંદગીઓ - ઓળખની રચના અને મુખ્ય નિર્ણયો',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p7',
        title: 'Learning the Hard Way',
        description: 'Valuable lessons from mistakes and setbacks.',
        text: {
          en: 'Learning the Hard Way – Lessons from mistakes and setbacks',
          gu: 'અઘરી રીતે શીખવું - ભૂલો અને આંચકામાંથી પાઠ',
        },
        isFlaggedForReuse: false,
      },
    ],
  },
  {
    id: 'part-iii',
    title: {
      en: 'Part III: Love and Commitment',
      gu: 'ભાગ III: પ્રેમ અને પ્રતિબદ્ધતા',
    },
    prompts: [
      {
        id: 'p8',
        title: 'Journeys Within and Without',
        description: 'Significant travels and educational experiences.',
        text: {
          en: 'Journeys Within and Without – Travels and education',
          gu: 'અંદર અને બહારની મુસાફરી – પ્રવાસ અને શિક્ષણ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p9',
        title: 'Facing Reality',
        description: 'The transition to full adulthood and independence.',
        text: {
          en: 'Facing Reality – Transition to adulthood and independence',
          gu: 'વાસ્તવિકતાનો સામનો કરવો – પુખ્તાવસ્થા અને સ્વતંત્રતા તરફ સંક્રમણ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p10',
        title: 'Falling in Love',
        description: 'Your experiences with partnership and marriage.',
        text: {
          en: 'Falling in Love – Your experiences with partnership and marriage',
          gu: 'પ્રેમમાં પડવું – ભાગીદારી અને લગ્ન સાથેના તમારા અનુભવો',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p11',
        title: 'The Birth of Children',
        description: 'The profound transformation of becoming a parent.',
        text: {
          en: 'The Birth of Children – The transformation of becoming a parent',
          gu: 'બાળકોનો જન્મ – માતાપિતા બનવાનું પરિવર્તન',
        },
        isFlaggedForReuse: false,
      },
    ],
  },
  {
    id: 'part-iv',
    title: {
      en: 'Part IV: Trials and Resilience',
      gu: 'ભાગ IV: પરીક્ષણો અને સ્થિતિસ્થાપકતા',
    },
    prompts: [
      {
        id: 'p12',
        title: 'Holding On and Letting Go',
        description: 'Navigating financial, emotional, or spiritual trials.',
        text: {
          en: 'Holding On and Letting Go – Navigating life\'s various challenges',
          gu: 'પકડી રાખવું અને છોડી દેવું - જીવનના વિવિધ પડકારોને નેવિગેટ કરવું',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p13',
        title: 'The Test of Fire',
        description: 'Moments that pushed you to your absolute limits.',
        text: {
          en: 'The Test of Fire – Deep struggles and rising again',
          gu: 'અગ્નિ પરીક્ષા - ઊંડો સંઘર્ષ અને ફરી બેઠા થવું',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p14',
        title: 'Faith in the Invisible',
        description: 'Your spiritual journey and core beliefs.',
        text: {
          en: 'Faith in the Invisible – Spiritual journey and core beliefs',
          gu: 'અદ્રશ્યમાં વિશ્વાસ - આધ્યાત્મિક યાત્રા અને મુખ્ય માન્યતાઓ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p15',
        title: 'Wounds into Wisdom',
        description: 'Transforming past pain into valuable life lessons.',
        text: {
          en: 'Wounds into Wisdom – Transforming pain into lessons',
          gu: 'ઘા માંથી જ્ઞાન - પીડાને પાઠમાં રૂપાંતરિત કરવી',
        },
        isFlaggedForReuse: false,
      },
    ],
  },
  {
    id: 'part-v',
    title: {
      en: 'Part V: Wisdom and Reflection',
      gu: 'ભાગ V: જ્ઞાન અને પ્રતિબિંબ',
    },
    prompts: [
      {
        id: 'p16',
        title: 'Letters to Those Watching',
        description: 'Advice for the next generation.',
        text: {
          en: 'Letters to Those Watching – Advice for next generation',
          gu: 'જોનારાઓને પત્રો - આગામી પેઢી માટે સલાહ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p17',
        title: 'Conversations with Myself',
        description: 'Internal dialogues and personal philosophies.',
        text: {
          en: 'Conversations with Myself – Personal philosophies',
          gu: 'મારી સાથે વાતચીત - વ્યક્તિગત ફિલસૂફી',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p18',
        title: 'The Person in the Mirror',
        description: 'An honest self-assessment of who you are today.',
        text: {
          en: 'The Person in the Mirror – Honest self-assessment today',
          gu: 'અરીસામાં વ્યક્તિ - આજે પ્રામાણિક આત્મ-મૂલ્યાંકન',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p19',
        title: 'The Quiet Victories',
        description: 'Small moments that shaped your soul.',
        text: {
          en: 'The Quiet Victories – Small moments shaping your soul',
          gu: 'શાંત વિજય – તમારા આત્માને આકાર આપતી નાની ક્ષણો',
        },
        isFlaggedForReuse: false,
      },
    ],
  },
  {
    id: 'part-vi',
    title: {
      en: 'Part VI: The Continuing Story',
      gu: 'ભાગ VI: ચાલુ વાર્તા',
    },
    prompts: [
      {
        id: 'p20',
        title: 'What Still Lies Ahead',
        description: 'Your dreams, aspirations, and hopes for the next generation.',
        text: {
          en: 'What Still Lies Ahead – Dreams, aspirations, and the future',
          gu: 'હજી શું આગળ છે - સપના, આકાંક્ષાઓ અને ભવિષ્ય',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p21',
        title: 'If I Could Do It Again',
        description: 'Reflections on past choices and joy repeated.',
        text: {
          en: 'If I Could Do It Again – Choices and joy repeated',
          gu: 'જો હું તે ફરી કરી શકું – પસંદગીઓ અને આનંદ પુનરાવર્તિત',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p22',
        title: 'Final Experiment with Truth',
        description: 'Living authentically with your core convictions.',
        text: {
          en: 'Final Experiment with Truth – Core convictions',
          gu: 'સત્ય સાથે અંતિમ પ્રયોગ - મુખ્ય માન્યતાઓ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p23',
        title: 'The Story Continuing',
        description: 'Final thoughts on your legacy and the great unknown.',
        text: {
          en: 'The Story Continuing – Legacy and final reflections',
          gu: 'વાર્તા ચાલુ છે - વારસો અને અંતિમ પ્રતિબિંબ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p24',
        title: 'Time Travel',
        description: 'The importance of reflection and looking back.',
        text: {
          en: 'Time Travel – The importance of reflection',
          gu: 'સમય પ્રવાસ - પ્રતિબિંબનું મહત્વ',
        },
        isFlaggedForReuse: false,
      },
    ],
  },
  {
    id: 'family-storytelling',
    title: {
      en: 'Family Storytelling',
      gu: 'કૌૌટુંબિક વાર્તાલાપ',
    },
    prompts: [
      {
        id: 'fs1_1',
        title: 'Memories of Elders',
        description: 'Cherished stories of grandparents and ancestors.',
        text: {
          en: 'Memories of Elders – Cherished stories of grandparents',
          gu: 'વડીલોની યાદો - દાદા-દાદીની વહાલી વાર્તાઓ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'fs2_1',
        title: 'Family Traditions',
        description: 'Customs passed down through generations.',
        text: {
          en: 'Family Traditions – Customs passed down',
          gu: 'કૌટુંબિક પરંપરાઓ - પેઢીઓથી ચાલી આવતી રૂઢિઓ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'fs3_1',
        title: 'Historical Events',
        description: 'Events that impacted your family path.',
        text: {
          en: 'Historical Events – Family impact',
          gu: 'ઐતિહાસિક ઘટનાઓ – પારિવારિક પ્રભાવ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'fs4_1',
        title: 'Parental Values',
        description: 'The core principles your parents instilled.',
        text: {
          en: 'Parental Values – Core principles instilled',
          gu: 'માતાપિતાના મૂલ્યો - કેળવેલા મુખ્ય સિદ્ધાંતો',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'fs5_1',
        title: 'Admired Ancestors',
        description: 'Stories of ancestors you admire.',
        text: {
          en: 'Admired Ancestors – Ancestor stories',
          gu: 'પ્રશંસનીય પૂર્વજો - પૂર્વજોની વાર્તાઓ',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'fs6_1',
        title: 'A Message for the Future',
        description: 'Wisdom and hopes recorded for your descendants.',
        text: {
          en: 'A Message for the Future – Wisdom for future generations',
          gu: 'ભવિષ્ય માટે સંદેશ - ભાવિ પેઢીઓ માટે જ્ઞાન',
        },
        isFlaggedForReuse: false,
      },
    ],
  },
];

export const mockPrompts: Prompt[] = mockPromptGroups.flatMap(group => 
    group.prompts.flatMap(prompt => [prompt, ...(prompt.subPrompts || [])])
);
