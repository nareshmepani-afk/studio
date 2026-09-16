/**
 * 🎙️ Fireside Voice Studio — Multilingual Prompt Spark Dataset & Query Engine
 *
 * Milestone: MW-87 (Ticket #245 / MW-244)
 * Target Route: /studio/fireside
 * Constitutional Governance: C:\Users\home\studio\.agents\AGENTS.md
 * (Rule 7 Non-Degradation, Rule 20 British English Orthography, Rule 26 Elder Ergonomics, Rule 35.3 Multi-Script Diaspora)
 */

import type { FiresidePromptSpark, FiresideLanguage, PromptCategory } from '@/types/fireside';

export const FIRESIDE_PROMPT_SPARKS: FiresidePromptSpark[] = [
  {
    id: 'spark_roots_journey',
    category: 'roots',
    title: 'The Journey of Your Ancestors',
    linkedSceneId: 'part-1-scene-1',
    suggestedMediaMode: 'video',
    sparks: {
      en: 'What stories did your grandparents share about where your family originally came from, and what courageous journey brought them here?',
      gu: 'તમારા વડીલો કે દાદા-દાદીએ પોતાના મૂળ વતન અને મુશ્કેલ સ્થળાંતર વિશે તમને કઈ વાતો કહી હતી?',
      pa: 'ਤੁਹਾਡੇ ਬਜ਼ੁਰਗਾਂ ਜਾਂ ਦਾਦਾ-ਦਾਦੀ ਨੇ ਆਪਣੇ ਪੁਰਾਣੇ ਪਿੰਡ ਅਤੇ ਹਿਜਰਤ ਦੇ ਸਫ਼ਰ ਬਾਰੇ ਤੁਹਾਨੂੰ ਕੀ ਦੱਸਿਆ ਸੀ?',
      hi: 'आपके दादा-दादी या बुजुर्गों ने अपने पुश्तैनी गांव और वहां से नए शहर बसने के सफर के बारे में क्या सुनाया था?',
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
      pa: 'ਆਪਣੇ ਮਾਤਾ-ਪਿਤਾ ਜਾਂ ਦਾਦਾ-ਦਾਦੀ ਦੀ ਜਵਾਨੀ ਵੇਲੇ ਦੀ ਜਾਂ ਪੁਰਾਣੇ ਪਾਸਪੋਰਟ ਦੀ ਤਸવીਰ ਲੱਭੋ።',
      hi: 'अपने माता-पिता या दादा-दादी के शुरुआती दिनों या पुराने पासपोर्ट की कोई तस्वीर ढूंढिए।',
    },
  },
  {
    id: 'spark_childhood_home',
    category: 'childhood',
    title: 'The Kitchen of Your Childhood',
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
      pa: 'ਆਪਣੇ ਬਚਪਨ ਦੇ ਘਰ, ਵਿਹੜੇ ਜਾਂ ਪਰਿਵਾਰ ਦੀ ਕੋਈ ਪੁਰਾਣੀ ਤਸવીਰ ਲੱਭੋ።',
      hi: 'अपने बचपन के घर, आंगन या पूरे परिवार की कोई पुरानी तस्वीर तलाशिए।',
    },
  },
  {
    id: 'spark_love_partner',
    category: 'love',
    title: 'The Day You Met Your Life Partner',
    linkedSceneId: 'part-4-scene-1',
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
    id: 'spark_wisdom_hardship',
    category: 'wisdom',
    title: 'A Hardship That Taught You Courage',
    linkedSceneId: 'part-2-scene-2',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Reflect on a difficult season in your life that tested your strength. How did you endure it, and what quiet wisdom did it leave you with?',
      gu: 'તમારા જીવનના કોઈ એવા મુશ્કેલ સમયને યાદ કરો જેણે તમારી ધીરજની કસોટી લીધી. તમે તેમાંથી કેવી રીતે બહાર આવ્યા અને તેનાથી શું મૂલ્યવાન શીખવા મળ્યું?',
      pa: 'ਜ਼ਿੰਦਗੀ ਦੇ ਕਿਸੇ ਅਜਿਹੇ ਔਖੇ ਸਮੇਂ ਨੂੰ ਯਾਦ ਕਰੋ ਜਿਸ ਨੇ ਤੁਹਾਡੇ ਹੌਸਲੇ ਨੂੰ ਪਰਖਿਆ। ਤੁਸੀਂ ਉਸ ਦਾ ਸਾਹਮਣਾ ਕਿਵੇਂ ਕੀਤਾ ਅਤੇ ਉਸ ਤੋਂ ਕੀ ਸਿੱਖਿਆ ਮਿਲੀ?',
      hi: 'जिंदगी के किसी ऐसे कठिन दौर को याद कीजिए जिसने आपके सब्र की परीक्षा ली। आपने उस मुश्किल का सामना कैसे किया और उससे क्या सीख मिली?',
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
    id: 'spark_traditions_festivals',
    category: 'traditions',
    title: 'The Festive Gatherings of Your Youth',
    linkedSceneId: 'part-1-scene-3',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'Describe how your family celebrated the great festivals when you were young. What traditional delicacies were simmered, and how did the house come alive?',
      gu: 'તમારા બાળપણમાં મોટા તહેવારો કેવી રીતે ઉજવાતા? ઘરમાં કઈ પરંપરાગત વાનગીઓ બનતી અને આખો પરિવાર કેવી રીતે ઉત્સાહથી ભેગો થતો?',
      pa: 'ਤੁਹਾਡੇ ਬਚਪਨ ਵਿੱਚ ਵੱਡੇ ਤਿਉਹਾਰ ਕਿਵੇਂ ਮਨਾਏ ਜਾਂਦੇ ਸਨ? ਰਸੋਈ ਵਿੱਚ ਕਿਹੜੇ ਪਕਵਾਨ ਬਣਦੇ ਸਨ ਅਤੇ ਘਰ ਵਿੱਚ ਕਿਹੋ ਜਿਹੀ ਰੌਣਕ ਹੁੰਦੀ ਸੀ?',
      hi: 'आपके बचपन में बड़े त्योहार कैसे मनाए जाते थे? घर में कौन से पारंपरिक पकवान बनते थे और आंगन में कैसी रौनक होती थी?',
    },
    followUpQuestions: {
      en: [
        'Which festival did you anticipate most excitedly as a child?',
        'What sacred blessings or customs did the family elders bestow?',
        'Which of those customs have you passed down to your children and grandchildren?',
      ],
      gu: [
        'બાળપણમાં તમને કયા તહેવારની સૌથી વધુ આતુરતાથી રાહ રહેતી?',
        'વડીલો કયા આશીર્વાદ અને પરંપરાગત વિધિઓ કરતા?',
        'તેમાંથી કઈ રીતો તમે આજે તમારા બાળકો અને પૌત્રો-પૌત્રીઓને શીખવી છે?',
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
      en: 'Look for a picture of a family festival gathering, Diwali oil lamps, or Vaisakhi feast.',
      gu: 'તહેવારના દિવસે લીધેલી કુટુંબની, દીવાળીના દીવડાઓની કે મેળાવડાની કોઈ જૂની તસવીર શોધો.',
      pa: 'ਤਿਉਹਾਰ ਦੇ ਦਿਨਾਂ ਦੀ, ਦੀਵਾਲੀ ਜਾਂ ਵਿਸਾਖੀ ਦੇ ਮੇਲੇ ਦੀ ਪਰਿਵਾਰਕ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'किसी त्योहार, दीवाली के दीयों या पारिवारिक मिलन की कोई पुरानी तस्वीर ढूंढिए।',
    },
  },
  {
    id: 'spark_lessons_vocation',
    category: 'lessons',
    title: 'Your First Honest Job & Early Work',
    linkedSceneId: 'part-3-scene-1',
    suggestedMediaMode: 'video',
    sparks: {
      en: 'Walk us through your very first job or craft. What did it feel like to earn your first wages, and what discipline did that work instil in you?',
      gu: 'તમારી પ્રથમ નોકરી કે ધંધા વિશે વાત કરો. જ્યારે પહેલી કમાણી હાથમાં આવી ત્યારે કેવો ગર્વ થયો હતો, અને તે કામથી તમને શું મૂલ્યવાન બોધ મળ્યો?',
      pa: 'ਆਪਣੀ ਪਹਿਲੀ ਨੌਕਰੀ ਜਾਂ ਕੰਮ-ਕਾਰ ਬਾਰੇ ਦੱਸੋ। ਜਦੋਂ ਪਹਿਲੀ ਕਮਾਈ ਹੱਥ ਵਿੱਚ ਆਈ ਤਾਂ ਕਿਹੋ ਜਿਹਾ ਅਹਿਸਾਸ ਹੋਇਆ ਸੀ, ਅਤੇ ਉਸ ਕੰਮ ਨੇ ਤੁਹਾਨੂੰ ਕੀ ਸਿਖਾਇਆ?',
      hi: 'अपनी पहली नौकरी या काम-धंधे के बारे में बताइए। जब पहली कमाई हाथ में आई थी तो कैसा गर्व महसूस हुआ था, और उस मेहनत ने आपको क्या सिखाया?',
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
    id: 'spark_humour_mishap',
    category: 'humour',
    title: 'The Mishap That Still Makes You Laugh',
    linkedSceneId: 'part-2-scene-1',
    suggestedMediaMode: 'audio',
    sparks: {
      en: 'What is the funniest mishap, family misunderstanding, or mischievous adventure that still brings tears of laughter to everyone around the dinner table?',
      gu: 'એવો કયો હાસ્યાસ્પદ બનાવ, રમૂજી ગેરસમજ કે બાળપણનું તોફાન છે જેની વાત નીકળે ત્યારે આજે પણ આખું કુટુંબ ખડખડાટ હસી પડે છે?',
      pa: 'ਕਿਹੜੀ ਅਜਿਹੀ ਹਾਸੋਹੀਣੀ ਘਟਨਾ ਜਾਂ ਸ਼ਰਾਰਤ ਹੈ ਜਿਸ ਦੀ ਗੱਲ ਚੱਲਦਿਆਂ ਹੀ ਅੱਜ ਵੀ ਪੂਰਾ ਪਰਿਵਾਰ ਹੱਸ-ਹੱਸ ਲੋਟ-ਪੋਟ ਹੋ ਜਾਂਦਾ ਹੈ?',
      hi: 'ऐसी कौन सी मजेदार घटना या बचपने की शरारत है जिसकी बात छिड़ते ही आज भी पूरा परिवार ठहाके मार कर हंस पड़ता है?',
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
      en: 'Look for a candid snapshot of your family sharing an unposed laugh or playful moment.',
      gu: 'પરિવારની હાસ્યભરી કે કોઈ અણધારી પળની મજેદાર, નિખાલસ તસવીર શોધો.',
      pa: 'ਪਰਿਵਾਰ ਦੇ ਹਾਸੇ-ਮਜ਼ਾਕ ਜਾਂ ਕਿਸੇ ਬੇਫ਼ਿਕਰ ਪਲ ਦੀ ਕੋਈ ਪੁਰਾਣੀ ਕੈਂਡਿਡ ਤਸਵੀਰ ਲੱਭੋ।',
      hi: 'परिवार के किसी हंसी-मजाक या बेफिक्र पल की कोई पुरानी अनौपचारिक तस्वीर निकालिए।',
    },
  },
  {
    id: 'spark_legacy_blessing',
    category: 'legacy',
    title: 'A Blessing for Future Generations',
    linkedSceneId: 'part-6-scene-1',
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
