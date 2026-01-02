
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
        text: {
          en: 'A Child of Two Worlds – Your birthplace, family roots, cultural influences',
          gu: 'બે દુનિયાનું બાળક – તમારું જન્મસ્થળ, કુટુંબના મૂળ, સાંસ્કૃતિક પ્રભાવો',
        },
        isFlaggedForReuse: false,
        subPrompts: [
            { id: 'p1_1', text: { en: "Let's start right at the beginning. Could you share some details about your birthplace – perhaps a specific memory of that place that stands out?", gu: "ચાલો શરૂઆતથી જ શરૂ કરીએ. શું તમે તમારા જન્મસ્થળ વિશે કેટલીક વિગતો શેર કરી શકો છો - કદાચ તે સ્થાનની કોઈ વિશિષ્ટ સ્મૃતિ જે અલગ તરી આવે છે?" } },
            { id: 'p1_2', text: { en: "And tell us about your family roots; were there any particular traditions, stories, or values passed down through generations that significantly influenced you?", gu: "અને અમને તમારા કુટુંબના મૂળ વિશે કહો; શું કોઈ ચોક્કસ પરંપરાઓ, વાર્તાઓ અથવા મૂલ્યો પેઢીઓથી પસાર થયા હતા જેણે તમને નોંધપાત્ર રીતે પ્રભાવિત કર્યા?" } },
            { id: 'p1_3', text: { en: "How did the cultural environment you grew up in—whether it was a blend of different cultures or a very specific one—shape your early perspectives and who you are today?", gu: "તમે જે સાંસ્કૃતિક વાતાવરણમાં ઉછર્યા છો - ભલે તે વિવિધ સંસ્કૃતિઓનું મિશ્રણ હોય કે ખૂબ જ વિશિષ્ટ - તેણે તમારા પ્રારંભિક દ્રષ્ટિકોણને અને આજે તમે કોણ છો તે કેવી રીતે આકાર આપ્યો?" } },
            { id: 'p1_4', text: { en: "Were there specific customs, foods, or languages that were central to your upbringing?", gu: "શું તમારા ઉછેરમાં કોઈ ચોક્કસ રિવાજો, ખોરાક અથવા ભાષાઓ કેન્દ્રિય હતી?" } },
            { id: 'p1_5', text: { en: "And thinking about your parents or primary caregivers, what were some of their core values or beliefs that they instilled in you from a young age?", gu: "અને તમારા માતાપિતા અથવા પ્રાથમિક સંભાળ રાખનારાઓ વિશે વિચારીએ તો, તેમના કેટલાક મુખ્ય મૂલ્યો અથવા માન્યતાઓ શું હતી જે તેઓએ નાની ઉંમરથી તમારામાં સ્થાપિત કરી હતી?" } },
            { id: 'p1_6', text: { en: "How did those foundational elements contribute to your initial understanding of the world?", gu: "તે પાયાના તત્વોએ વિશ્વની તમારી પ્રારંભિક સમજમાં કેવી રીતે ફાળો આપ્યો?" } },
        ]
      },
      {
        id: 'p2',
        text: {
          en: 'The House I Grew Up In – Daily life, environment, first memories',
          gu: 'હું જે ઘરમાં મોટો થયો – દૈનિક જીવન, પર્યાવરણ, પ્રથમ યાદો',
        },
        isFlaggedForReuse: false,
        subPrompts: [
            { id: 'p2_1', text: { en: "Now, let's turn our attention to the house itself. What was daily life like within those walls? Describe the atmosphere, the routines, the sounds, and even the smells that you remember most vividly.", gu: "હવે, ચાલો ઘર પર જ આપણું ધ્યાન કેન્દ્રિત કરીએ. તે દિવાલોની અંદરનું દૈનિક જીવન કેવું હતું? વાતાવરણ, દિનચર્યા, અવાજો અને તે ગંધનું વર્ણન કરો જે તમને સૌથી વધુ સ્પષ્ટ રીતે યાદ છે." } },
            { id: 'p2_2', text: { en: "What were the different rooms like, and what significant moments happened in them?", gu: "જુદા જુદા ઓરડાઓ કેવા હતા, અને તેમાં કઈ મહત્વપૂર્ણ ક્ષણો બની?" } },
            { id: 'p2_3', text: { en: "Thinking back to your very first memories, what specific scenes or feelings come to mind when you recall your childhood home?", gu: "તમારી પ્રથમ યાદો વિશે વિચારીએ તો, જ્યારે તમે તમારા બાળપણના ઘરને યાદ કરો છો ત્યારે કયા ચોક્કસ દ્રશ્યો અથવા લાગણીઓ મનમાં આવે છે?" } },
            { id: 'p2_4', text: { en: "Were there particular chores, family meals, or weekend activities that stand out in your memory?", gu: "શું કોઈ ચોક્કસ કામકાજ, કૌટુંબિક ભોજન અથવા સપ્તાહના અંતની પ્રવૃત્તિઓ હતી જે તમારી યાદમાં અલગ છે?" } },
            { id: 'p2_5', text: { en: "And how did that physical environment, the very structure and feeling of your home, shape your sense of comfort, security, or even your earliest adventures and curiosities?", gu: "અને તે ભૌતિક વાતાવરણ, તમારા ઘરની રચના અને અનુભૂતિએ તમારા આરામ, સુરક્ષા અથવા તો તમારા પ્રારંભિક સાહસો અને જિજ્ઞાસાઓની ભાવનાને કેવી રીતે આકાર આપ્યો?" } },
        ]
      },
       {
        id: 'p3',
        text: {
          en: 'Innocence and Curiosity – School days, early dreams, moments of wonder',
          gu: 'નિર્દોષતા અને જિજ્ઞાસા – શાળાના દિવસો, પ્રારંભિક સપના, આશ્ચર્યની ક્ષણો',
        },
        isFlaggedForReuse: false,
        subPrompts: [
            { id: 'p3_1', text: { en: "Moving into your early years, let's talk about your school days. What subjects captivated you, or perhaps challenged you the most, and why?", gu: "તમારા પ્રારંભિક વર્ષોમાં આગળ વધીએ, ચાલો તમારા શાળાના દિવસો વિશે વાત કરીએ. કયા વિષયોએ તમને મોહિત કર્યા, અથવા કદાચ તમને સૌથી વધુ પડકાર્યા, અને શા માટે?" } },
            { id: 'p3_2', text: { en: "Were there any teachers who left a lasting impression on you, and if so, how did they influence your thinking or your path?", gu: "શું એવા કોઈ શિક્ષકો હતા જેમણે તમારા પર કાયમી છાપ છોડી હોય, અને જો એમ હોય, તો તેઓએ તમારી વિચારસરણી અથવા તમારા માર્ગને કેવી રીતે પ્રભાવિત કર્યો?" } },
            { id: 'p3_3', text: { en: "Beyond academics, what were your early dreams and aspirations as a child? Did you imagine yourself doing something extraordinary, or were your dreams simpler and more immediate?", gu: "શિક્ષણ ઉપરાંત, બાળક તરીકે તમારા પ્રારંભિક સપના અને આકાંક્ષાઓ શું હતી? શું તમે કલ્પના કરી હતી કે તમે કંઈક અસાધારણ કરી રહ્યા છો, અથવા તમારા સપના સરળ અને વધુ તાત્કાલિક હતા?" } },
            { id: 'p3_4', text: { en: "What moments from your childhood truly filled you with a sense of wonder or insatiable curiosity? This could be anything from discovering a new book, exploring a natural space, or learning something profound for the first time.", gu: "તમારા બાળપણની કઈ ક્ષણોએ તમને ખરેખર આશ્ચર્ય અથવા અતૃપ્ત જિજ્ઞાસાની ભાવનાથી ભરી દીધા? આ નવી પુસ્તક શોધવાથી લઈને, કુદરતી જગ્યાની શોધખોળ કરવા અથવા પ્રથમ વખત કંઈક ગહન શીખવા સુધી કંઈપણ હોઈ શકે છે." } },
            { id: 'p3_5', text: { en: "What ignited that spark of curiosity in you back then, and how did it guide your early explorations?", gu: "તે સમયે તમારામાં જિજ્ઞાસાની તે ચિનગારી શું પ્રગટાવી, અને તેણે તમારી પ્રારંભિક શોધખોળને કેવી રીતે માર્ગદર્શન આપ્યું?" } },
        ]
      },
    ],
  },
];

export const mockPrompts: Prompt[] = mockPromptGroups.flatMap(group => 
    group.prompts.flatMap(prompt => prompt.subPrompts ? [prompt, ...prompt.subPrompts] : [prompt])
);
