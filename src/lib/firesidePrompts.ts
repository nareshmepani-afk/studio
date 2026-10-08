/**
 * 🎙️ Fireside Voice Studio — Multilingual Prompt Spark Dataset & Query Engine
 *
 * Milestone: ARCH-MW-122 (Global Curriculum Bridge & Universal Part Parity Engine)
 * Target Route: /studio/fireside
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics, Rule 35.3 Multi-Script Diaspora, Rule 46 Universal Curriculum SSOT)
 */

import type { FiresidePromptSpark, FiresideLanguage, PromptCategory } from '@/types/fireside';

export const FIRESIDE_PROMPT_SPARKS: FiresidePromptSpark[] = [
  // ─── PART I: ROOTS AND FOUNDATIONS (Scenes 1–4) ──────────────────────────
  {
    id: 'spark_roots_journey',
    category: 'roots',
    title: 'A Child of Two Worlds',
    localizedTitles: {
      en: 'A Child of Two Worlds',
      gu: 'બે દુનિયાનું બાળક',
      pa: 'ਦੋ ਦੁਨੀਆ ਦਾ ਬੱਚਾ',
      hi: 'दो दुनिया का बच्चा',
    },
    linkedSceneId: 'part-1-scene-1',
    suggestedMediaMode: 'video',
    sparks: {
      en: 'What stories did your grandparents share about where your family originally came from, and what courageous journey brought them here? Daily life, environment, and your very first memories.',
      gu: 'તમારા વડીલો કે દાદા-દાદીએ પોતાના મૂળ વતન અને મુશ્કેલ સ્થળાંતર વિશે તમને કઈ વાતો કહી હતી? દૈનિક જીવન, વાતાવરણ અને બાળપણની પ્રથમ યાદો.',
      pa: 'ਤੁਹਾਡੇ ਬਜ਼ੁਰਗਾਂ ਜਾਂ ਦਾਦਾ-ਦਾਦੀ ਨੇ ਆਪਣੇ ਪੁਰਾਣੇ ਪਿੰਡ ਅਤੇ ਹਿਜਰਤ ਦੇ ਸਫ਼ਰ ਬਾਰੇ ਤੁਹਾਨੂੰ ਕੀ ਦੱਸਿਆ ਸੀ? ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਅਤੇ ਪਹਿਲੀਆਂ ਯਾਦਾਂ।',
      hi: 'आपके दादा-दादी या बुजुर्गों ने अपने पुश्तैनी गांव और वहां से नए शहर बसने के सफर के बारे में क्या सुनाया था? दिनचर्या और शुरुआती यादें।',
    },
    followUpQuestions: {
      en: [
        'What precious heirlooms or small possessions did they carry on the crossing?',
        'What was the hardest thing about starting afresh in an unfamiliar community?',
        'Which ancestral traditions or values do you still cherish today?',
      ],
      gu: [
        'તેઓ પોતાની સાથે કઈ પ્રિય વસ્તુ કે કૌટુંબિક સંભારણું લાવ્યા હતા?',
        'નવી જગ્યાએ નવેસરથી જીવન શરૂ કરવામાં સૌથી મોટો પડકાર કયો હતો?',
        'વડવાઓની કઈ પરંપરા કે મૂલ્યો તમે આજે પણ સાચવી રાખ્યા છે?',
      ],
      pa: [
        'ਉਹ ਆਪਣੇ ਨਾਲ ਕਿਹੜੀ ਯਾਦਗਾਰੀ ਜਾਂ ਪਿਆਰੀ ਚੀਜ਼ ਲੈ ਕੇ ਆਏ ਸਨ?',
        'ਨਵੀਂ ਧਰਤੀ \'ਤੇ ਜ਼ਿੰਦਗੀ ਸ਼ੁਰੂ ਕਰਨ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਡੀ ਚੁਣੌਤੀ ਕਿਹੜੀ ਸੀ?',
        'ਬਜ਼ੁਰਗਾਂ ਦੀ ਕਿਹੜੀ ਰੀਤ ਜਾਂ ਅਸੂਲ ਤੁਸੀਂ ਅੱਜ ਵੀ ਸੰਭਾਲ ਕੇ ਰੱਖੇ ਹਨ?',
      ],
      hi: [
        'वे अपने साथ कौन सी धरोहर या निशानी लेकर आए थे?',
        'नए शहर या देश में जीवन की नई शुरुआत करने में सबसे बड़ी चुनौती क्या थी?',
        'पूर्वजों की कौन सी परंपरा या संस्कार आज भी आपके दिल के करीब हैं?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find an early passport portrait or family group photograph of your parents or grandparents in their younger years.',
      gu: 'તમારા માતા-પિતા અથવા દાદા-દાદીની યુવાનીના સમયની અથવા જૂના પાસપોર્ટની તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਮਾਤਾ-ਪਿਤਾ ਜਾਂ ਦਾਦਾ-ਦਾਦੀ ਦੀ ਜਵਾਨੀ ਵੇਲੇ ਦੀ ਜਾਂ ਪੁਰਾਣੇ ਪਾਸਪੋਰਟ ਦੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने माता-पिता या दादा-दादी के शुरुआती दिनों या पुराने पासपोर्ट की कोई तस्वीर ढूंढिए।',
    },
  },
  {
    id: 'spark_childhood_home',
    category: 'childhood',
    title: 'The House I Grew Up In',
    localizedTitles: {
      en: 'The House I Grew Up In',
      gu: 'હું જે ઘરમાં મોટો થયો',
      pa: 'ਉਹ ਘਰ ਜਿੱਥੇ ਮੈਂ ਵੱਡਾ ਹੋਇਆ',
      hi: 'वह घर जहाँ मैं बड़ा हुआ',
    },
    linkedSceneId: 'part-1-scene-2',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Think back to the home where you grew up. What aromas drifted from the morning kitchen, and what sounds signalled the start of a new day?',
      gu: 'તમે જ્યાં મોટા થયા તે બાળપણના ઘરની યાદ કરો. સવારના રસોડામાંથી કઈ સુગંધ આવતી હતી, અને આંગણામાંથી કેવા અવાજો સંભળાતા હતા?',
      pa: 'ਆਪਣੇ ਬਚਪਨ ਦੇ ਘਰ ਨੂੰ ਯਾਦ ਕਰੋ। ਸਵੇਰੇ ਰਸੋਈ ਵਿੱਚੋਂ ਕਿਹੜੀਆਂ ਖ਼ੁਸ਼ਬੂਆਂ ਆਉਂਦੀਆਂ ਸਨ, ਅਤੇ ਗਲੀ-ਮੁਹੱਲੇ ਵਿੱਚੋਂ ਕਿਹੜੀਆਂ ਆਵਾਜ਼ਾਂ ਸੁਣਾਈ ਦਿੰਦੀਆਂ ਸਨ?',
      hi: 'उस घर को याद कीजिए जहां आपका बचपन बीता। सुबह की रसोई से कैसी महक आती थी, और घर के आंगन में कैसी चहल-पहल होती थी?',
    },
    followUpQuestions: {
      en: [
        'Who usually prepared the morning meals in your household?',
        'Was there a favourite dish simmered only on special festive days?',
        'What games did you play on the doorstep with neighbourhood friends?',
      ],
      gu: [
        'ઘરમાં સવારનું ભોજન સામાન્ય રીતે કોણ બનાવતું હતું?',
        'કોઈ એવી પ્રિય વાનગી જે માત્ર ખાસ તહેવારના દિવસે જ બનતી?',
        'ઘરના આંગણે કે શેરીમાં તમે મિત્રો સાથે કઈ રમતો રમતા?',
      ],
      pa: [
        'ਘਰ ਵਿੱਚ ਸਵੇਰ ਦਾ ਖਾਣਾ ਆਮ ਤੌਰ \'ਤੇ ਕੌਣ ਬਣਾਉਂਦਾ ਸੀ?',
        'ਕੀ ਕੋਈ ਅਜਿਹਾ ਮਨਪਸੰਦ ਪਕਵਾਨ ਸੀ ਜੋ ਸਿਰਫ਼ ਖ਼ਾਸ ਤਿਉਹਾਰਾਂ \'ਤੇ ਹੀ ਬਣਦਾ ਸੀ?',
        'ਤੁਸੀਂ ਗਲੀ ਵਿੱਚ ਦੋਸਤਾਂ ਨਾਲ ਕਿਹੜੀਆਂ ਖੇਡਾਂ ਖੇਡਦੇ ਸੀ?',
      ],
      hi: [
        'घर में सुबह का खाना ज्यादातर कौन बनाता था?',
        'क्या कोई ऐसा पसंदीदा पकवान था जो केवल खास मौकों या त्योहारों पर ही बनता था?',
        'घर के बाहर दोस्तों के साथ आप कौन से खेल खेलते थे?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for an old photograph of your childhood family home, front doorstep, or kitchen courtyard.',
      gu: 'તમારા બાળપણના ઘરની, ફળિયાની અથવા કુટુંબની કોઈ જૂની તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਬਚਪਨ ਦੇ ਘਰ, ਵਿਹੜੇ ਜਾਂ ਪਰਿਵਾਰ ਦੀ ਕੋਈ ਪੁਰਾਣੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने बचपन के घर, आंगन या पूरे परिवार की कोई पुरानी तस्वीर तलाशिए।',
    },
  },
  {
    id: 'spark_innocence_curiosity',
    category: 'childhood',
    title: 'Innocence and Curiosity',
    localizedTitles: {
      en: 'Innocence and Curiosity',
      gu: 'નિર્દોષતા અને જિજ્ઞાસા',
      pa: 'ਮਾਸੂਮੀਅਤ ਅਤੇ ਉਤਸੁਕਤਾ',
      hi: 'मासूमियत और जिज्ञासा',
    },
    linkedSceneId: 'part-1-scene-3',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Describe your early school days, childhood friendships, and the first moments of wonder that sparked your imagination.',
      gu: 'તમારા બાળપણની શાળાના દિવસો, મિત્રતા અને એવી ક્ષણોનું વર્ણન કરો જેણે તમારી કલ્પનાશક્તિને નવી પાંખો આપી.',
      pa: 'ਆਪਣੇ ਸਕੂਲ ਦੇ ਸ਼ੁਰੂਆਤੀ ਦਿਨਾਂ, ਬਚਪਨ ਦੀ ਦੋਸਤੀ ਅਤੇ ਉਸ ਉਤਸੁਕਤਾ ਬਾਰੇ ਦੱਸੋ ਜਿਸ ਨੇ ਤੁਹਾਡੇ ਸੁਪਨਿਆਂ ਨੂੰ ਜਗਾਇਆ।',
      hi: 'अपने स्कूल के शुरुआती दिनों, बचपन की मासूम दोस्ती और उस जिज्ञासा का वर्णन कीजिए जिसने आपके सपनों को पंख दिए।',
    },
    followUpQuestions: {
      en: [
        'Who was the first teacher or mentor who made you feel truly seen and encouraged?',
        'What book, subject, or curiosity kept you reading under the blankets?',
        'What childhood playground game brought you the purest laughter?',
      ],
      gu: [
        'કયા શિક્ષકે તમને સૌથી પહેલું પ્રોત્સાહન આપ્યું?',
        'કયા વિષય કે પુસ્તકે તમારી જિજ્ઞાસા જગાડી?',
        'શાળાના મેદાનમાં કઈ રમત તમને સૌથી વધુ ગમતી?',
      ],
      pa: [
        'ਕਿਹੜੇ ਅਧਿਆਪਕ ਨੇ ਤੁਹਾਡੀ ਹੌਸਲਾ ਅਫ਼ਜ਼ਾਈ ਕੀਤੀ ਸੀ?',
        'ਕਿਹੜੀ ਕਿਤਾਬ ਜਾਂ ਕਹਾਣੀ ਤੁਹਾਡੇ ਦਿਲ ਨੂੰ ਭਾ ਗਈ ਸੀ?',
        'ਸਕੂਲ ਦੇ ਮੈਦਾਨ ਵਿੱਚ ਕਿਹੜੀ ਖੇਡ ਸਭ ਤੋਂ ਵੱਧ ਪਸੰਦ ਸੀ?',
      ],
      hi: [
        'किस शिक्षक ने आपका हौसला सबसे ज्यादा बढ़ाया?',
        'किस किताब या कहानी ने आपकी कल्पना को नई दिशा दी?',
        'स्कूल के दिनों का कौन सा खेल आपको सबसे ज्यादा याद है?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for an early school class portrait, report book, or snapshot of you with early school friends.',
      gu: 'શાળાના વર્ગખંડની, રિપોર્ટ કાર્ડની કે જૂના સ્કૂલ મિત્રો સાથેની કોઈ તસવીર શોધો.',
      pa: 'ਸਕੂਲ ਦੇ ਦਿਨਾਂ ਦੀ ਜਮਾਤ ਦੀ ਜਾਂ ਪੁਰਾਣੇ ਦੋਸਤਾਂ ਨਾਲ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'स्कूल के दिनों की क्लास फोटो या दोस्तों के साथ ली गई कोई पुरानी तस्वीर ढूंढिए।',
    },
  },
  {
    id: 'spark_traditions_festivals',
    category: 'traditions',
    title: 'Traditions, Feasts & Sacred Days',
    localizedTitles: {
      en: 'Traditions, Feasts & Sacred Days',
      gu: 'પરંપરાઓ, તહેવારો અને પવિત્ર દિવસો',
      pa: 'ਰੀਤਾਂ, ਤਿਉਹਾਰ ਅਤੇ ਪਵਿੱਤਰ ਦਿਨ',
      hi: 'परंपराएं, त्योहार और पावन दिन',
    },
    linkedSceneId: 'part-1-scene-4',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'How did your family celebrate the great festivals and sacred gatherings? Describe the aromas of festive kitchens, heirloom recipes, and blessings from family elders.',
      gu: 'તમારો પરિવાર મોટા તહેવારો અને ઉત્સવો કેવી રીતે ઉજવતો હતો? રસોડાની વિશેષ સુગંધ, પરંપરાગત વાનગીઓ અને વડીલોના આશીર્વાદ યાદ કરો.',
      pa: 'ਤੁਹਾਡਾ ਪਰਿਵਾਰ ਵੱਡੇ ਤਿਉਹਾਰ ਕਿਵੇਂ ਮਨਾਉਂਦਾ ਸੀ? ਰਸੋਈ ਦੇ ਖ਼ਾਸ ਪਕਵਾਨਾਂ ਦੀ ਖ਼ੁਸ਼ਬੂ ਅਤੇ ਬਜ਼ੁਰਗਾਂ ਦੀਆਂ ਅਸੀਸਾਂ ਨੂੰ ਚੇਤੇ ਕਰੋ।',
      hi: 'आपका परिवार बड़े त्योहार और पावन पर्व कैसे मनाता था? रसोई में पकते पारंपरिक व्यंजनों की महक और बुजुर्गों के आशीर्वाद को याद कीजिए।',
    },
    followUpQuestions: {
      en: [
        'Which festival did you anticipate most excitedly as a young child?',
        'What sacred blessings or customs did the family elders bestow?',
        'Which of those customs have you passed down to your children and grandchildren?',
      ],
      gu: [
        'બાળપણમાં તમને કયા તહેવારની સૌથી વધુ આતુરતાથી રાહ રહેતી?',
        'વડીલો કયા આશીર્વાદ અને પરંપરાગત વિધિઓ કરતા?',
        'તેમાંથી કઈ રીતો તમે આજે નવી પેઢીને શીખવી છે?',
      ],
      pa: [
        'ਬਚਪਨ ਵਿੱਚ ਤੁਸੀਂ ਕਿਸ ਤਿਉਹਾਰ ਦਾ ਸਭ ਤੋਂ ਵੱਧ ਚਾਅ ਨਾਲ ਇੰਤਜ਼ਾਰ ਕਰਦੇ ਸੀ?',
        'ਘਰ ਦੇ ਬਜ਼ੁਰਗ ਕਿਹੜੀਆਂ ਅਸੀਸਾਂ ਅਤੇ ਰੀਤਾਂ ਨਿਭਾਉਂਦੇ ਸਨ?',
        'ਉਹਨਾਂ ਵਿੱਚੋਂ ਕਿਹੜੀਆਂ ਰਵਾਇਤਾਂ ਤੁਸੀਂ ਅੱਜ ਵੀ ਆਪਣੇ ਬੱਚਿਆਂ ਨਾਲ ਸਾਂਝੀਆਂ ਕਰਦੇ ਹੋ?',
      ],
      hi: [
        'बचपन में आपको किस त्योहार का सबसे ज्यादा बेसब्री से इंतजार रहता था?',
        'बुजुर्ग कौन से रीति-रिवाज निभाते थे और क्या आशीर्वाद देते थे?',
        'उनमें से कौन से संस्कार आपने आज अपनी नई पीढ़ी को सौंपे हैं?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a picture of a family festival gathering, Diwali oil lamps, Vaisakhi feast, or Eid celebration.',
      gu: 'તહેવારના દિવસે લીધેલી કુટુંબની કોઈ જૂની તસવીર કે દીવાઓની રોશની શોધો.',
      pa: 'ਤਿਉਹਾਰ ਦੇ ਮੇਲੇ ਜਾਂ ਪਰਿਵਾਰਕ ਇਕੱਠ ਦੀ ਕੋਈ ਪੁਰਾਣੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'किसी पारिवारिक त्योहार, दीवाली के दीपों या उत्सव की कोई पुरानी तस्वीर ढूंढिए।',
    },
  },

  // ─── PART II: FORMATIVE YEARS & EARLY ECHOES (Scenes 1–4) ────────────────
  {
    id: 'spark_humour_mishap',
    category: 'humour',
    title: 'Formative Friendships',
    localizedTitles: {
      en: 'Formative Friendships',
      gu: 'રચનાત્મક મિત્રતા',
      pa: 'ਬਚਪਨ ਦੀ ਦੋਸਤੀ',
      hi: 'बचपन की दोस्ती',
    },
    linkedSceneId: 'part-2-scene-1',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Who were the closest companions of your youth, and what is the funniest mishap or mischievous adventure that still brings tears of laughter around the table?',
      gu: 'તમારી યુવાનીના સૌથી નજીકના મિત્રો કોણ હતા, અને એવો કયો રમૂજી બનાવ કે તોફાન છે જેની વાત નીકળે ત્યારે આજે પણ આખું કુટુંબ ખડખડાટ હસી પડે છે?',
      pa: 'ਤੁਹਾਡੀ ਜਵਾਨੀ ਦੇ ਸਭ ਤੋਂ ਕਰੀਬੀ ਦੋਸਤ ਕੌਣ ਸਨ, ਅਤੇ ਕਿਹੜੀ ਅਜਿਹੀ ਹਾਸੋਹੀਣੀ ਘਟਨਾ ਜਾਂ ਸ਼ਰਾਰਤ ਹੈ ਜਿਸ ਦੀ ਗੱਲ ਚੱਲਦਿਆਂ ਹੀ ਅੱਜ ਵੀ ਪੂਰਾ ਪਰਿਵਾਰ ਹੱਸ ਪੈਂਦਾ ਹੈ?',
      hi: 'आपकी युवावस्था के सबसे करीबी दोस्त कौन थे, और ऐसी कौन सी मजेदार घटना या शरारत है जिसकी बात छिड़ते ही आज भी पूरा परिवार हंस पड़ता है?',
    },
    followUpQuestions: {
      en: [
        'Who found themselves in the most comical trouble when it happened?',
        'How did your parents or elders react at the time versus how they remembered it years later?',
        'Has this light-hearted tale become an unmissable family legend?',
      ],
      gu: [
        'જ્યારે તે બનાવ બન્યો ત્યારે સૌથી વધુ મુશ્કેલીમાં કોણ મુકાયું હતું?',
        'તે સમયે વડીલોની પ્રતિક્રિયા કેવી હતી અને વર્ષો પછી તેઓ કેવી રીતે હસ્યા?',
        'શું આ રમૂજી કિસ્સો આજે કુટુંબની સૌથી જાણીતી વાર્તા બની ગયો છે?',
      ],
      pa: [
        'ਜਦੋਂ ਇਹ ਹੋਇਆ ਤਾਂ ਸਭ ਤੋਂ ਵੱਧ ਹਾਸੋਹੀਣੀ ਮੁਸ਼ਕਲ ਵਿੱਚ ਕੌਣ ਫਸਿਆ ਸੀ?',
        'ਉਸ ਵੇਲੇ ਵੱਡਿਆਂ ਦਾ ਕੀ ਪ੍ਰਤੀਕਰਮ ਸੀ ਅਤੇ ਬਾਅਦ ਵਿੱਚ ਉਹ ਇਸ \'ਤੇ ਕਿਵੇਂ ਹੱਸੇ?',
        'ਕੀ ਇਹ ਕਿੱਸਾ ਅੱਜ ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਦੀ ਪਸੰਦੀਦਾ ਕਹਾਣੀ ਬਣ ਚੁੱਕਾ ਹੈ?',
      ],
      hi: [
        'जब यह वाकया हुआ था तो सबसे ज्यादा मजेदार स्थिति में कौन फंस गया था?',
        'उस समय घर के बड़ों की क्या प्रतिक्रिया थी और बाद में वे इसे कैसे याद करके हंसे?',
        'क्या यह मजेदार किस्सा आज भी हर पारिवारिक महफिल की जान है?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a candid snapshot of your childhood friends or family sharing an unposed laugh.',
      gu: 'તમારા જૂના મિત્રો અથવા પરિવારની હાસ્યભરી પળની નિખાલસ તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਪੁਰਾਣੇ ਦੋਸਤਾਂ ਜਾਂ ਪਰਿਵਾਰ ਦੇ ਹਾਸੇ-ਮਜ਼ਾਕ ਦੀ ਕੋਈ ਪੁਰਾਣੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने पुराने दोस्तों या परिवार के किसी हंसी-मजाक के पल की कोई पुरानी तस्वीर निकालिए।',
    },
  },
  {
    id: 'spark_wisdom_hardship',
    category: 'wisdom',
    title: 'First Encounters with Hardship',
    localizedTitles: {
      en: 'First Encounters with Hardship',
      gu: 'મુશ્કેલી સાથે પ્રથમ મુલાકાત',
      pa: 'ਮੁਸ਼ਕਿਲਾਂ ਨਾਲ ਪਹਿਲਾ ਸਾਹਮਣਾ',
      hi: 'मुश्किलों से पहला सामना',
    },
    linkedSceneId: 'part-2-scene-2',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Reflect on a difficult season in your early youth that tested your strength. How did you endure it, and what quiet wisdom did it leave you with?',
      gu: 'તમારી યુવાનીના કોઈ એવા મુશ્કેલ સમયને યાદ કરો જેણે તમારી ધીરજની કસોટી લીધી. તમે તેમાંથી કેવી રીતે બહાર આવ્યા અને તેનાથી શું મૂલ્યવાન શીખવા મળ્યું?',
      pa: 'ਆਪਣੀ ਜਵਾਨੀ ਦੇ ਕਿਸੇ ਅਜਿਹੇ ਔਖੇ ਸਮੇਂ ਨੂੰ ਯਾਦ ਕਰੋ ਜਿਸ ਨੇ ਤੁਹਾਡੇ ਹੌਸਲੇ ਨੂੰ ਪਰਖਿਆ। ਤੁਸੀਂ ਉਸ ਦਾ ਸਾਹਮਣਾ ਕਿਵੇਂ ਕੀਤਾ ਅਤੇ ਉਸ ਤੋਂ ਕੀ ਸਿੱਖਿਆ ਮਿਲੀ?',
      hi: 'अपनी जवानी के किसी ऐसे कठिन दौर को याद कीजिए जिसने आपके सब्र की परीक्षा ली। आपने उस मुश्किल का सामना कैसे किया और उससे क्या सीख मिली?',
    },
    followUpQuestions: {
      en: [
        'Who stood steadfastly by your side when times were hardest?',
        'Was there a particular prayer, saying, or belief that gave you solace?',
        'How did enduring that trial reshape how you navigate life today?',
      ],
      gu: [
        'મુશ્કેલ સમયમાં કોનો સાથ તમારા માટે સૌથી મોટો સહારો બન્યો?',
        'કઈ પ્રાર્થના કે શ્રદ્ધાએ તમને આગળ વધવાની હિંમત આપી?',
        'તે અનુભવે જીવનને જોવાનો તમારો દ્રષ્ટિકોણ કેવી રીતે બદલી નાખ્યો?',
      ],
      pa: [
        'ਔਖੇ ਵੇਲੇ ਕਿਸ ਦਾ ਸਾਥ ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਵੱਡਾ ਸਹਾਰਾ ਬਣਿਆ?',
        'ਕਿਹੜੀ ਅਰਦਾਸ ਜਾਂ ਵਿਸ਼ਵਾਸ ਨੇ ਤੁਹਾਨੂੰ ਡੋਲਣ ਨਹੀਂ ਦਿੱਤਾ?',
        'ਉਸ ਤਜਰਬੇ ਨੇ ਜ਼ਿੰਦਗੀ ਨੂੰ ਦੇਖਣ ਦਾ ਤੁਹਾਡਾ ਨਜ਼ਰੀਆ ਕਿਵੇਂ ਬਦਲਿਆ?',
      ],
      hi: [
        'उस मुश्किल घड़ी में किसका साथ आपकी सबसे बड़ी ताकत बना?',
        'किस प्रार्थना या विश्वास ने आपको हिम्मत बनाए रखने की प्रेरणा दी?',
        'उस अनुभव ने जिंदगी को देखने का आपका नजरिया कैसे बदल दिया?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find a photograph from the era or decade when you overcame your greatest personal hurdle.',
      gu: 'તે સમયગાળાની કોઈ તસવીર શોધો જ્યારે તમે જીવનનો સૌથી મોટો પડકાર પાર કર્યો હતો.',
      pa: 'ਉਸ ਦਹਾਕੇ ਦੀ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ ਜਦੋਂ ਤੁਸੀਂ ਜ਼ਿੰਦਗੀ ਦੀ ਵੱਡੀ ਚੁਣੌਤੀ ਨੂੰ ਪਾਰ ਕੀਤਾ ਸੀ।',
      hi: 'उस दौर की कोई तस्वीर तलाशिए जब आपने अपनी सबसे बड़ी चुनौती को पार किया था।',
    },
  },
  {
    id: 'spark_lessons_vocation',
    category: 'lessons',
    title: 'Crossroads and Choices',
    localizedTitles: {
      en: 'Crossroads and Choices',
      gu: 'આંતરછેદ અને પસંદગીઓ',
      pa: 'ਚੌਰਾਹੇ ਅਤੇ ਫੈਸਲੇ',
      hi: 'मोड़ और फैसले',
    },
    linkedSceneId: 'part-2-scene-3',
    suggestedMediaMode: 'video',
    sparks: {
      en: 'Walk us through your very first job, craft, or pivotal life crossroads. What did it feel like to earn your first wages, and what discipline did that work instil in you?',
      gu: 'તમારી પ્રથમ નોકરી, ધંધા કે જીવનના મહત્વના નિર્ણય વિશે વાત કરો. જ્યારે પહેલી કમાણી હાથમાં આવી ત્યારે કેવો ગર્વ થયો હતો, અને તે કામથી તમને શું મૂલ્યવાન બોધ મળ્યો?',
      pa: 'ਆਪਣੀ ਪਹਿਲੀ ਨੌਕਰੀ, ਕੰਮ-ਕਾਰ ਜਾਂ ਜ਼ਿੰਦਗੀ ਦੇ ਅਹਿਮ ਮੋੜ ਬਾਰੇ ਦੱਸੋ। ਜਦੋਂ ਪਹਿਲੀ ਕਮਾਈ ਹੱਥ ਵਿੱਚ ਆਈ ਤਾਂ ਕਿਹੋ ਜਿਹਾ ਅਹਿਸਾਸ ਹੋਇਆ ਸੀ, ਅਤੇ ਉਸ ਕੰਮ ਨੇ ਤੁਹਾਨੂੰ ਕੀ ਸਿਖਾਇਆ?',
      hi: 'अपनी पहली नौकरी, काम-धंधे या जीवन के अहम फैसले के बारे में बताइए। जब पहली कमाई हाथ में आई थी तो कैसा गर्व महसूस हुआ था, और उस मेहनत ने आपको क्या सिखाया?',
    },
    followUpQuestions: {
      en: [
        'What was the very first thing you purchased with your own hard-earned money?',
        'Who mentored you or demonstrated the principles of honourable work?',
        'What guidance about honest labour would you share with young people today?',
      ],
      gu: [
        'તમે તમારી પ્રથમ કમાણીમાંથી સૌથી પહેલી કઈ વસ્તુ ખરીદી હતી?',
        'તમને કામ શીખવનાર કે પ્રામાણિકતાનો માર્ગ બતાવનાર ગુરુ કોણ હતા?',
        'આજના યુવાનોને મહેનત અને લગન વિશે તમે શું માર્ગદર્શન આપશો?',
      ],
      pa: [
        'ਤੁਸੀਂ ਆਪਣੀ ਪਹਿਲੀ ਕਮਾਈ ਨਾਲ ਸਭ ਤੋਂ ਪਹਿਲੀ ਚੀਜ਼ ਕੀ ਖ਼ਰੀਦੀ ਸੀ?',
        'ਕਿਸ ਨੇ ਤੁਹਾਨੂੰ ਕੰਮ ਦੇ ਗੁਰ ਸਿਖਾਏ ਅਤੇ ਤੁਹਾਡਾ ਮਾਰਗਦਰਸ਼ਨ ਕੀਤਾ?',
        'ਅੱਜ ਦੇ ਨੌਜਵਾਨਾਂ ਨੂੰ ਮਿਹਨਤ ਅਤੇ ਇਮਾਨਦਾਰੀ ਬਾਰੇ ਤੁਸੀਂ ਕੀ ਨਸੀਹਤ ਦੇਵੋਗੇ?',
      ],
      hi: [
        'अपनी पहली कमाई से आपने सबसे पहली चीज क्या खरीदी थी?',
        'आपको काम सिखाने वाले और सही रास्ता दिखाने वाले गुरु कौन थे?',
        'आज की युवा पीढ़ी को ईमानदारी और लगन के बारे में आप क्या सीख देंगे?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find an early photograph of your workplace, shopfront, desk, or work uniform.',
      gu: 'તમારા કાર્યસ્થળની, દુકાનની, ડેસ્કની કે શરૂઆતના કામકાજના સમયની કોઈ તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਕੰਮ ਵਾਲੀ ਥਾਂ, ਦੁਕਾਨ ਜਾਂ ਸ਼ੁਰੂਆਤੀ ਕੰਮ-ਕਾਰ ਦੀ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने काम करने की जगह, दफ्तर, दुकान या उस दौर की कोई यादगार तस्वीर तलाशिए।',
    },
  },
  {
    id: 'spark_learning_hard_way',
    category: 'lessons',
    title: 'Learning the Hard Way',
    localizedTitles: {
      en: 'Learning the Hard Way',
      gu: 'અઘરી રીતે શીખવું',
      pa: 'ਮੁਸ਼ਕਿਲ ਰਾਹਾਂ ਤੋਂ ਸਿੱਖਿਆ',
      hi: 'कठिन राहों से सीख',
    },
    linkedSceneId: 'part-2-scene-4',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Reflect on a setback, misstep, or hard mistake from your youth. What did that experience teach you about character, humility, and resilience?',
      gu: 'તમારી યુવાનીની કોઈ મુશ્કેલ ભૂલ કે પડકારને યાદ કરો. તે કડવા અનુભવે તમને નમ્રતા, હિંમત અને જીવન વિશે શું મૂલ્યવાન પાઠ શીખવ્યો?',
      pa: 'ਆਪਣੀ ਜਵਾਨੀ ਦੀ ਕਿਸੇ ਗਲਤੀ ਜਾਂ ਔਖੇ ਸਮੇਂ ਨੂੰ ਯਾਦ ਕਰੋ। ਉਸ ਤਜਰਬੇ ਨੇ ਤੁਹਾਨੂੰ ਹੌਸਲਾ ਅਤੇ ਜ਼ਿੰਦਗੀ ਬਾਰੇ ਕੀ ਸਿਖਾਇਆ?',
      hi: 'अपनी युवावस्था की किसी कठिन भूल या चुनौती को याद कीजिए। उस अनुभव ने आपको विनम्रता, धैर्य और जीवन के बारे में क्या सिखाया?',
    },
    followUpQuestions: {
      en: [
        'How did you make amends or pick yourself back up after that mistake?',
        'Who offered you forgiveness or understanding when you needed it most?',
        'How did that hard lesson protect you from greater pitfalls later in life?',
      ],
      gu: [
        'તે ભૂલ પછી તમે પરિસ્થિતિને કેવી રીતે સંભાળી અને ફરી બેઠા થયા?',
        'જ્યારે તમને સૌથી વધુ જરૂર હતી ત્યારે કોણે તમને માફી અને સહારો આપ્યો?',
        'તે કડવા અનુભવે પાછળથી તમને કેવી રીતે મોટી મુશ્કેલીઓથી બચાવ્યા?',
      ],
      pa: [
        'ਉਸ ਗਲਤੀ ਤੋਂ ਬਾਅਦ ਤੁਸੀਂ ਆਪਣੇ ਆਪ ਨੂੰ ਕਿਵੇਂ ਸੰਭਾਲਿਆ ਅਤੇ ਦੁਬਾਰਾ ਖੜ੍ਹੇ ਹੋਏ?',
        'ਕਿਸ ਨੇ ਤੁਹਾਨੂੰ ਮੁਆਫ਼ ਕੀਤਾ ਅਤੇ ਹੌਸਲਾ ਦਿੱਤਾ?',
        'ਉਸ ਸਬਕ ਨੇ ਜ਼ਿੰਦਗੀ ਦੇ ਅਗਲੇ ਸਫ਼ਰ ਵਿੱਚ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕੀਤੀ?',
      ],
      hi: [
        'उस गलती के बाद आपने खुद को कैसे संभाला और दोबारा शुरुआत की?',
        'जब आपको सबसे ज्यादा जरूरत थी तब किसने आपको माफ किया और सहारा दिया?',
        'उस कड़वे अनुभव ने आगे चलकर आपको बड़ी मुश्किलों से कैसे बचाया?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a photograph from the time of that turning point or the place where you resolved to begin anew.',
      gu: 'તે વળાંકના સમયની અથવા જ્યાંથી તમે નવી શરૂઆત કરી તે સ્થળની કોઈ તસવીર શોધો.',
      pa: 'ਉਸ ਮੋੜ ਵੇਲੇ ਦੀ ਜਾਂ ਉਸ ਥਾਂ ਦੀ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ ਜਿੱਥੋਂ ਤੁਸੀਂ ਨਵੀਂ ਸ਼ੁਰੂਆਤ ਕੀਤੀ ਸੀ।',
      hi: 'उस मोड़ के समय की या उस जगह की कोई तस्वीर तलाशिए जहां से आपने नई शुरुआत की थी।',
    },
  },

  // ─── PART III: LOVE, PARTNERSHIP & COMMITMENT (Scenes 1–4) ───────────────
  {
    id: 'spark_journeys',
    category: 'roots',
    title: 'Journeys Within and Without',
    localizedTitles: {
      en: 'Journeys Within and Without',
      gu: 'અંદર અને બહારની મુસાફરી',
      pa: 'ਅੰਦਰੂਨੀ ਅਤੇ ਬਾਹਰੀ ਯਾਤਰਾਵਾਂ',
      hi: 'भीतरी और बाहरी यात्राएं',
    },
    linkedSceneId: 'part-3-scene-1',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Describe your first significant journeys, educational transitions, or voyages away from home. How did travelling broaden your understanding of the world and yourself?',
      gu: 'ઘરથી દૂર થયેલી તમારી પ્રથમ મહત્વની મુસાફરી કે અભ્યાસ વિશે જણાવો. તે પ્રવાસે તમારા વિશ્વ અને તમારી જાત વિશેના દ્રષ્ટિકોણને કેવી રીતે બદલ્યો?',
      pa: 'ਘਰ ਤੋਂ ਦੂਰ ਹੋਈਆਂ ਆਪਣੀਆਂ ਪਹਿਲੀਆਂ ਅਹਿਮ ਯਾਤਰਾਵਾਂ ਜਾਂ ਪੜ੍ਹਾਈ ਬਾਰੇ ਦੱਸੋ। ਉਸ ਸਫ਼ਰ ਨੇ ਤੁਹਾਡੀ ਸੋਚ ਨੂੰ ਕਿਵੇਂ ਵਿਸ਼ਾਲ ਕੀਤਾ?',
      hi: 'घर से दूर की गई अपनी पहली महत्वपूर्ण यात्रा या पढ़ाई के दौर के बारे में बताइए। उस सफर ने दुनिया और खुद को देखने का आपका नजरिया कैसे बदला?',
    },
    followUpQuestions: {
      en: [
        'What was the scent, sound, or atmosphere of that unfamiliar place?',
        'Who was an unexpected stranger or friend who helped you find your bearings?',
        'What did you carry in your suitcase that kept you tethered to home?',
      ],
      gu: [
        'તે નવી જગ્યાની સુગંધ, વાતાવરણ કે અવાજ કેવો હતો?',
        'કોઈ અજાણ્યા વ્યક્તિ કે મિત્રે તમને નવી જગ્યાએ કેવી રીતે મદદ કરી?',
        'ઘરની યાદ અપાવતી કઈ વસ્તુ તમે હંમેશા તમારી સાથે રાખતા?',
      ],
      pa: [
        'ਉਸ ਅਣਜਾਣ ਸ਼ਹਿਰ ਜਾਂ ਥਾਂ ਦਾ ਮਾਹੌਲ ਕਿਹੋ ਜਿਹਾ ਸੀ?',
        'ਕਿਸੇ ਅਜਨਬੀ ਜਾਂ ਨਵੇਂ ਦੋਸਤ ਨੇ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕੀਤੀ?',
        'ਘਰ ਦੀ ਯਾਦ ਦਿਵਾਉਣ ਵਾਲੀ ਕਿਹੜੀ ਚੀਜ਼ ਤੁਹਾਡੇ ਬੈਗ ਵਿੱਚ ਹੁੰਦੀ ਸੀ?',
      ],
      hi: [
        'उस नए शहर या जगह का माहौल और रंग-ढंग कैसा था?',
        'किस नए दोस्त या अजनबी ने नए माहौल में आपका सहारा दिया?',
        'घर की याद ताजा रखने वाली कौन सी चीज आप हमेशा साथ रखते थे?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for an old travel ticket, postcard, or photograph from your first voyage away from home.',
      gu: 'તમારી પ્રથમ મુસાફરીની જૂની ટિકિટ, પોસ્ટકાર્ડ કે તે સમયની કોઈ તસવીર શોધો.',
      pa: 'ਘਰੋਂ ਬਾਹਰ ਪਹਿਲੇ ਸਫ਼ਰ ਦੀ ਕੋਈ ਟਿਕਟ, ਪੋਸਟਕਾਰਡ ਜਾਂ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'घर से दूर अपने पहले सफर का कोई टिकट, पोस्टकार्ड या उस दौर की तस्वीर निकालिए।',
    },
  },
  {
    id: 'spark_facing_reality',
    category: 'lessons',
    title: 'Facing Reality',
    localizedTitles: {
      en: 'Facing Reality',
      gu: 'વાસ્તવિકતાનો સામનો કરવો',
      pa: 'ਅਸਲੀਅਤ ਦਾ ਸਾਹਮਣਾ',
      hi: 'हकीकत का सामना',
    },
    linkedSceneId: 'part-3-scene-2',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'What was the moment you stepped into full independence—managing your own household, paying your own way, and realising you held your future in your own hands?',
      gu: 'તમે સંપૂર્ણ સ્વનિર્ભર બન્યા તે ક્ષણ કઈ હતી—પોતાનું ઘર સંભાળવું, પોતાના ખર્ચા ઉઠાવવા અને સમજવું કે તમારું ભવિષ્ય હવે તમારા જ હાથમાં છે?',
      pa: 'ਉਹ ਪਲ ਕਿਹੜਾ ਸੀ ਜਦੋਂ ਤੁਸੀਂ ਪੂਰੀ ਤਰ੍ਹਾਂ ਆਤਮ-ਨਿਰਭਰ ਹੋਏ—ਆਪਣਾ ਘਰ ਸੰਭਾਲਿਆ ਅਤੇ ਮਹਿਸੂਸ ਕੀਤਾ ਕਿ ਭਵਿੱਖ ਤੁਹਾਡੇ ਆਪਣੇ ਹੱਥਾਂ ਵਿੱਚ ਹੈ?',
      hi: 'वह पल कौन सा था जब आप पूरी तरह अपने पैरों पर खड़े हुए—अपने दम पर घर संभालना और यह एहसास होना कि आपकी किस्मत आपके ही हाथों में है?',
    },
    followUpQuestions: {
      en: [
        'What was the sound or feeling of holding the keys to your very first independent home?',
        'What unexpected reality of adult life caught you off-guard at first?',
        'Who congratulated you on taking that great step into adulthood?',
      ],
      gu: [
        'તમારા પોતાના પ્રથમ ઘરની ચાવી હાથમાં લીધી ત્યારે કેવો અહેસાસ થયો?',
        'પુખ્ત જીવનની કઈ જવાબદારી શરૂઆતમાં સૌથી વધુ અઘરી લાગી?',
        'સ્વતંત્રતાના તે પગલા પર કોણે તમને સૌથી વધુ શાબાશી આપી?',
      ],
      pa: [
        'ਆਪਣੇ ਪਹਿਲੇ ਘਰ ਦੀਆਂ ਚਾਬੀਆਂ ਫੜ ਕੇ ਕਿਹੋ ਜਿਹਾ ਮਹਿਸੂਸ ਹੋਇਆ ਸੀ?',
        'ਜ਼ਿੰਦਗੀ ਦੀ ਕਿਹੜੀ ਜ਼ਿੰਮੇਵਾਰੀ ਨੇ ਸ਼ੁਰੂ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਹੈਰਾਨ ਕੀਤਾ?',
        'ਉਸ ਕਦਮ \'ਤੇ ਪਰਿਵਾਰ ਦੇ ਕਿਸ ਜੀਅ ਨੇ ਤੁਹਾਡਾ ਹੌਸਲਾ ਵਧਾਇਆ?',
      ],
      hi: [
        'अपने पहले घर की चाबी हाथ में लेते समय कैसा गौरव महसूस हुआ?',
        'गृहस्थी और जिम्मेदारियों की कौन सी बात शुरुआत में सबसे कठिन लगी?',
        'आपके इस कदम पर परिवार में किसने सबसे ज्यादा खुशी जताई?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a picture of your first apartment, rented room, front door, or early household possessions.',
      gu: 'તમારા પ્રથમ મકાનની, ઓરડાની કે ઘરની શરૂઆતની કોઈ તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਪਹਿਲੇ ਮਕਾਨ, ਕਮਰੇ ਜਾਂ ਘਰ ਦੇ ਦਰਵਾਜ਼ੇ ਦੀ ਕੋਈ ਪੁਰਾਣੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने पहले घर, किराये के कमरे या गृहस्थी की शुरुआत की कोई पुरानी तस्वीर तलाशिए।',
    },
  },
  {
    id: 'spark_love_partner',
    category: 'love',
    title: 'Falling in Love',
    localizedTitles: {
      en: 'Falling in Love',
      gu: 'પ્રેમમાં પડવું',
      pa: 'ਪਿਆਰ ਵਿੱਚ ਪੈਣਾ',
      hi: 'प्यार में पड़ना',
    },
    linkedSceneId: 'part-3-scene-3',
    suggestedMediaMode: 'video',
    sparks: {
      en: 'Tell the story of how you and your partner first crossed paths. Was it arranged by family or a serendipitous meeting, and what first caught your eye?',
      gu: 'તમારા જીવનસાથી સાથે તમારી પ્રથમ મુલાકાત કેવી રીતે થઈ? શું તે વડીલો દ્વારા નક્કી થયેલો સંબંધ હતો કે અચાનક થયેલી મુલાકાત, અને કઈ વાત ગમી ગઈ હતી?',
      pa: 'ਆਪਣੇ ਜੀਵਨ ਸਾਥੀ ਨਾਲ ਆਪਣੀ ਪਹਿਲੀ ਮੁਲਾਕਾਤ ਦੀ ਕਹਾਣੀ ਸੁਣਾਓ। ਕੀ ਇਹ ਪਰਿਵਾਰ ਵੱਲੋਂ ਤੈਅ ਸੀ ਜਾਂ ਕੋਈ ਅਚਾਨਕ ਮਿਲਣਾ, ਅਤੇ ਕਿਹੜੀ ਗੱਲ ਦਿਲ ਨੂੰ ਭਾਈ?',
      hi: 'अपने जीवनसाथी से अपनी पहली मुलाकात का किस्सा सुनाइए। क्या यह परिवार की रजामंदी से तय हुआ था या कोई इत्तेफाक था, और पहली नजर में क्या पसंद आया था?',
    },
    followUpQuestions: {
      en: [
        'What were you wearing the day you first laid eyes on each other?',
        'What do you remember most vividly about your wedding day celebrations?',
        'What mutual understanding has kept your bond resilient through all the decades?',
      ],
      gu: [
        'પ્રથમ મુલાકાતના દિવસે તમે કેવા વસ્ત્રો પહેર્યા હતા?',
        'લગ્નના ઉત્સવ અને મંગળ ફેરાની કઈ ક્ષણ સૌથી વધુ યાદ છે?',
        'આટલા લાંબા લગ્નજીવનમાં કઈ પરસ્પર સમજણથી તમારો સંબંધ અતૂટ રહ્યો?',
      ],
      pa: [
        'ਜਦੋਂ ਤੁਸੀਂ ਪਹਿਲੀ ਵਾਰ ਮਿਲੇ ਤਾਂ ਤੁਹਾਨੂੰ ਸਭ ਤੋਂ ਖ਼ਾਸ ਕੀ ਲੱਗਿਆ ਸੀ?',
        'ਵਿਆਹ ਵਾਲੇ ਦਿਨ ਅਤੇ ਆਨੰਦ ਕਾਰਜ ਦੀ ਕਿਹੜੀ ਗੱਲ ਅੱਜ ਵੀ ਯਾਦ ਆਉਂਦੀ ਹੈ?',
        'ਤੁਹਾਡੇ ਪਿਆਰ ਅਤੇ ਸਤਿਕਾਰ ਦਾ ਸਭ ਤੋਂ ਵੱਡਾ ਰਾਜ਼ ਕੀ ਰਿਹਾ ਹੈ?',
      ],
      hi: [
        'पहली मुलाकात के वक्त कौन सी बात आपके दिल को छू गई थी?',
        'शादी के दिन और सात फेरों की कौन सी याद आज भी सबसे ज्यादा ताजा है?',
        'इतने वर्षों के सफर में किस आपसी समझ ने आपके रिश्ते को अटूट बनाए रखा?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for your wedding photograph or an early black-and-white portrait of the two of you together.',
      gu: 'તમારા લગ્ન પ્રસંગની અથવા સાથેની શરૂઆતની કોઈ પ્રિય બ્લેક એન્ડ વ્હાઇટ તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਵਿਆਹ ਦੀ ਜਾਂ ਦੋਵਾਂ ਦੀ ਇਕੱਠਿਆਂ ਦੀ ਕੋਈ ਸ਼ੁਰੂਆਤੀ ਬਲੈਕ ਐਂਡ ਵ੍ਹਾਈਟ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपनी शादी की या आप दोनों की साथ में ली गई कोई पुरानी ब्लैक एंड व्हाइट तस्वीर निकालिए।',
    },
  },
  {
    id: 'spark_birth_children',
    category: 'love',
    title: 'The Birth of Children',
    localizedTitles: {
      en: 'The Birth of Children',
      gu: 'બાળકોનો જન્મ',
      pa: 'ਬੱਚਿਆਂ ਦਾ ਜਨਮ',
      hi: 'बच्चों का जन्म',
    },
    linkedSceneId: 'part-3-scene-4',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Describe the profound transformation of stepping into the role of parent. What did you feel holding your firstborn child for the very first time?',
      gu: 'માતા-પિતા બનવાની તે પરિવર્તનકારી ક્ષણનું વર્ણન કરો. તમારા પ્રથમ બાળકને પહેલીવાર ખોળામાં લીધું ત્યારે કેવો અલૌકિક અનુભવ થયો હતો?',
      pa: 'ਮਾਤਾ-ਪਿਤਾ ਬਣਨ ਦੇ ਉਸ ਖ਼ੂਬਸੂਰਤ ਅਹਿਸਾਸ ਨੂੰ ਬਿਆਨ ਕਰੋ। ਆਪਣੇ ਪਹਿਲੇ ਬੱਚੇ ਨੂੰ ਪਹਿਲੀ ਵਾਰ ਗੋਦੀ ਵਿੱਚ ਲੈਂਦਿਆਂ ਮਨ ਵਿੱਚ ਕੀ ਭਾਵਨਾਵਾਂ ਆਈਆਂ ਸਨ?',
      hi: 'माता-पिता बनने के उस गहरे बदलाव को याद कीजिए। अपने पहले बच्चे को पहली बार गोद में लेते समय दिल में क्या भाव उमड़े थे?',
    },
    followUpQuestions: {
      en: [
        'What was the aroma or tiny weight of holding your newborn baby?',
        'How did your daily priorities and worldview change overnight?',
        'What blessing or lullaby did you whisper over their cradle?',
      ],
      gu: [
        'નવજાત બાળકને ખોળામાં લેતાં કેવો સુગંધી અને નાજુક અહેસાસ થયો?',
        'તમારી દૈનિક પ્રાથમિકતાઓ અને જીવન કેવી રીતે એક રાતમાં બદલાઈ ગયા?',
        'તમે પારણાં પાસે બાળકને કઈ હાલરડું કે આશીર્વાદ આપ્યા?',
      ],
      pa: [
        'ਨਵਜੰਮੇ ਬੱਚੇ ਨੂੰ ਗੋਦੀ ਵਿੱਚ ਲੈਂਦਿਆਂ ਕਿਹੋ ਜਿਹਾ ਅਹਿਸਾਸ ਹੋਇਆ ਸੀ?',
        'ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਅਤੇ ਜ਼ਿੰਮੇਵਾਰੀਆਂ ਕਿਵੇਂ ਇਕਦਮ ਬਦਲ ਗਈਆਂ?',
        'ਤੁਸੀਂ ਪੰਘੂੜੇ ਕੋਲ ਬੈਠ ਕੇ ਕਿਹੜੀ ਲੋਰੀ ਗਾਈ ਸੀ?',
      ],
      hi: [
        'नवजात शिशु को सीने से लगाते वक्त कैसा पावन एहसास हुआ था?',
        'एक बच्चे के आने से आपकी जिंदगी और सोच कैसे पूरी तरह बदल गई?',
        'झूले के पास आपने कौन सी लोरी या दुआ सुनाई थी?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find an early hospital portrait, baby album print, or snapshot of you holding your newborn child.',
      gu: 'બાળકના જન્મ સમયની, હોસ્પિટલની અથવા ખોળામાં લીધેલા બાળકની કોઈ જૂની તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਨਵਜੰਮੇ ਬੱਚੇ ਨੂੰ ਗੋਦ ਵਿੱਚ ਲਈ ਦੀ ਕੋਈ ਪੁਰਾਣੀ ਯਾਦਗਾਰੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने नवजात बच्चे को गोद में लिए हुए उस दौर की कोई अनमोल तस्वीर तलाशिए।',
    },
  },

  // ─── PART IV: TRIALS, TRIUMPHS & MILESTONES (Scenes 1–4) ─────────────────
  {
    id: 'spark_trials_holding_on',
    category: 'wisdom',
    title: 'Holding On and Letting Go',
    localizedTitles: {
      en: 'Holding On and Letting Go',
      gu: 'પકડી રાખવું અને છોડી દેવું',
      pa: 'ਸੰਭਾਲਣਾ ਅਤੇ ਛੱਡਣਾ',
      hi: 'थामे रखना और जाने देना',
    },
    linkedSceneId: 'part-4-scene-1',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Reflect on a season when you faced an agonizing dilemma—navigating family storms, financial strain, or knowing when to hold on and when to let go.',
      gu: 'એવા સમયને યાદ કરો જ્યારે તમારે મુશ્કેલ નિર્ણય લેવો પડ્યો—પારિવારિક મુશ્કેલીઓ, આર્થિક સંકડામણ કે ક્યારે પકડી રાખવું અને ક્યારે જતું કરવું.',
      pa: 'ਕਿਸੇ ਅਜਿਹੇ ਦੌਰ ਨੂੰ ਯਾਦ ਕਰੋ ਜਦੋਂ ਜ਼ਿੰਦਗੀ ਨੇ ਔਖੀ ਚੋਣ ਸਾਹਮਣੇ ਰੱਖੀ—ਕਦੋਂ ਸਬਰ ਨਾਲ ਸੰਭਾਲਣਾ ਸੀ ਅਤੇ ਕਦੋਂ ਗੱਲ ਛੱਡ ਦੇਣੀ ਸੀ।',
      hi: 'जिंदगी के उस दौर को याद कीजिए जब आपको कठिन फैसला लेना पड़ा—पारिवारिक मुश्किलें, आर्थिक तंगी या यह जानना कि कब थामे रखना है और कब जाने देना है।',
    },
    followUpQuestions: {
      en: [
        'What gave you the quiet clarity to make peace with your choice?',
        'Who stood faithfully by your side when the outcome was uncertain?',
        'Looking back, how did letting go create room for new blessings?',
      ],
      gu: [
        'તે નિર્ણય લેવા માટે તમને ક્યાંથી આંતરિક શાંતિ અને સ્પષ્ટતા મળી?',
        'પરિણામ અજાણ્યું હતું ત્યારે કોણ તમારી સાથે અડગ ઊભું રહ્યું?',
        'પાછળ જોતાં, તે વાત જતી કરવાથી તમારા જીવનમાં કઈ નવી સારી બાબતો આવી?',
      ],
      pa: [
        'ਉਸ ਫੈਸਲੇ ਨਾਲ ਸ਼ਾਂਤੀ ਪਾਉਣ ਦੀ ਤਾਕਤ ਤੁਹਾਨੂੰ ਕਿੱਥੋਂ ਮਿਲੀ?',
        'ਔਖੇ ਵੇਲੇ ਕਿਸ ਇਨਸਾਨ ਨੇ ਤੁਹਾਡੇ ਨਾਲ ਖੜ੍ਹ ਕੇ ਸਾਥ ਨਿਭਾਇਆ?',
        'ਅੱਜ ਪਿੱਛੇ ਮੁੜ ਕੇ ਦੇਖਿਆਂ, ਉਸ ਫੈਸਲੇ ਨੇ ਜ਼ਿੰਦਗੀ ਨੂੰ ਕਿਵੇਂ ਬਚਾਇਆ?',
      ],
      hi: [
        'उस कठिन फैसले को स्वीकार करने की हिम्मत आपको कहां से मिली?',
        'जब मंजिल धुंधली थी, तब किसने बिना शर्त आपका साथ दिया?',
        'आज मुड़कर देखने पर, उस फैसले ने आपके जीवन को कैसे एक नई दिशा दी?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find a photograph from the year or decade you navigated that heavy crossroads.',
      gu: 'તે મુશ્કેલ વળાંકના સમયની કોઈ પારિવારિક કે અંગત તસવીર શોધો.',
      pa: 'ਉਸ ਦੌਰ ਦੀ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ ਜਦੋਂ ਤੁਸੀਂ ਜ਼ਿੰਦਗੀ ਦੇ ਔਖੇ ਇਮਤਿਹਾਨ ਵਿੱਚੋਂ ਲੰਘੇ ਸੀ।',
      hi: 'उस दौर की कोई तस्वीर तलाशिए जब आप जीवन की किसी बड़ी अग्नि-परीक्षा से गुजरे थे।',
    },
  },
  {
    id: 'spark_trials_test_of_fire',
    category: 'wisdom',
    title: 'The Test of Fire',
    localizedTitles: {
      en: 'The Test of Fire',
      gu: 'અગ્નિ પરીક્ષા',
      pa: 'ਅੱਗ ਦੀ ਪ੍ਰੀਖਿਆ',
      hi: 'अग्नि परीक्षा',
    },
    linkedSceneId: 'part-4-scene-2',
    suggestedMediaMode: 'video',
    sparks: {
      en: 'Describe a moment that pushed you to your absolute limits. What deep struggle tested your faith, and how did you rise again from the ashes?',
      gu: 'એવી ક્ષણનું વર્ણન કરો જેણે તમારી ક્ષમતાની આખરી સીમા ચકાસી. કયા સંઘર્ષે તમારી શ્રદ્ધાની પરીક્ષા લીધી, અને તમે ફરી કેવી રીતે બેઠા થયા?',
      pa: 'ਕਿਸੇ ਅਜਿਹੇ ਪਲ ਬਾਰੇ ਦੱਸੋ ਜਿਸ ਨੇ ਤੁਹਾਡੇ ਸਬਰ ਨੂੰ ਆਖਰੀ ਹੱਦ ਤੱਕ ਪਰਖਿਆ। ਕਿਸ ਸੰਘਰਸ਼ ਨੇ ਤੁਹਾਡੀ ਅਸਲ ਤਾਕਤ ਜਗਾਈ, ਅਤੇ ਤੁਸੀਂ ਦੁਬਾਰਾ ਕਿਵੇਂ ਉੱਠੇ?',
      hi: 'उस पल का बयान कीजिए जिसने आपकी सहनशक्ति की अंतिम परीक्षा ली। किस गहरे संघर्ष ने आपके विश्वास को परखा, और आप कैसे दोबारा उठ खड़े हुए?',
    },
    followUpQuestions: {
      en: [
        'What was the darkest hour of that struggle, and what morning brought the first ray of hope?',
        'What inner reservoir of strength did you discover that you never knew you possessed?',
        'What would you say to someone walking through that very same fire today?',
      ],
      gu: [
        'તે સંઘર્ષની સૌથી કાળી રાત કઈ હતી, અને આશાનું પ્રથમ કિરણ ક્યારે દેખાયું?',
        'તમારામાં કઈ એવી છુપી શક્તિ પ્રગટ થઈ જેની તમને અગાઉ ખબર નહોતી?',
        'આજે જો કોઈ વ્યક્તિ એવા જ સંકટમાંથી પસાર થતી હોય, તો તમે તેને શું સલાહ આપશો?',
      ],
      pa: [
        'ਉਸ ਸੰਘਰਸ਼ ਦੀ ਸਭ ਤੋਂ ਔਖੀ ਘੜੀ ਕਿਹੜੀ ਸੀ ਅਤੇ ਆਸ ਦੀ ਪਹਿਲੀ ਕਿਰਨ ਕਦੋਂ ਦਿਸੀ?',
        'ਤੁਹਾਡੇ ਅੰਦਰੋਂ ਕਿਹੜਾ ਅਜਿਹਾ ਹੌਸਲਾ ਨਿਕਲਿਆ ਜਿਸ ਦਾ ਤੁਹਾਨੂੰ ਖੁਦ ਪਤਾ ਨਹੀਂ ਸੀ?',
        'ਅੱਜ ਉਸੇ ਰਾਹ \'ਤੇ ਚੱਲ ਰਹੇ ਕਿਸੇ ਇਨਸਾਨ ਨੂੰ ਤੁਸੀਂ ਕੀ ਧੀਰਜ ਬੰਨ੍ਹਾਓਗੇ?',
      ],
      hi: [
        'उस संघर्ष की सबसे कठिन घड़ी कौन सी थी और उम्मीद की पहली किरण कब दिखाई दी?',
        'अपने अंदर की कौन सी ऐसी छिपी ताकत आपने पहचानी जो पहले कभी महसूस नहीं हुई थी?',
        'आज अगर कोई उसी मुश्किल दौर से गुजर रहा हो, तो आप उसे क्या ढाढ़स बंधाएंगे?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a picture of you smiling after that trial had passed, standing strong once more.',
      gu: 'તે કટોકટી પાર કર્યા પછી ફરી સ્વસ્થ અને હસતા ચહેરા સાથેની કોઈ તસવીર શોધો.',
      pa: 'ਉਸ ਮੁਸ਼ਕਲ ਦੇ ਹੱਲ ਹੋਣ ਤੋਂ ਬਾਅਦ ਦੀ ਮੁਸਕਰਾਉਂਦੀ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'उस तूफान के थमने के बाद, फिर से मुस्कुराते और संभलते चेहरे की कोई तस्वीर निकालिए।',
    },
  },
  {
    id: 'spark_faith_invisible',
    category: 'roots',
    title: 'Faith in the Invisible',
    localizedTitles: {
      en: 'Faith in the Invisible',
      gu: 'અદ્રશ્યમાં વિશ્વાસ',
      pa: 'ਅਣਦੇਖੇ \'ਤੇ ਵਿਸ਼ਵਾਸ',
      hi: 'अदृश्य पर विश्वास',
    },
    linkedSceneId: 'part-4-scene-3',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'What is your relationship with faith, prayer, and the unseen? Describe the sacred rituals, quiet contemplation, or spiritual truths that have anchored your soul.',
      gu: 'શ્રદ્ધા, પ્રાર્થના અને પરમાત્મા સાથેનો તમારો સંબંધ કેવો રહ્યો છે? એવા પવિત્ર નિયમો, શાંત ચિંતન કે આધ્યાત્મિક સત્યો જણાવો જેણે તમારા આત્માને શાંતિ આપી.',
      pa: 'ਅਰਦਾਸ, ਸ਼ਰਧਾ ਅਤੇ ਅਕਾਲ ਪੁਰਖ ਨਾਲ ਤੁਹਾਡਾ ਰਿਸ਼ਤਾ ਕਿਹੋ ਜਿਹਾ ਰਿਹਾ ਹੈ? ਉਹਨਾਂ ਪਵਿੱਤਰ ਰੀਤਾਂ ਅਤੇ ਸੱਚ ਬਾਰੇ ਦੱਸੋ ਜਿਨ੍ਹਾਂ ਨੇ ਤੁਹਾਡੇ ਮਨ ਨੂੰ ਟਿਕਾਅ ਦਿੱਤਾ।',
      hi: 'प्रार्थना, आस्था और ईश्वर के साथ आपका रिश्ता कैसा रहा है? उन पावन संस्कारों, शांत चिंतन या आध्यात्मिक विश्वासों का वर्णन कीजिए जो आपके जीवन का आधार बने।',
    },
    followUpQuestions: {
      en: [
        'Was there a prayer or sacred text you recited when everything felt fragile?',
        'What place of worship or natural sanctuary has given you the deepest peace?',
        'How has your spiritual understanding deepened as the decades passed?',
      ],
      gu: [
        'જ્યારે બધું મુશ્કેલ લાગતું ત્યારે તમે કઈ પ્રાર્થના કે મંત્રનું રટણ કરતા?',
        'કયા ધર્મસ્થાન કે પ્રકૃતિના ખોળે તમને સૌથી ઊંડી શાંતિ મળી?',
        'વર્ષો વીતવા સાથે તમારી આધ્યાત્મિક સમજ કેવી રીતે વધુ પરિપક્વ બની?',
      ],
      pa: [
        'ਔਖੇ ਵੇਲੇ ਤੁਸੀਂ ਕਿਹੜੀ ਬਾਣੀ ਜਾਂ ਅਰਦਾਸ ਦਾ ਓਟ-ਆਸਰਾ ਲੈਂਦੇ ਸੀ?',
        'ਕਿਸ ਧਾਰਮਿਕ ਅਸਥਾਨ ਜਾਂ ਕੁਦਰਤ ਦੀ ਗੋਦ ਵਿੱਚ ਤੁਹਾਨੂੰ ਸਭ ਤੋਂ ਵੱਧ ਸਕੂਨ ਮਿਲਿਆ?',
        'ਉਮਰ ਦੇ ਨਾਲ-ਨਾਲ ਪ੍ਰਮਾਤਮਾ ਨਾਲ ਤੁਹਾਡਾ ਸੰਬੰਧ ਕਿਵੇਂ ਹੋਰ ਗੂੜ੍ਹਾ ਹੋਇਆ?',
      ],
      hi: [
        'जब सब कुछ बिखरता दिखा, तब किस प्रार्थना या भजन ने आपके मन को संभाला?',
        'किस तीर्थ, मंदिर या प्रकृति की गोद में आपको सबसे गहरी शांति महसूस हुई?',
        'उम्र के पड़ाव के साथ ईश्वर और आस्था के प्रति आपकी समझ कैसे और परिपक्व हुई?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a picture of a family shrine, prayer corner, prayer book, or sacred pilgrimage.',
      gu: 'ઘરના પૂજાસ્થળની, ધાર્મિક પુસ્તકની કે કોઈ યાત્રા-પ્રવાસની પવિત્ર તસવીર શોધો.',
      pa: 'ਘਰ ਦੇ ਪੂਜਾ ਅਸਥਾਨ, ਗੁਟਕਾ ਸਾਹਿਬ ਜਾਂ ਕਿਸੇ ਤੀਰਥ ਯਾਤਰਾ ਦੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'घर के पूजा स्थल, पवित्र ग्रंथ या किसी तीर्थ यात्रा की कोई यादगार तस्वीर तलाशिए।',
    },
  },
  {
    id: 'spark_wounds_wisdom',
    category: 'wisdom',
    title: 'Wounds into Wisdom',
    localizedTitles: {
      en: 'Wounds into Wisdom',
      gu: 'ઘા માંથી જ્ઞાન',
      pa: 'ਜ਼ਖ਼ਮਾਂ ਤੋਂ ਸਿਆਣਪ',
      hi: 'घावों से सीख',
    },
    linkedSceneId: 'part-4-scene-4',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'How have the painful scars and heartbreaks of your journey transformed into compassion and quiet strength? What can only be learned by walking through sorrow?',
      gu: 'તમારા જીવનના જૂના ઘા અને દુઃખો કેવી રીતે દયા અને આંતરિક શક્તિમાં ફેરવાઈ ગયા? એવી કઈ સમજ છે જે માત્ર સંઘર્ષ અને પીડામાંથી જ શીખી શકાય છે?',
      pa: 'ਜ਼ਿੰਦਗੀ ਦੇ ਪੁਰਾਣੇ ਦੁੱਖ ਅਤੇ ਸੱਟਾਂ ਕਿਵੇਂ ਹਮਦਰਦੀ ਅਤੇ ਅੰਦਰੂਨੀ ਤਾਕਤ ਬਣ ਗਈਆਂ? ਉਹ ਕਿਹੜੀ ਸਿਆਣਪ ਹੈ ਜੋ ਸਿਰਫ਼ ਔਖੇ ਸਮਿਆਂ ਵਿੱਚੋਂ ਲੰਘ ਕੇ ਹੀ ਮਿਲਦੀ ਹੈ?',
      hi: 'जीवन की पुरानी चोटें और तकलीफें कैसे दयालुता और भीतरी ताकत में बदल गईं? ऐसी कौन सी सीख है जो केवल मुश्किलों और दुख से गुजरकर ही हासिल होती है?',
    },
    followUpQuestions: {
      en: [
        'How did enduring hardship soften how you listen and relate to others in pain?',
        'What forgiveness did you give—or receive—that unburdened your heart?',
        'If you could thank that hardship for one gift it left behind, what would it be?',
      ],
      gu: [
        'તે મુશ્કેલીઓએ તમને અન્યના દુઃખ પ્રત્યે કેવી રીતે વધુ સંવેદનશીલ બનાવ્યા?',
        'કઈ માફી આપવાથી કે મેળવવાથી તમારું હૃદય બોજમુક્ત બન્યું?',
        'તે કડવા અનુભવે તમને કઈ અમૂલ્ય ભેટ આપી?',
      ],
      pa: [
        'ਉਸ ਦੁੱਖ ਨੇ ਤੁਹਾਨੂੰ ਦੂਜਿਆਂ ਦੇ ਦਰਦ ਨੂੰ ਸਮਝਣ ਵਾਲਾ ਕਿਵੇਂ ਬਣਾਇਆ?',
        'ਕਿਸ ਮਾਫ਼ੀ ਨੇ ਤੁਹਾਡੇ ਮਨ ਦਾ ਭਾਰ ਹਲਕਾ ਕੀਤਾ?',
        'ਉਸ ਤਜਰਬੇ ਨੇ ਤੁਹਾਨੂੰ ਜ਼ਿੰਦਗੀ ਦਾ ਕਿਹੜਾ ਵੱਡਾ ਤੋਹਫ਼ਾ ਦਿੱਤਾ?',
      ],
      hi: [
        'उस अनुभव ने आपको दूसरों के दर्द को समझने वाला कैसे बनाया?',
        'किस माफी ने आपके दिल का बोझ हमेशा के लिए हल्का कर दिया?',
        'उस मुश्किल दौर ने आपको इंसानियत का कौन सा सबसे बड़ा सबक दिया?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find a portrait from a peaceful era that captures the quiet dignity of who you have become.',
      gu: 'તમારા શાંત અને ગરિમાપૂર્ણ સ્વભાવને દર્શાવતી કોઈ સુંદર તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਸ਼ਾਂਤ ਅਤੇ ਗੰਭੀਰ ਸੁਭਾਅ ਨੂੰ ਦਰਸਾਉਂਦੀ ਕੋਈ ਖ਼ੂਬਸੂਰਤ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने शांत और गरिमामय व्यक्तित्व को दर्शाती उस दौर की कोई तस्वीर निकालिए।',
    },
  },

  // ─── PART V: WISDOM, HARD-WON TRUTHS & VALUES (Scenes 1–4) ────────────────
  {
    id: 'spark_letters_watching',
    category: 'legacy',
    title: 'Letters to Those Watching',
    localizedTitles: {
      en: 'Letters to Those Watching',
      gu: 'જોનારાઓને પત્રો',
      pa: 'ਦੇਖਣ ਵਾਲਿਆਂ ਨੂੰ ਚਿੱਠੀਆਂ',
      hi: 'देखने वालों को पत्र',
    },
    linkedSceneId: 'part-5-scene-1',
    suggestedMediaMode: 'video',
    sparks: {
      en: 'If you could write an open letter to the young eyes watching you—your children, nieces, nephews, and grandchildren—what essential rules of life would you pass on?',
      gu: 'તમને નિહાળતી નવી પેઢી—તમારા સંતાનો, ભત્રીજાઓ અને પૌત્ર-પૌત્રીઓ માટે જો તમારે પત્ર લખવો હોય, તો જીવનના કયા મુખ્ય નિયમો તમે તેમને શીખવશો?',
      pa: 'ਤੁਹਾਡੇ ਵੱਲ ਦੇਖ ਰਹੀ ਨਵੀਂ ਪੀੜ੍ਹੀ—ਬੱਚਿਆਂ ਅਤੇ ਪੋਤੇ-ਪੋਤੀਆਂ ਨੂੰ ਜੇ ਕੋਈ ਚਿੱਠੀ ਲਿਖਣੀ ਹੋਵੇ, ਤਾਂ ਜ਼ਿੰਦਗੀ ਦੇ ਕਿਹੜੇ ਅਸੂਲ ਉਹਨਾਂ ਨੂੰ ਸੌਂਪੋਗੇ?',
      hi: 'अपनी आने वाली पीढ़ी—बच्चों, नाती-पोतों को अगर एक खुला पत्र लिखना हो, तो जिंदगी के कौन से बुनियादी नियम आप उन्हें सिखाना चाहेंगे?',
    },
    followUpQuestions: {
      en: [
        'What golden standard of character should never be traded for wealth or status?',
        'How should they handle betrayal, envy, or unfair criticism?',
        'What daily habit will protect their joy and self-respect?',
      ],
      gu: [
        'ચરિત્રનો કયો સુવર્ણ નિયમ ધન કે પદ ખાતર ક્યારેય ન છોડવો જોઈએ?',
        'દગો, ઈર્ષ્યા કે અયોગ્ય ટીકા સામે તેમણે કેવી રીતે વર્તવું જોઈએ?',
        'કઈ રોજિંદી ટેવ તેમના આનંદ અને સ્વમાનનું રક્ષણ કરશે?',
      ],
      pa: [
        'ਚਰਿੱਤਰ ਦਾ ਕਿਹੜਾ ਸੁਨਹਿਰੀ ਅਸੂਲ ਦੌਲਤ ਖ਼ਾਤਰ ਕਦੇ ਨਹੀਂ ਵੇਚਣਾ ਚਾਹੀਦਾ?',
        'ਧੋਖੇ ਜਾਂ ਈਰਖਾ ਦਾ ਸਾਹਮਣਾ ਉਹਨਾਂ ਨੂੰ ਕਿਵੇਂ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?',
        'ਕਿਹੜੀ ਰੋਜ਼ਾਨਾ ਆਦਤ ਉਹਨਾਂ ਦੀ ਖ਼ੁਸ਼ੀ ਅਤੇ ਇੱਜ਼ਤ ਬਣਾਈ ਰੱਖੇਗੀ?',
      ],
      hi: [
        'चरित्र का कौन सा सुनहरा नियम धन या पद के लिए कभी नहीं छोड़ना चाहिए?',
        'धोखे, ईर्ष्या या आलोचना का सामना उन्हें किस गरिमा के साथ करना चाहिए?',
        'कौन सी दैनिक आदत उनके आत्मसम्मान और खुशी की रक्षा करेगी?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find a photograph of you surrounded by the younger generation, reading, teaching, or sharing a table.',
      gu: 'નવી પેઢીના બાળકો સાથે બેસીને વાતો કરતા કે શીખવતા હોવ તેવી કોઈ તસવીર શોધો.',
      pa: 'ਨਵੀਂ ਪੀੜ੍ਹੀ ਦੇ ਬੱਚਿਆਂ ਨਾਲ ਬੈਠਿਆਂ, ਪੜ੍ਹਾਉਂਦਿਆਂ ਜਾਂ ਹੱਸਦਿਆਂ ਦੀ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'नई पीढ़ी के बच्चों के साथ बैठकर बातें करते या कुछ सिखाते हुए कोई तस्वीर ढूंढिए।',
    },
  },
  {
    id: 'spark_conversations_myself',
    category: 'wisdom',
    title: 'Conversations with Myself',
    localizedTitles: {
      en: 'Conversations with Myself',
      gu: 'મારી સાથે વાતચીત',
      pa: 'ਆਪਣੇ ਆਪ ਨਾਲ ਗੱਲਾਂ',
      hi: 'अपने आप से बातें',
    },
    linkedSceneId: 'part-5-scene-2',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'In your quietest hours of solitude, when the house is still, what thoughts do you return to? What personal philosophy guides your internal world?',
      gu: 'જ્યારે આખું ઘર શાંત હોય અને તમે એકાંતમાં હોવ, ત્યારે તમારા મનમાં કયા વિચારો આવે છે? કઈ વ્યક્તિગત ફિલસૂફી તમારા આંતરિક જગતને માર્ગદર્શન આપે છે?',
      pa: 'ਜਦੋਂ ਸਾਰਾ ਘਰ ਸ਼ਾਂਤ ਹੁੰਦਾ ਹੈ ਅਤੇ ਤੁਸੀਂ ਇਕੱਲੇ ਹੁੰਦੇ ਹੋ, ਤੁਹਾਡੇ ਮਨ ਵਿੱਚ ਕਿਹੜੇ ਵਿਚਾਰ ਚੱਲਦੇ ਹਨ? ਕਿਹੜੀ ਸੋਚ ਤੁਹਾਡੇ ਅੰਦਰੂਨੀ ਸੰਸਾਰ ਨੂੰ ਚਲਾਉਂਦੀ ਹੈ?',
      hi: 'जब पूरा घर शांत होता है और आप अपने एकांत में होते हैं, तब आपके मन में कौन से विचार उमड़ते हैं? कौन सा दर्शन आपके भीतरी संसार को रोशनी देता है?',
    },
    followUpQuestions: {
      en: [
        'What gives you comfort when you feel misunderstood by the world?',
        'What simple, quiet pleasures bring you the deepest contentment?',
        'How do you quiet anxiety or restless thoughts before sleep?',
      ],
      gu: [
        'જ્યારે દુનિયા તમને ન સમજી શકે ત્યારે કયો વિચાર તમને આશ્વાસન આપે છે?',
        'કયા સાદા અને શાંત સુખો તમને સાચો સંતોષ આપે છે?',
        'ઊંઘતા પહેલાં મનની ચિંતાઓ તમે કેવી રીતે શાંત કરો છો?',
      ],
      pa: [
        'ਜਦੋਂ ਦੁਨੀਆ ਤੁਹਾਨੂੰ ਨਾ ਸਮਝੇ, ਤਾਂ ਕਿਹੜੀ ਗੱਲ ਤੁਹਾਡੇ ਮਨ ਨੂੰ ਧੀਰਜ ਦਿੰਦੀ ਹੈ?',
        'ਕਿਹੜੀਆਂ ਸਾਦੀਆਂ ਖ਼ੁਸ਼ੀਆਂ ਤੁਹਾਨੂੰ ਸਭ ਤੋਂ ਵੱਧ ਸਕੂਨ ਦਿੰਦੀਆਂ ਹਨ?',
        'ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ ਤੁਸੀਂ ਆਪਣੇ ਮਨ ਨੂੰ ਕਿਵੇਂ ਸ਼ਾਂਤ ਕਰਦੇ ਹੋ?',
      ],
      hi: [
        'जब दुनिया आपकी बात न समझ सके, तब कौन सा विचार आपको संबल देता है?',
        'कौन सी सादगी भरी खुशियां आपके मन को सबसे गहरा संतोष देती हैं?',
        'सोने से पहले मन की बेचैनी और चिंताओं को आप कैसे शांत करते हैं?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a picture of your favourite reading chair, garden bench, or quiet corner of the home.',
      gu: 'તમારી પ્રિય બેઠકની, વાંચવાની ખુરશીની કે બગીચાના શાંત ખૂણાની તસવીર શોધો.',
      pa: 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਕੁਰਸੀ, ਬਗੀਚੇ ਦੇ ਬੈਂਚ ਜਾਂ ਘਰ ਦੇ ਸ਼ਾਂਤ ਕੋਨੇ ਦੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपनी पसंदीदा कुर्सी, बगीचे के कोने या घर के शांत ठिकाने की कोई तस्वीर निकालिए।',
    },
  },
  {
    id: 'spark_person_in_mirror',
    category: 'wisdom',
    title: 'The Person in the Mirror',
    localizedTitles: {
      en: 'The Person in the Mirror',
      gu: 'અરીસામાં વ્યક્તિ',
      pa: 'ਸ਼ੀਸ਼ੇ ਵਿਚਲਾ ਇਨਸਾਨ',
      hi: 'आईने में अक्स',
    },
    linkedSceneId: 'part-5-scene-3',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'When you stand before the mirror today, looking into your own eyes, what honest reckoning do you see? What peace have you made with the passage of time and who you have become?',
      gu: 'આજે જ્યારે તમે અરીસા સામે ઊભા રહીને તમારી આંખોમાં જુઓ છો, ત્યારે તમને કેવો આત્મ-સંતોષ દેખાય છે? સમયના વહેણ અને તમારા આજના સ્વરૂપ સાથે તમે કેવી શાંતિ સાધી છે?',
      pa: 'ਜਦੋਂ ਅੱਜ ਤੁਸੀਂ ਸ਼ੀਸ਼ੇ ਸਾਹਮਣੇ ਖੜ੍ਹ ਕੇ ਆਪਣੀਆਂ ਅੱਖਾਂ ਵਿੱਚ ਝਾਕਦੇ ਹੋ, ਤੁਹਾਨੂੰ ਕਿਹੜਾ ਸੱਚ ਦਿਖਦਾ ਹੈ? ਸਮੇਂ ਦੇ ਬੀਤਣ ਅਤੇ ਆਪਣੇ ਅਜੋਕੇ ਰੂਪ ਨਾਲ ਤੁਸੀਂ ਕਿਵੇਂ ਸਮਝੌਤਾ ਕੀਤਾ ਹੈ?',
      hi: 'जब आज आप आईने के सामने खड़े होकर अपनी आंखों में देखते हैं, तो आपको क्या नजर आता है? बीतते वक्त और आज के अपने स्वरूप के साथ आपने कैसी शांति पाई है?',
    },
    followUpQuestions: {
      en: [
        'Which lines on your face tell the stories of your hardest-won victories?',
        'What self-forgiveness has brought you the most serene release?',
        'What do you appreciate about your spirit today that you took for granted in your thirties?',
      ],
      gu: [
        'તમારા ચહેરાની કઈ કરચલીઓ તમારા જીવનના સંઘર્ષ અને વિજયની સાક્ષી પૂરે છે?',
        'તમારી જાતને માફ કરવાથી તમને કેવો મુક્ત અહેસાસ થયો?',
        'તમારા સ્વભાવની કઈ ખૂબી આજે તમને સૌથી વધુ પ્રિય લાગે છે?',
      ],
      pa: [
        'ਤੁਹਾਡੇ ਚਿਹਰੇ ਦੀਆਂ ਲਕੀਰਾਂ ਕਿਹੜੇ ਸੰਘਰਸ਼ਾਂ ਅਤੇ ਜਿੱਤਾਂ ਦੀ ਗਵਾਹੀ ਭਰਦੀਆਂ ਹਨ?',
        'ਆਪਣੇ ਆਪ ਨੂੰ ਮੁਆਫ਼ ਕਰਕੇ ਮਨ ਨੂੰ ਕਿੰਨਾ ਹਲਕਾ ਮਹਿਸੂਸ ਹੋਇਆ?',
        'ਅੱਜ ਆਪਣੇ ਅੰਦਰਲੀ ਕਿਹੜੀ ਖ਼ੂਬੀ \'ਤੇ ਤੁਹਾਨੂੰ ਸਭ ਤੋਂ ਵੱਧ ਤਸੱਲੀ ਹੈ?',
      ],
      hi: [
        'आपके चेहरे की रेखाएं किन संघर्षों और जीतों की दास्तान सुनाती हैं?',
        'खुद को माफ करने से आपके दिल को कैसा सुकून मिला?',
        'अपने स्वभाव की कौन सी खूबी आज आपको सबसे अनमोल लगती है?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find a recent candid portrait or close-up photograph of you looking relaxed and authentic.',
      gu: 'તાજેતરની કોઈ સહજ, સુંદર અને હસતી મુદ્રાવાળી પોટ્રેટ તસવીર શોધો.',
      pa: 'ਹਾਲ ਹੀ ਦੀ ਕੋਈ ਸਹਿਜ ਅਤੇ ਖ਼ੂਬਸੂਰਤ ਪੋਰਟਰੇਟ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'हाल के दिनों की कोई स्वाभाविक और शांत चेहरे वाली क्लोज-अप तस्वीर निकालिए।',
    },
  },
  {
    id: 'spark_quiet_victories',
    category: 'wisdom',
    title: 'The Quiet Victories',
    localizedTitles: {
      en: 'The Quiet Victories',
      gu: 'શાંત વિજય',
      pa: 'ਸ਼ਾਂਤ ਜਿੱਤਾਂ',
      hi: 'खामोश जीत',
    },
    linkedSceneId: 'part-5-scene-4',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'What are the unsung, quiet victories of your life that no one applauded—sacrifices made in secret, temptations resisted, and acts of decency that defined who you are?',
      gu: 'તમારા જીવનના એવા કયા શાંત વિજય છે જેની કોઈએ પ્રશંસા નથી કરી—ગુપ્ત રીતે કરેલા ત્યાગ, ટાળેલા ખોટા માર્ગો અને નેકીના એવા કાર્યો જેણે તમારા ચરિત્રનું નિર્માણ કર્યું?',
      pa: 'ਜ਼ਿੰਦਗੀ ਦੀਆਂ ਉਹ ਕਿਹੜੀਆਂ ਅਣਗੌਲੀਆਂ ਜਿੱਤਾਂ ਹਨ ਜਿਨ੍ਹਾਂ ਲਈ ਕਿਸੇ ਤਾੜੀਆਂ ਨਹੀਂ ਮਾਰੀਆਂ—ਲੁਕ ਕੇ ਕੀਤੇ ਤਿਆਗ ਅਤੇ ਨੇਕੀ ਦੇ ਕੰਮ ਜਿਨ੍ਹਾਂ ਨੇ ਤੁਹਾਨੂੰ ਸੱਚਾ ਇਨਸਾਨ ਬਣਾਇਆ?',
      hi: 'जीवन की वे कौन सी खामोश जीतें हैं जिनकी किसी ने वाहवाही नहीं की—चुपचाप दिए गए बलिदान, रोके गए गलत कदम और नेकी के वे काम जिन्होंने आपके चरित्र को गढ़ा?',
    },
    followUpQuestions: {
      en: [
        'What quiet sacrifice did you make for your family that you never brought up again?',
        'When did doing the right thing cost you something dear, and why would you do it again?',
        'How do small, daily honesties build a life of profound peace?',
      ],
      gu: [
        'પરિવાર માટે તમે કયો એવો ત્યાગ કર્યો જેની તમે ક્યારેય ચર્ચા પણ નથી કરી?',
        'સાચો માર્ગ પસંદ કરવાથી ક્યારે નુકસાન થયું, પણ આજે પણ તમને તેનો ગર્વ છે?',
        'નાની-નાની પ્રામાણિકતાઓ જીવનમાં કેવી રીતે ઊંડી શાંતિ લાવે છે?',
      ],
      pa: [
        'ਪਰਿਵਾਰ ਖ਼ਾਤਰ ਕਿਹੜੀ ਕੁਰਬਾਨੀ ਦਿੱਤੀ ਜਿਸ ਦਾ ਤੁਸੀਂ ਕਦੇ ਜ਼ਿਕਰ ਨਹੀਂ ਕੀਤਾ?',
        'ਸੱਚੇ ਰਾਹ \'ਤੇ ਚੱਲਦਿਆਂ ਕਦੋਂ ਨੁਕਸਾਨ ਹੋਇਆ, ਪਰ ਤੁਹਾਨੂੰ ਆਪਣੇ \'ਤੇ ਮਾਣ ਰਿਹਾ?',
        'ਨਿੱਕੀਆਂ-ਨਿੱਕੀਆਂ ਨੇਕੀਆਂ ਜ਼ਿੰਦਗੀ ਨੂੰ ਕਿਵੇਂ ਸੁਨਹਿਰੀ ਬਣਾਉਂਦੀਆਂ ਹਨ?',
      ],
      hi: [
        'परिवार के लिए आपने कौन सा ऐसा त्याग किया जिसका कभी जिक्र तक नहीं किया?',
        'सही रास्ते पर चलने की क्या कीमत चुकानी पड़ी, पर आज भी आपको उस पर नाज है?',
        'रोजमर्रा की छोटी-छोटी सच्चाइयां जीवन में कैसी शांति घोल देती हैं?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for an unposed snapshot of an ordinary, beautiful day when everything felt quietly right.',
      gu: 'સામાન્ય પણ સુંદર દિવસની કોઈ સાહજિક તસવીર શોધો જ્યારે બધું જ શાંતિપૂર્ણ હતું.',
      pa: 'ਕਿਸੇ ਆਮ ਪਰ ਸੁਨਹਿਰੀ ਦਿਨ ਦੀ ਤਸਵੀਰ ਲੱਭੋ ਜਦੋਂ ਮਨ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸੰਤੁਸ਼ਟ ਸੀ।',
      hi: 'किसी आम पर खूबसूरत दिन की सहज तस्वीर निकालिए जब सब कुछ सुकून से भरा था।',
    },
  },

  // ─── PART VI: THE CONTINUING STORY & HEIRLOOM LEGACY (Scenes 1–4) ─────────
  {
    id: 'spark_what_lies_ahead',
    category: 'legacy',
    title: 'What Still Lies Ahead',
    localizedTitles: {
      en: 'What Still Lies Ahead',
      gu: 'હજી શું આગળ છે',
      pa: 'ਅਜੇ ਕੀ ਅੱਗੇ ਹੈ',
      hi: 'जो अभी आगे है',
    },
    linkedSceneId: 'part-6-scene-1',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'What dreams, hopes, and horizons still stir your curiosity? What do you wish to see unfold in the world, in your family, and in the next chapters of human progress?',
      gu: 'ભવિષ્યના કયા સપના, આશાઓ અને ક્ષિતિજો હજી પણ તમારી જિજ્ઞાસા જગાવે છે? તમારા પરિવારમાં અને આ દુનિયામાં તમે કઈ નવી સારી બાબતો જોવા માંગો છો?',
      pa: 'ਭਵਿੱਖ ਦੇ ਕਿਹੜੇ ਸੁਪਨੇ ਅਤੇ ਉਮੀਦਾਂ ਅਜੇ ਵੀ ਤੁਹਾਡੇ ਦਿਲ ਨੂੰ ਧੜਕਾਉਂਦੀਆਂ ਹਨ? ਆਉਣ ਵਾਲੇ ਸਮੇਂ ਵਿੱਚ ਪਰਿਵਾਰ ਅਤੇ ਸੰਸਾਰ ਵਿੱਚ ਤੁਸੀਂ ਕੀ ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
      hi: 'भविष्य के कौन से सपने और उम्मीदें आज भी आपके दिल में उमंग भरते हैं? आने वाले कल में अपने परिवार और इस दुनिया में आप क्या देखना चाहते हैं?',
    },
    followUpQuestions: {
      en: [
        'What upcoming milestone or graduation in the family do you long to celebrate?',
        'What technological or human breakthrough do you hope the children will witness?',
        'How do you keep your curiosity vibrant every single morning?',
      ],
      gu: [
        'પરિવારનો કયો આગામી ઉત્સવ કે સિદ્ધિ તમે હર્ષોલ્લાસથી ઉજવવા માંગો છો?',
        'વિશ્વમાં કઈ નવી શોધ કે પરિવર્તન તમારી નવી પેઢી જોશે તેવી તમારી ઇચ્છા છે?',
        'દરરોજ સવારે તમારા જીવનમાં નવો ઉત્સાહ કેવી રીતે જાળવી રાખો છો?',
      ],
      pa: [
        'ਪਰਿਵਾਰ ਦਾ ਕਿਹੜਾ ਆਉਣ ਵਾਲਾ ਖ਼ੁਸ਼ੀ ਦਾ ਮੌਕਾ ਤੁਸੀਂ ਮਨਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
        'ਤੁਹਾਡੇ ਬੱਚੇ ਕਿਹੜੀ ਨਵੀਂ ਤਰੱਕੀ ਦੇਖਣ, ਇਹ ਤੁਹਾਡੀ ਦਿਲੀ ਤਮੰਨਾ ਹੈ?',
        'ਹਰ ਸਵੇਰ ਤੁਸੀਂ ਆਪਣੇ ਮਨ ਵਿੱਚ ਨਵਾਂ ਚਾਅ ਕਿਵੇਂ ਜਗਾਉਂਦੇ ਹੋ?',
      ],
      hi: [
        'परिवार का कौन सा आने वाला उत्सव आप सबसे ज्यादा खुशी से मनाना चाहते हैं?',
        'आपकी आने वाली पीढ़ी दुनिया में कौन सा सकारात्मक बदलाव देखे, यह आपकी चाहत है?',
        'हर सुबह आप अपने दिल में नई उमंग कैसे जगाते हैं?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a picture of you gazing into the horizon or standing in an open landscape.',
      gu: 'ક્ષિતિજ તરફ કે ખુલ્લા આકાશ નીચે ઊભા હોવ તેવી કોઈ સુંદર તસવીર શોધો.',
      pa: 'ਖੁੱਲ੍ਹੇ ਅਸਮਾਨ ਜਾਂ ਦੂਰ ਦਿਸਹੱਦੇ ਵੱਲ ਤੱਕਦਿਆਂ ਦੀ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'दूर क्षितिज या खुले आसमान की ओर देखते हुए अपनी कोई तस्वीर ढूंढिए।',
    },
  },
  {
    id: 'spark_if_could_do_again',
    category: 'legacy',
    title: 'If I Could Do It Again',
    localizedTitles: {
      en: 'If I Could Do It Again',
      gu: 'જો હું તે ફરી કરી શકું',
      pa: 'ਜੇ ਮੈਂ ਦੁਬਾਰਾ ਕਰ ਸਕਾਂ',
      hi: 'अगर मैं दोबारा जी सकूं',
    },
    linkedSceneId: 'part-6-scene-2',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'If you could relive one magical afternoon from your journey, exactly as it was, which day would you choose? What was the light, the sound, and who was with you?',
      gu: 'જો તમે તમારા સમગ્ર જીવનમાંથી કોઈ એક સુંદર સાંજ કે બપોર ફરીથી જીવી શકો, તો તમે કયો દિવસ પસંદ કરશો? તે સમયનો પ્રકાશ, વાતાવરણ અને તમારી સાથે કોણ હતું?',
      pa: 'ਜੇ ਤੁਸੀਂ ਆਪਣੀ ਜ਼ਿੰਦਗੀ ਦਾ ਕੋਈ ਇੱਕ ਜਾਦੂਈ ਦਿਨ ਦੁਬਾਰਾ ਜੀ ਸਕੋ, ਤਾਂ ਉਹ ਕਿਹੜਾ ਹੋਵੇਗਾ? ਉਸ ਵੇਲੇ ਕਿਹੋ ਜਿਹਾ ਮਾਹੌਲ ਸੀ ਅਤੇ ਕੌਣ ਤੁਹਾਡੇ ਨਾਲ ਸੀ?',
      hi: 'अगर आप अपनी पूरी जिंदगी की कोई एक सुनहरी दोपहर दोबारा जी सकें, तो वह कौन सा दिन होगा? उस वक्त कैसा उजाला था और कौन आपके साथ था?',
    },
    followUpQuestions: {
      en: [
        'What was the laughter, the meal, or the music that made that day unforgettable?',
        'Did you realize in that very moment how precious it was, or did its magic deepen with time?',
        'What did that afternoon teach you about what truly matters in this life?',
      ],
      gu: [
        'તે દિવસનું ભોજન, સંગીત કે હાસ્ય કેવું અવિસ્મરણીય હતું?',
        'શું તમને તે સમયે જ ખ્યાલ હતો કે તે ક્ષણ કેટલી અનમોલ છે?',
        'તે દિવસે તમને જીવનના સાચા અર્થ વિશે શું શીખવ્યું?',
      ],
      pa: [
        'ਉਸ ਦਿਨ ਦਾ ਹਾਸਾ, ਭੋਜਨ ਜਾਂ ਗੀਤ ਕਿਉਂ ਕਦੇ ਨਹੀਂ ਭੁੱਲਿਆ?',
        'ਕੀ ਤੁਹਾਨੂੰ ਉਸੇ ਵੇਲੇ ਅਹਿਸਾਸ ਹੋ ਗਿਆ ਸੀ ਕਿ ਉਹ ਪਲ ਕਿੰਨਾ ਕੀਮਤੀ ਸੀ?',
        'ਉਸ ਦਿਨ ਨੇ ਤੁਹਾਨੂੰ ਜ਼ਿੰਦਗੀ ਦੀ ਅਸਲ ਕੀਮਤ ਬਾਰੇ ਕੀ ਸਿਖਾਇਆ?',
      ],
      hi: [
        'उस दिन की हंसी, खाना या संगीत क्यों दिल में हमेशा के लिए बस गया?',
        'क्या उसी पल आपको एहसास हो गया था कि वह घड़ी कितनी अनमोल है?',
        'उस दोपहर ने आपको जिंदगी के सबसे बड़े सच के बारे में क्या समझाया?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find a photograph from that golden afternoon or the season of life that holds your fondest joy.',
      gu: 'તે સુવર્ણ દિવસની કે જીવનના સૌથી આનંદદાયક સમયની કોઈ પ્રિય તસવીર શોધો.',
      pa: 'ਉਸ ਸੁਨਹਿਰੀ ਦਿਨ ਜਾਂ ਜ਼ਿੰਦਗੀ ਦੇ ਸਭ ਤੋਂ ਖ਼ੁਸ਼ਹਾਲ ਸਮੇਂ ਦੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'उस सुनहरे दिन या जीवन के सबसे खुशनुमा दौर की कोई यादगार तस्वीर तलाशिए।',
    },
  },
  {
    id: 'spark_experiment_truth',
    category: 'legacy',
    title: 'Living Authentically',
    localizedTitles: {
      en: 'Living Authentically',
      gu: 'પ્રામાણિકપણે જીવવું',
      pa: 'ਸੱਚੀ ਜ਼ਿੰਦਗੀ ਜਿਊਣਾ',
      hi: 'सच्चाई से जीना',
    },
    linkedSceneId: 'part-6-scene-3',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'What does it mean to live authentically, true to your conscience, without apology or pretence? What conviction did you defend even when it was unpopular?',
      gu: 'કોઈપણ દંભ કે દેખાડા વગર, પોતાના અંતરાત્માને વફાદાર રહીને પ્રામાણિક જીવન જીવવાનો અર્થ શું છે? કયા સિદ્ધાંત ખાતર તમે અડગ ઊભા રહ્યા?',
      pa: 'ਬਿਨਾਂ ਕਿਸੇ ਦਿਖਾਵੇ ਦੇ ਆਪਣੇ ਜ਼ਮੀਰ ਅਨੁਸਾਰ ਸੱਚੀ ਜ਼ਿੰਦਗੀ ਜਿਊਣ ਦਾ ਕੀ ਮਤਲਬ ਹੈ? ਕਿਹੜੇ ਅਸੂਲ \'ਤੇ ਤੁਸੀਂ ਉਸ ਵੇਲੇ ਵੀ ਪਹਿਰਾ ਦਿੱਤਾ ਜਦੋਂ ਸਾਰੇ ਵਿਰੋਧ ਵਿੱਚ ਸਨ?',
      hi: 'बिना किसी दिखावे या परदे के, अपनी अंतरात्मा के अनुसार सच का जीवन जीने का क्या अर्थ है? किस सिद्धांत पर आप तब भी डटे रहे जब राह आसान नहीं थी?',
    },
    followUpQuestions: {
      en: [
        'When did speaking the truth require the greatest courage of your life?',
        'How do you advise young people to resist peer pressure and stay true to their values?',
        'What peace comes from knowing you never wore a false mask?',
      ],
      gu: [
        'સત્ય બોલવા માટે તમારા જીવનમાં ક્યારે સૌથી મોટી હિંમતની જરૂર પડી?',
        'નવી પેઢી અન્યના દબાણમાં આવ્યા વગર પોતાના સંસ્કારોને કેવી રીતે વળગી રહે?',
        'ક્યારેય ખોટો મહોરો ન પહેરવાથી મનને કેવો સાચો સંતોષ મળે છે?',
      ],
      pa: [
        'ਸੱਚ ਬੋਲਣ ਲਈ ਤੁਹਾਨੂੰ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਡੀ ਹਿੰਮਤ ਕਦੋਂ ਕਰਨੀ ਪਈ?',
        'ਨੌਜਵਾਨਾਂ ਨੂੰ ਲੋਕਾਂ ਦੀਆਂ ਗੱਲਾਂ ਵਿੱਚ ਆਉਣ ਦੀ ਬਜਾਏ ਆਪਣੇ ਅਸੂਲਾਂ \'ਤੇ ਕਿਵੇਂ ਡਟਣਾ ਚਾਹੀਦਾ ਹੈ?',
        'ਕੋਈ ਝੂਠਾ ਮੁਖੌਟਾ ਨਾ ਪਾਉਣ ਨਾਲ ਮਨ ਨੂੰ ਕਿੰਨਾ ਸਕੂਨ ਮਿਲਦਾ ਹੈ?',
      ],
      hi: [
        'सच कहने के लिए आपको जिंदगी में सबसे बड़ी हिम्मत कब जुटानी पड़ी?',
        'दूसरों के दबाव में आए बिना युवा पीढ़ी अपने संस्कारों पर कैसे टिकी रहे?',
        'कभी कोई झूठा मुखौटा न पहनने से रूह को कैसा सुकून मिलता है?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Look for a portrait of you that reflects your authentic, resolute character.',
      gu: 'તમારા દ્રઢ અને પ્રામાણિક સ્વભાવને પ્રતિબિંબિત કરતી કોઈ સુંદર તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਦ੍ਰਿੜ੍ਹ ਅਤੇ ਸੱਚੇ ਸੁਭਾਅ ਨੂੰ ਦਰਸਾਉਂਦੀ ਕੋਈ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने दृढ़ और सच्चे व्यक्तित्व को दर्शाती कोई गंभीर व गरिमामय तस्वीर निकालिए।',
    },
  },
  {
    id: 'spark_legacy_blessing',
    category: 'legacy',
    title: 'Words to Remember Me By',
    localizedTitles: {
      en: 'The Story Continuing',
      gu: 'વાર્તા ચાલુ છે',
      pa: 'ਚੱਲਦੀ ਕਹਾਣੀ',
      hi: 'चलती कहानी',
    },
    linkedSceneId: 'part-6-scene-4',
    suggestedMediaMode: 'video',
    sparks: {
      en: 'If your great-grandchildren listen to your voice one hundred years from now, what blessing, promise, or core truth do you want them to hold close to their hearts?',
      gu: 'આજથી સો વર્ષ પછી જો તમારા પ્રપૌત્રો કે ભવિષ્યની પેઢી તમારો આ અવાજ સાંભળે, તો તમે તેમને કયો આશીર્વાદ અને કયું જીવનસૂત્ર આપવા માંગો છો?',
      pa: 'ਅੱਜ ਤੋਂ ਸੌ ਸਾਲ ਬਾਅਦ ਜੇ ਤੁਹਾਡੇ ਪੜਪੋਤੇ-ਪੜਪੋਤੀਆਂ ਤੁਹਾਡੀ ਇਹ ਆਵਾਜ਼ ਸੁਣਨ, ਤਾਂ ਤੁਸੀਂ ਉਹਨਾਂ ਨੂੰ ਕਿਹੜੀ ਅਸੀਸ ਅਤੇ ਜੀਵਨ-ਸੇਧ ਦੇਣਾ ਚਾਹੋਗੇ?',
      hi: 'आज से सौ साल बाद जब आपकी आने वाली पीढ़ियां आपकी यह आवाज सुनेंगी, तो आप उन्हें कौन सा आशीर्वाद और जीवन का कौन सा संदेश देना चाहेंगे?',
    },
    followUpQuestions: {
      en: [
        'What golden principle has steered your conscience through life\'s crossroads?',
        'What do you hope your descendants will remember most about your warmth and character?',
        'What is your fondest prayer for the generations to follow?',
      ],
      gu: [
        'તમારા દરેક નિર્ણયમાં કયા જીવનમૂલ્યે તમારા અંતરાત્માને સાચો માર્ગ બતાવ્યો?',
        'તમારા સ્નેહ અને સ્વભાવ વિશે તમારી નવી પેઢી શું યાદ રાખે તેવી તમારી ઇચ્છા છે?',
        'આપણા પરિવારના ભવિષ્ય માટે તમારી સૌથી મોટી મનોકામના કઈ છે?',
      ],
      pa: [
        'ਕਿਹੜੇ ਸੁਨਹਿਰੀ ਅਸੂਲ ਨੇ ਜ਼ਿੰਦਗੀ ਦੇ ਹਰ ਮੋੜ \'ਤੇ ਤੁਹਾਡਾ ਸਾਥ ਦਿੱਤਾ?',
        'ਤੁਸੀਂ ਕੀ ਚਾਹੁੰਦੇ ਹੋ ਕਿ ਆਉਣ ਵਾਲੀ ਪੀੜ੍ਹੀ ਤੁਹਾਡੇ ਬਾਰੇ ਸਭ ਤੋਂ ਵੱਧ ਕੀ ਯਾਦ ਰੱਖੇ?',
        'ਸਾਡੇ ਪਰਿਵਾਰ ਦੇ ਭਵਿੱਖ ਲਈ ਤੁਹਾਡੀ ਸਭ ਤੋਂ ਵੱਡੀ ਦੁਆ ਕੀ ਹੈ?',
      ],
      hi: [
        'किस सुनहरे संस्कार ने आपके हर मोड़ पर आपका मार्गदर्शन किया?',
        'आप क्या चाहते हैं कि आपकी आने वाली नस्लें आपके बारे में सबसे ज्यादा क्या याद रखें?',
        'हमारे परिवार के उज्ज्वल भविष्य के लिए आपकी सबसे गहरी दिली तमन्ना क्या है?',
      ],
    },
    recommendedPhotoPrompt: {
      en: 'Find a generation portrait with you embraced by your children or grandchildren.',
      gu: 'તમે તમારા સંતાનો અથવા પૌત્ર-પૌત્રીઓ સાથે હોય તેવી કોઈ સુંદર પારિવારિક તસવીર શોધો.',
      pa: 'ਆਪਣੇ ਬੱਚਿਆਂ ਜਾਂ ਪੋਤੇ-ਪੋਤੀਆਂ ਨਾਲ ਬੈਠਿਆਂ ਦੀ ਕੋਈ ਖ਼ੂਬਸੂਰਤ ਯਾਦਗਾਰੀ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'अपने बच्चों या नाती-पोतों के साथ ली गई कोई खूबसूरत पारिवारिक तस्वीर निकालिए।',
    },
  },
];

/**
 * Look up a prompt spark by its unique ID
 */
export function getPromptById(id: string): FiresidePromptSpark | undefined {
  return FIRESIDE_PROMPT_SPARKS.find((prompt) => prompt.id === id);
}

/**
 * Filter prompt sparks by category
 */
export function getPromptsByCategory(category: PromptCategory): FiresidePromptSpark[] {
  return FIRESIDE_PROMPT_SPARKS.filter((prompt) => prompt.category === category);
}

/**
 * Retrieve a random prompt spark, optionally excluding a specific ID
 */
export function getRandomPrompt(excludeId?: string): FiresidePromptSpark {
  const eligible = excludeId
    ? FIRESIDE_PROMPT_SPARKS.filter((prompt) => prompt.id !== excludeId)
    : FIRESIDE_PROMPT_SPARKS;
  const pool = eligible.length > 0 ? eligible : FIRESIDE_PROMPT_SPARKS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
