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
        title: 'A Child of Two Worlds – Your birthplace, family roots, cultural influences',
        description: 'A Child of Two Worlds – Your birthplace, family roots, cultural influences',
        text: {
          en: 'A Child of Two Worlds – Your birthplace, family roots, cultural influences',
          gu: 'બે દુનિયાનું બાળક – તમારું જન્મસ્થળ, કુટુંબના મૂળ, સાંસ્કૃતિક પ્રભાવો',
        },
        isFlaggedForReuse: false,
        subPrompts: [
            { id: 'p1_1', title: "Let's start right at the beginning. Could you share some details about your birthplace – perhaps a specific memory of that place that stands out?", description: "Let's start right at the beginning. Could you share some details about your birthplace – perhaps a specific memory of that place that stands out?", text: { en: "Let's start right at the beginning. Could you share some details about your birthplace – perhaps a specific memory of that place that stands out?", gu: "ચાલો શરૂઆતથી જ શરૂ કરીએ. શું તમે તમારા જન્મસ્થળ વિશે કેટલીક વિગતો શેર કરી શકો છો - કદાચ તે સ્થાનની કોઈ વિશિષ્ટ સ્મૃતિ જે અલગ તરી આવે છે?" } },
            { id: 'p1_2', title: "And tell us about your family roots; were there any particular traditions, stories, or values passed down through generations that significantly influenced you?", description: "And tell us about your family roots; were there any particular traditions, stories, or values passed down through generations that significantly influenced you?", text: { en: "And tell us about your family roots; were there any particular traditions, stories, or values passed down through generations that significantly influenced you?", gu: "અને અમને તમારા કુટુંબના મૂળ વિશે કહો; શું કોઈ ચોક્કસ પરંપરાઓ, વાર્તાઓ અથવા મૂલ્યો પેઢીઓથી પસાર થયા હતા જેણે તમને નોંધપાત્ર રીતે પ્રભાવિત કર્યા?" } },
        ]
      },
      {
        id: 'p2',
        title: 'The House I Grew Up In – Daily life, environment, first memories',
        description: 'The House I Grew Up In – Daily life, environment, first memories',
        text: {
          en: 'The House I Grew Up In – Daily life, environment, first memories',
          gu: 'હું જે ઘરમાં મોટો થયો – દૈનિક જીવન, પર્યાવરણ, પ્રથમ યાદો',
        },
        isFlaggedForReuse: false,
      },
       {
        id: 'p3',
        title: 'Innocence and Curiosity – School days, early dreams, moments of wonder',
        description: 'Innocence and Curiosity – School days, early dreams, moments of wonder',
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
        title: 'Formative Friendships – Key relationships that shaped your youth',
        description: 'Formative Friendships – Key relationships that shaped your youth',
        text: {
          en: 'Formative Friendships – Key relationships that shaped your youth',
          gu: 'રચનાત્મક મિત્રતા – તમારા યુવાનીને આકાર આપનાર મુખ્ય સંબંધો',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p5',
        title: 'First Encounters with Hardship – Processing early loss or challenges',
        description: 'First Encounters with Hardship – Processing early loss or challenges',
        text: {
          en: 'First Encounters with Hardship – Processing early loss or challenges',
          gu: 'મુશ્કેલી સાથે પ્રથમ મુલાકાત – પ્રારંભિક નુકસાન અથવા પડકારોની પ્રક્રિયા',
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
        id: 'p10',
        title: 'Falling in Love – Your experiences with partnership and marriage',
        description: 'Falling in Love – Your experiences with partnership and marriage',
        text: {
          en: 'Falling in Love – Your experiences with partnership and marriage',
          gu: 'પ્રેમમાં પડવું – ભાગીદારી અને લગ્ન સાથેના તમારા અનુભવો',
        },
        isFlaggedForReuse: false,
      },
      {
        id: 'p11',
        title: 'The Birth of Children – The transformation of becoming a parent',
        description: 'The Birth of Children – The transformation of becoming a parent',
        text: {
          en: 'The Birth of Children – The transformation of becoming a parent',
          gu: 'બાળકોનો જન્મ – માતાપિતા બનવાનું પરિવર્તન',
        },
        isFlaggedForReuse: false,
      },
    ],
  },
];

export const mockPrompts: Prompt[] = mockPromptGroups.flatMap(group => 
    group.prompts.flatMap(prompt => [prompt, ...(prompt.subPrompts || [])])
);
