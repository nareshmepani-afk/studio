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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Aroma of your mother's cooking",
                    placeholder: "e.g. Spices, baking..."
          },
          {
                    id: "sense2",
                    label: "Language spoken at dinner",
                    placeholder: "e.g. Spanish, English..."
          },
          {
                    id: "sense3",
                    label: "Texture of a family heirloom",
                    placeholder: "e.g. Smooth wood, rigid..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Smell of the living room",
                    placeholder: "e.g. Old carpet, wood polish..."
          },
          {
                    id: "sense2",
                    label: "Sounds from outside the window",
                    placeholder: "e.g. Traffic, birds, children playing..."
          },
          {
                    id: "sense3",
                    label: "Feeling of the front door handle",
                    placeholder: "e.g. Cold brass, chipped paint..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Scent of old schoolbooks",
                    placeholder: "e.g. Dusty paper, fresh ink..."
          },
          {
                    id: "sense2",
                    label: "Sounds of the playground",
                    placeholder: "e.g. Shouting, skipping ropes..."
          },
          {
                    id: "sense3",
                    label: "Texture of your favorite toy",
                    placeholder: "e.g. Soft plush, hard plastic..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Smell of your friend's house",
                    placeholder: "e.g. Lavender, cooking spices..."
          },
          {
                    id: "sense2",
                    label: "A shared song or laugh",
                    placeholder: "e.g. 90s pop, deep chuckles..."
          },
          {
                    id: "sense3",
                    label: "Feeling of walking side by side",
                    placeholder: "e.g. Bumping shoulders, cold wind..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The sudden silence or noise",
                    placeholder: "e.g. A quiet room, a loud crack..."
          },
          {
                    id: "sense2",
                    label: "The physical sensation of shock",
                    placeholder: "e.g. Cold sweat, heavy chest..."
          },
          {
                    id: "sense3",
                    label: "Smell of a hospital or unfamiliar place",
                    placeholder: "e.g. Antiseptic, stale air..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The weight of the decision",
                    placeholder: "e.g. Tense shoulders, racing heartbeat..."
          },
          {
                    id: "sense2",
                    label: "The environment where you decided",
                    placeholder: "e.g. A dim café, a windy cliff..."
          },
          {
                    id: "sense3",
                    label: "Aroma of the moment",
                    placeholder: "e.g. Stale coffee, fresh rain..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The sound of the realization",
                    placeholder: "e.g. A dropped pencil, a sigh..."
          },
          {
                    id: "sense2",
                    label: "The feeling of starting over",
                    placeholder: "e.g. Blank page, empty room..."
          },
          {
                    id: "sense3",
                    label: "Smell of a late night working",
                    placeholder: "e.g. Cold pizza, burning lamp..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Scent of a foreign city or campus",
                    placeholder: "e.g. Spices, old library books..."
          },
          {
                    id: "sense2",
                    label: "Sound of a train or lecture hall",
                    placeholder: "e.g. Whistle blowing, chalk tapping..."
          },
          {
                    id: "sense3",
                    label: "Texture of a heavy backpack",
                    placeholder: "e.g. Canvas straps, heavy books..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Smell of your first apartment",
                    placeholder: "e.g. Fresh paint, damp wood..."
          },
          {
                    id: "sense2",
                    label: "Sound of your own keys",
                    placeholder: "e.g. Jingling in the lock..."
          },
          {
                    id: "sense3",
                    label: "Feeling of independence",
                    placeholder: "e.g. A deep breath, tired feet..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Their signature scent",
                    placeholder: "e.g. Vanilla perfume, sandalwood..."
          },
          {
                    id: "sense2",
                    label: "The sound of their voice or laugh",
                    placeholder: "e.g. A quiet chuckle, a loud guffaw..."
          },
          {
                    id: "sense3",
                    label: "The feeling of holding hands",
                    placeholder: "e.g. Warmth, sweaty palms..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Smell of baby powder",
                    placeholder: "e.g. Fresh lotion, warm milk..."
          },
          {
                    id: "sense2",
                    label: "The first cry",
                    placeholder: "e.g. A sharp wail, a soft coo..."
          },
          {
                    id: "sense3",
                    label: "The weight of holding them",
                    placeholder: "e.g. Heavy and fragile..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The feeling of an empty room",
                    placeholder: "e.g. Echoes, cold air..."
          },
          {
                    id: "sense2",
                    label: "The scent of a packed box",
                    placeholder: "e.g. Cardboard, dust..."
          },
          {
                    id: "sense3",
                    label: "Sound of a closing door",
                    placeholder: "e.g. A soft click, a heavy slam..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The heat of the moment",
                    placeholder: "e.g. Sweaty palms, flushed face..."
          },
          {
                    id: "sense2",
                    label: "The loudest sound you ignored",
                    placeholder: "e.g. Sirens, yelling..."
          },
          {
                    id: "sense3",
                    label: "Smell of exhaustion",
                    placeholder: "e.g. Sweat, stale adrenaline..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Smell of incense or old books",
                    placeholder: "e.g. Sandalwood, dusty pages..."
          },
          {
                    id: "sense2",
                    label: "The sound of chanting or silence",
                    placeholder: "e.g. A choir, absolute quiet..."
          },
          {
                    id: "sense3",
                    label: "Feeling of kneeling or sitting still",
                    placeholder: "e.g. Hard floor, soft carpet..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The feeling of a healed scar",
                    placeholder: "e.g. Smooth skin, a phantom ache..."
          },
          {
                    id: "sense2",
                    label: "The sound of giving advice",
                    placeholder: "e.g. A calm voice, a steady breath..."
          },
          {
                    id: "sense3",
                    label: "Smell of a new beginning",
                    placeholder: "e.g. Fresh morning air..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Smell of ink and stationary",
                    placeholder: "e.g. Fresh paper, fountain pen..."
          },
          {
                    id: "sense2",
                    label: "The sound of a ticking clock",
                    placeholder: "e.g. Slow ticking, birds outside..."
          },
          {
                    id: "sense3",
                    label: "Texture of the desk",
                    placeholder: "e.g. Scratchy wood, smooth glass..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The feeling of deep thought",
                    placeholder: "e.g. A furrowed brow, resting chin..."
          },
          {
                    id: "sense2",
                    label: "The ambient noise of your sanctuary",
                    placeholder: "e.g. Rain on the roof, a fan humming..."
          },
          {
                    id: "sense3",
                    label: "Smell of your favorite tea/coffee",
                    placeholder: "e.g. Earthy matcha, dark roast..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The feeling of cool glass",
                    placeholder: "e.g. Touching the mirror, cold water..."
          },
          {
                    id: "sense2",
                    label: "The sound of your own breathing",
                    placeholder: "e.g. Slow and rhythmic..."
          },
          {
                    id: "sense3",
                    label: "Scent of your bathroom or room",
                    placeholder: "e.g. Soap, damp towel..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The quiet sigh of relief",
                    placeholder: "e.g. A long exhale..."
          },
          {
                    id: "sense2",
                    label: "The feeling of a warm smile",
                    placeholder: "e.g. Relaxed shoulders..."
          },
          {
                    id: "sense3",
                    label: "Smell of an ordinary, good day",
                    placeholder: "e.g. Fresh laundry, a lit candle..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Smell of the upcoming season",
                    placeholder: "e.g. Crisp autumn air, spring rain..."
          },
          {
                    id: "sense2",
                    label: "The sound of wind or an open road",
                    placeholder: "e.g. Tires humming, leaves rustling..."
          },
          {
                    id: "sense3",
                    label: "The feeling of looking at the horizon",
                    placeholder: "e.g. Squinting eyes, a deep breath..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The memory of a specific taste",
                    placeholder: "e.g. Sweet cake, bitter medicine..."
          },
          {
                    id: "sense2",
                    label: "The feeling of a familiar embrace",
                    placeholder: "e.g. Tight hug, pat on the back..."
          },
          {
                    id: "sense3",
                    label: "Sound of an old song playing",
                    placeholder: "e.g. A crackling record, a muffled radio..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The solid weight of conviction",
                    placeholder: "e.g. Standing tall, planting feet..."
          },
          {
                    id: "sense2",
                    label: "The sound of a definitive statement",
                    placeholder: "e.g. A clear voice, a gavel striking..."
          },
          {
                    id: "sense3",
                    label: "Smell of a courtroom or office",
                    placeholder: "e.g. Polished wood, stale air..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The feeling of an unwritten page",
                    placeholder: "e.g. Boundless, a slight chill..."
          },
          {
                    id: "sense2",
                    label: "The sound of footsteps walking away",
                    placeholder: "e.g. Crunching gravel, fading echoes..."
          },
          {
                    id: "sense3",
                    label: "Scent of old photos and dust",
                    placeholder: "e.g. Musty paper, dried flowers..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The dizzying feeling of remembering",
                    placeholder: "e.g. A rush of blood, a wide-eyed stare..."
          },
          {
                    id: "sense2",
                    label: "The sound of a flashback",
                    placeholder: "e.g. A distorted voice, a fading bell..."
          },
          {
                    id: "sense3",
                    label: "Smell of a childhood home",
                    placeholder: "e.g. Pine cleaner, old spices..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Scent of your grandparents' home",
                    placeholder: "e.g. Mothballs, baking bread..."
          },
          {
                    id: "sense2",
                    label: "The sound of their stories",
                    placeholder: "e.g. A cracking voice, an accent..."
          },
          {
                    id: "sense3",
                    label: "Texture of their hands",
                    placeholder: "e.g. Calloused, wrinkled and soft..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "Smell of a holiday meal",
                    placeholder: "e.g. Roast turkey, sweet spices..."
          },
          {
                    id: "sense2",
                    label: "Sounds of a family gathering",
                    placeholder: "e.g. Clinking glasses, overlapping laughter..."
          },
          {
                    id: "sense3",
                    label: "Feeling of a traditional garment",
                    placeholder: "e.g. Scratchy wool, smooth silk..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The atmosphere on a historic day",
                    placeholder: "e.g. Tense quiet, chaotic noise..."
          },
          {
                    id: "sense2",
                    label: "Sound of a news broadcast",
                    placeholder: "e.g. Static radio, a solemn anchor..."
          },
          {
                    id: "sense3",
                    label: "The feeling of huddled shoulders",
                    placeholder: "e.g. Sitting close together..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The tone of a stern lesson",
                    placeholder: "e.g. A low voice, a pointed finger..."
          },
          {
                    id: "sense2",
                    label: "The feeling of pride",
                    placeholder: "e.g. A chest swelling, a tear forming..."
          },
          {
                    id: "sense3",
                    label: "Smell of hard work",
                    placeholder: "e.g. Motor oil, sweat, dirt..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The look of an old photograph",
                    placeholder: "e.g. Sepia tones, cracked edges..."
          },
          {
                    id: "sense2",
                    label: "The legend of their voice",
                    placeholder: "e.g. Booming, gentle..."
          },
          {
                    id: "sense3",
                    label: "Scent of an artifact they left behind",
                    placeholder: "e.g. Old brass, leather..."
          }
],
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
        sensoryPrompts: [
          {
                    id: "sense1",
                    label: "The sound of you speaking to them",
                    placeholder: "e.g. A hopeful whisper, a clear wish..."
          },
          {
                    id: "sense2",
                    label: "The feeling of passing the torch",
                    placeholder: "e.g. Letting go, a firm handshake..."
          },
          {
                    id: "sense3",
                    label: "Smell of a new dawn",
                    placeholder: "e.g. Dew on grass, fresh air..."
          }
],
        isFlaggedForReuse: false,
      },
    ],
  },
];

export const mockPrompts: Prompt[] = mockPromptGroups.flatMap(group => 
    group.prompts.flatMap(prompt => [prompt, ...(prompt.subPrompts || [])])
);
