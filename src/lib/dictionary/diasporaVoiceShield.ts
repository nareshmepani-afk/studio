/**
 * Diaspora Voice Shield & British English Orthography Lexicon
 * SPEC-MW-134 / Rule 20 / Rule 45 / Rule 48
 *
 * Protects authentic South Asian and East African diaspora oral memories
 * from being penalized by standard business-grammar linters.
 * Whitelists 400+ cultural loanwords and enforces UK British English orthography.
 */

export interface OrthographyMatch {
  id: string;
  original: string;
  replacement: string;
  index: number;
  message: string;
}

export interface ClicheMatch {
  id: string;
  phrase: string;
  index: number;
  suggestion: string;
  message: string;
}

// ---------------------------------------------------------------------------
// 1. DIASPORA CULTURAL LEXICON (400+ protected terms across Gujarati, Punjabi, Hindi & Diaspora English)
// ---------------------------------------------------------------------------
const DIASPORA_TERMS: string[] = [
  // Kinship & Family Terms of Address
  'ba', 'bapuji', 'mota bapu', 'kaka', 'kaki', 'mama', 'mami', 'masa', 'masi', 'fui', 'fua',
  'dada', 'dadi', 'nana', 'nani', 'bhai', 'ben', 'didi', 'bhabhi', 'jiju', 'nanand', 'derani',
  'jethani', 'sasuji', 'sasurji', 'beti', 'beta', 'dikro', 'dikri', 'babaji', 'nanaji', 'dadaji',
  'chachi', 'chacha', 'bua', 'fufa', 'taiji', 'tauji', 'veerji', 'bhenji', 'bibiji', 'pitaji',
  'mataji', 'ammachi', 'appacha', 'ammi', 'abba', 'nani ma', 'dadi ma', 'par-dada', 'par-dadi',

  // Foods, Flavours & Kitchen Rituals
  'chai', 'masala chai', 'rotli', 'roti', 'paratha', 'thepla', 'bhakhri', 'puri', 'khichdi',
  'kadhi', 'daal', 'dal', 'shaak', 'subzi', 'sambhar', 'dosa', 'idli', 'chutney', 'achaar',
  'papad', 'papadam', 'dhokla', 'khandvi', 'fafda', 'jalebi', 'khaman', 'patra', 'handvo',
  'sev', 'ganthia', 'chivda', 'shrikhand', 'halwa', 'ladoo', 'laddu', 'peda', 'barfi',
  'gulab jamun', 'rasgulla', 'mohanthal', 'kheer', 'seviyan', 'ghari', 'churma', 'samosa',
  'kachori', 'pakora', 'bhajia', 'vada', 'pauva', 'poha', 'upma', 'sheera', 'mithai',
  'mukhwas', 'saunf', 'elaichi', 'cardamom', 'kesar', 'saffron', 'hing', 'asafetida',
  'rai', 'jeera', 'cumin', 'haldi', 'turmeric', 'dhania', 'coriander', 'garam masala',
  'ghee', 'makhan', 'chaas', 'lassi', 'panipuri', 'bhelpuri', 'chaat', 'chole', 'bhature',
  'rajma', 'makki di roti', 'sarson da saag', 'pinni', 'mathri', 'kulfi', 'falooda',
  'tiffin', 'dabba', 'thali', 'katori', 'patila', 'kadai', 'belan', 'patlo', 'tawa', 'chimta',

  // Faith, Sacred Spaces, Rites & Celebrations
  'mandir', 'derasar', 'gurdwara', 'ashram', 'puja', 'pooja', 'aarti', 'arti', 'prasad',
  'prasadam', 'darshan', 'bhajan', 'kirtan', 'shabad', 'havan', 'homa', 'diya', 'divo',
  'agarbatti', 'incense', 'kumkum', 'chandan', 'tilak', 'rangoli', 'rakhi', 'raksha bandhan',
  'diwali', 'deepavali', 'navratri', 'garba', 'dandiya', 'holika', 'holi', 'vaisakhi',
  'baisakhi', 'janmashtami', 'ganesh chaturthi', 'paryushan', 'samvatsari', 'micchami dukkadam',
  'karwa chauth', 'lohri', 'teej', 'guru nanak gurpurab', 'langar', 'seva', 'ardas',
  'simran', 'japji', 'sukhmani', 'mantra', 'shloka', 'chalisa', 'hawan', 'ganga jal',
  'tulsi', 'rudraksha', 'mala', 'sindoor', 'mangalsutra', 'phera', 'mandap', 'sangeet',
  'mehndi', 'mehendi', 'haldi ceremony', 'vidai', 'baraat', 'kanyadaan', 'namaste',
  'namaskar', 'pranam', 'charan sparsh', 'sashtang', 'satsang', 'guru', 'panditji',
  'gyaniji', 'maharaj', 'swami', 'sadhu', 'upashraya', 'tirthankar', 'ahimsa', 'satya',

  // Attire, Adornments & Textiles
  'sari', 'saree', 'pallu', 'choli', 'lehenga', 'ghagra', 'salwar', 'shalwar', 'kameez',
  'kurta', 'kurti', 'pajama', 'pyjama', 'dupatta', 'chunni', 'odhni', 'chaniya', 'kediyu',
  'pagdi', 'turban', 'dastar', 'rumal', 'sherwani', 'bandhgala', 'nehru jacket', 'mojdi',
  'jooti', 'chappal', 'kolhapuri', 'bangles', 'chuda', 'chooda', 'kangan', 'payal',
  'anklet', 'nath', 'nose ring', 'jhumka', 'jhumki', 'tikka', 'bindi', 'chandlo',
  'khadi', 'chintz', 'bandhani', 'patola', 'banarasi', 'kanjivaram', 'chanderi', 'chikankari',

  // Home, Heritage & Daily Diaspora Life
  'rickshaw', 'auto-rickshaw', 'cycle-rickshaw', 'tonga', 'bazaar', 'haat', 'mohalla',
  'gali', 'pol', 'haveli', 'angan', 'verandah', 'jhula', 'hindolo', 'charpoy', 'khatia',
  'godadi', 'razai', 'trunk', 'godown', 'dukaan', 'chaiwala', 'dhobi', 'doodhwala',
  'sabziwala', 'postman', 'dakia', 'ferry', 'steamship', 'dhow', 'passenger liner',
  'docklands', 'tilbury', 'southall', 'wembley', 'leicester', 'nairobi', 'mombasa',
  'kampala', 'dar es salaam', 'zanzibar', 'aden', 'karachi', 'bombay', 'mumbai',
  'ahmedabad', 'surat', 'porbandar', 'rajkot', 'jamnagar', 'kutch', 'navsari', 'baroda',
  'vadodara', 'punjab', 'jalandhar', 'amritsar', 'ludhiana', 'lahore', 'uganda exodus',
  'east africa', 'partition', 'passport', 'alien registration', 'voucher', 'air india',
  'boac', 'heathrow', 'cotton mills', 'textile factories', 'corner shop', 'newsagent',
  'grocery', 'high street', 'parish hall', 'subcontinental', 'diaspora', 'pravasi',

  // Conversational Idioms & Colloquial Expressions
  'chalo', 'arre', 'are', 'achha', 'accha', 'theek chhe', 'theek hai', 'haan', 'na',
  'saru', 'bhalo', 'shukriya', 'dhanyavaad', 'aavjo', 'alvida', 'sat sri akal', 'jai shri krishna',
  'jai jinendra', 'ram ram', 'khamma ghani', 'waheguru', 'inshallah', 'mashaallah',
  'arre yaar', 'bhai re', 'saab', 'sahib', 'babu', 'seth', 'sheth', 'ji', 'hukum',
];

export const DIASPORA_LEXICON: Set<string> = new Set(
  DIASPORA_TERMS.map((t) => t.toLowerCase())
);

/**
 * Checks whether a word or phrase is in the protected diaspora lexicon.
 */
export function isProtectedDiasporaTerm(term: string): boolean {
  if (!term) return false;
  const clean = term.toLowerCase().replace(new RegExp('^[^\\p{L}\\p{N}]+|[^\\p{L}\\p{N}]+$', 'gu'), '');
  if (DIASPORA_LEXICON.has(clean)) return true;
  // Handle regular plural inflections (-s, -es) for diaspora heritage terms (e.g. samosas, rotis, diyas, mandirs)
  if (clean.endsWith('s') && DIASPORA_LEXICON.has(clean.slice(0, -1))) return true;
  if (clean.endsWith('es') && DIASPORA_LEXICON.has(clean.slice(0, -2))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// 2. UK BRITISH ENGLISH MANDATORY ORTHOGRAPHY MAPPINGS (Rule 20)
// ---------------------------------------------------------------------------
export const UK_ORTHOGRAPHY_MAPPINGS: Record<string, string> = {
  // -or to -our
  color: 'colour',
  colors: 'colours',
  colored: 'coloured',
  coloring: 'colouring',
  colorful: 'colourful',
  colorless: 'colourless',
  favorite: 'favourite',
  favorites: 'favourites',
  favor: 'favour',
  favors: 'favours',
  favored: 'favoured',
  favoring: 'favouring',
  favorable: 'favourable',
  flavor: 'flavour',
  flavors: 'flavours',
  flavored: 'flavoured',
  flavoring: 'flavouring',
  honor: 'honour',
  honors: 'honours',
  honored: 'honoured',
  honoring: 'honouring',
  honorable: 'honourable',
  humor: 'humour',
  humors: 'humours',
  humorous: 'humorous', // exception: humorous is correct in both
  labor: 'labour',
  labors: 'labours',
  labored: 'laboured',
  laboring: 'labouring',
  neighbor: 'neighbour',
  neighbors: 'neighbours',
  neighborhood: 'neighbourhood',
  neighborhoods: 'neighbourhoods',
  rumor: 'rumour',
  rumors: 'rumours',
  rumored: 'rumoured',
  harbor: 'harbour',
  harbors: 'harbours',
  harbored: 'harboured',
  behavior: 'behaviour',
  behaviors: 'behaviours',
  behavioral: 'behavioural',
  odor: 'odour',
  odors: 'odours',
  glamor: 'glamour',
  savior: 'saviour',
  saviors: 'saviours',
  vigor: 'vigour',
  ardor: 'ardour',
  candor: 'candour',
  valiant: 'valiant',

  // -er to -re
  center: 'centre',
  centers: 'centres',
  centered: 'centred',
  centering: 'centring',
  theater: 'theatre',
  theaters: 'theatres',
  theatrical: 'theatrical',
  fiber: 'fibre',
  fibers: 'fibres',
  meter: 'metre',
  meters: 'metres',
  liter: 'litre',
  liters: 'litres',
  caliber: 'calibre',
  somber: 'sombre',
  specter: 'spectre',
  luster: 'lustre',

  // -ize to -ise
  realize: 'realise',
  realizes: 'realises',
  realized: 'realised',
  realizing: 'realising',
  realization: 'realisation',
  recognize: 'recognise',
  recognizes: 'recognises',
  recognized: 'recognised',
  recognizing: 'recognising',
  recognition: 'recognition',
  organize: 'organise',
  organizes: 'organises',
  organized: 'organised',
  organizing: 'organising',
  organization: 'organisation',
  organizations: 'organisations',
  apologize: 'apologise',
  apologized: 'apologised',
  apologizing: 'apologising',
  synthesize: 'synthesise',
  synthesizes: 'synthesises',
  synthesized: 'synthesised',
  synthesizing: 'synthesising',
  synthesis: 'synthesis',
  minimize: 'minimise',
  minimizes: 'minimises',
  minimized: 'minimised',
  minimizing: 'minimising',
  maximize: 'maximise',
  maximized: 'maximised',
  memorize: 'memorise',
  memorized: 'memorised',
  prioritize: 'prioritise',
  prioritized: 'prioritised',
  emphasize: 'emphasise',
  emphasized: 'emphasised',
  characterize: 'characterise',
  characterized: 'characterised',

  // -yze to -yse
  analyze: 'analyse',
  analyzes: 'analyses',
  analyzed: 'analysed',
  analyzing: 'analysing',
  paralyze: 'paralyse',
  paralyzed: 'paralysed',

  // -se vs -ce
  defense: 'defence',
  defenses: 'defences',
  offense: 'offence',
  offenses: 'offences',
  pretense: 'pretence',
  license: 'licence', // noun in UK

  // Double 'l'
  traveling: 'travelling',
  traveled: 'travelled',
  traveler: 'traveller',
  travelers: 'travellers',
  canceling: 'cancelling',
  canceled: 'cancelled',
  modeling: 'modelling',
  modeled: 'modelled',
  signaling: 'signalling',
  signaled: 'signalled',
  dialing: 'dialling',
  dialed: 'dialled',
  fueling: 'fuelling',
  fueled: 'fuelled',
  enrollment: 'enrolment',
  fulfillment: 'fulfilment',
  fulfill: 'fulfil',
  skillful: 'skilful',

  // Misc UK vs US
  gray: 'grey',
  grays: 'greys',
  grayish: 'greyish',
  cozy: 'cosy',
  cozier: 'cosier',
  coziest: 'cosiest',
  cozily: 'cosily',
  judgment: 'judgement',
  acknowledgment: 'acknowledgement',
  program: 'programme', // narrative television or events programme (unless computer program)
  whiskey: 'whisky', // Scotch
  curb: 'kerb', // roadside pavement kerb
  pajamas: 'pyjamas',
};

/**
 * Scans text for American English spellings and returns UK English matches.
 */
export function checkUKOrthography(text: string): OrthographyMatch[] {
  if (!text || text.trim().length === 0) return [];
  const matches: OrthographyMatch[] = [];

  // Match words with unicode word boundary
  const wordRegex = /\b([a-zA-Z]+)\b/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const rawWord = match[1];
    const lower = rawWord.toLowerCase();

    if (UK_ORTHOGRAPHY_MAPPINGS[lower]) {
      const targetUK = UK_ORTHOGRAPHY_MAPPINGS[lower];
      // Preserve original casing (TitleCase vs lowercase vs UPPERCASE)
      let replacement = targetUK;
      if (rawWord === rawWord.toUpperCase() && rawWord.length > 1) {
        replacement = targetUK.toUpperCase();
      } else if (rawWord[0] === rawWord[0].toUpperCase()) {
        replacement = targetUK.charAt(0).toUpperCase() + targetUK.slice(1);
      }

      matches.push({
        id: `orthography-${match.index}`,
        original: rawWord,
        replacement,
        index: match.index,
        message: `UK English standard: use "${replacement}" instead of "${rawWord}".`,
      });
    }
  }

  return matches;
}

// ---------------------------------------------------------------------------
// 3. AI CLICHÉ & SCREENPLAY CUE GUARD (Rule 11)
// ---------------------------------------------------------------------------
const BANNED_CLICHES: Array<{ pattern: RegExp; suggestion: string; reason: string }> = [
  {
    pattern: /\btapestry\s+of\s+(?:memories|time|life|history|moments|emotions)\b/gi,
    suggestion: 'rich collection of moments',
    reason: 'Overused AI cliché ("tapestry of memories"). Prefer specific concrete detail.',
  },
  {
    pattern: /\bwhispers?\s+of\s+(?:the\s+past|time|history|yesterday)\b/gi,
    suggestion: 'distant memories of',
    reason: 'Melodramatic AI cliché. State the actual sound or feeling instead.',
  },
  {
    pattern: /\bvibrant\s+tapestry\b/gi,
    suggestion: 'vivid memories',
    reason: 'Generic AI cliché ("vibrant tapestry").',
  },
  {
    pattern: /\bstands?\s+as\s+a\s+testament\s+to\b/gi,
    suggestion: 'reminds us of',
    reason: 'Stilted essayist cliché ("stands as a testament"). Speak naturally.',
  },
  {
    pattern: /\bunfolding\s+before\s+my\s+eyes\b/gi,
    suggestion: 'happening right in front of me',
    reason: 'Pompous cliché. Use direct spoken phrasing.',
  },
  {
    pattern: /\b(?:a\s+)?symphony\s+of\s+(?:sounds|flavou?rs|smells|scents|colours)\b/gi,
    suggestion: 'blend of',
    reason: 'Flowery cliché. Describe the specific sensory note.',
  },
  {
    pattern: /\b(?:a\s+)?dance\s+of\s+(?:shadows|light|dust\s+motes)\b/gi,
    suggestion: 'flicker of',
    reason: 'Over-embellished screenplay phrasing.',
  },
  {
    pattern: /\b(?:cut\s+to|fade\s+in|fade\s+out|wide\s+shot|close-up|camera\s+zooms?)\b/gi,
    suggestion: '',
    reason: 'Screenplay/camera direction banned per Rule 11. Monologues must be spoken personal reflections.',
  },
];

/**
 * Detects AI cliches and banned screenplay directives in the script text.
 */
export function detectAIClichés(text: string): ClicheMatch[] {
  if (!text || text.trim().length === 0) return [];
  const matches: ClicheMatch[] = [];

  for (const item of BANNED_CLICHES) {
    const rx = new RegExp(item.pattern.source, item.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = rx.exec(text)) !== null) {
      matches.push({
        id: `cliche-${match.index}`,
        phrase: match[0],
        index: match.index,
        suggestion: item.suggestion,
        message: item.reason,
      });
    }
  }

  return matches;
}

// ---------------------------------------------------------------------------
// 4. ACTIVE DIASPORA & UK VOICE SHIELD BADGE DETECTOR (SPEC-MW-178)
// ---------------------------------------------------------------------------

/**
 * Common general-English words/phrases included in DIASPORA_TERMS for linter protection
 * that should NOT be badged as South Asian/East African loanwords in UI chips
 * (e.g. "are" in English vs romanized Hindi "arre/are").
 */
const GENERAL_ENGLISH_SHIELD_EXCLUSIONS = new Set<string>([
  'are', 'na', 'cardamom', 'saffron', 'asafetida', 'cumin', 'turmeric', 'coriander',
  'incense', 'turban', 'bangles', 'anklet', 'nehru jacket', 'nose ring',
  'verandah', 'trunk', 'postman', 'ferry', 'steamship', 'passenger liner',
  'docklands', 'tilbury', 'southall', 'wembley', 'leicester', 'nairobi', 'mombasa',
  'kampala', 'dar es salaam', 'zanzibar', 'aden', 'karachi', 'bombay', 'mumbai',
  'ahmedabad', 'surat', 'porbandar', 'rajkot', 'jamnagar', 'kutch', 'navsari', 'baroda',
  'vadodara', 'punjab', 'jalandhar', 'amritsar', 'ludhiana', 'lahore', 'uganda exodus',
  'east africa', 'partition', 'passport', 'alien registration', 'voucher', 'air india',
  'boac', 'heathrow', 'cotton mills', 'textile factories', 'corner shop', 'newsagent',
  'grocery', 'high street', 'parish hall', 'subcontinental', 'diaspora',
]);

const MULTI_WORD_HERITAGE_PHRASES: string[] = DIASPORA_TERMS
  .map((t) => t.toLowerCase())
  .filter((t) => t.includes(' ') && !GENERAL_ENGLISH_SHIELD_EXCLUSIONS.has(t))
  .sort((a, b) => b.length - a.length);

const DISTINCTIVE_UK_SPELLINGS: Set<string> = new Set(
  Object.entries(UK_ORTHOGRAPHY_MAPPINGS)
    .filter(([us, uk]) => us.toLowerCase() !== uk.toLowerCase())
    .map(([, uk]) => uk.toLowerCase())
);

/**
 * Scans script prose and returns deduplicated heritage loanwords (e.g. diya, mandir,
 * masala chai, roti, samosas) and verified British/Commonwealth spellings (e.g. realise,
 * favourite, colour, theatre) in order of appearance for Scribe's Margin shield badges.
 */
export function detectShieldedTerms(text: string): {
  diasporaTerms: string[];
  ukTerms: string[];
} {
  if (!text || text.trim().length === 0) {
    return { diasporaTerms: [], ukTerms: [] };
  }

  const foundDiaspora: Array<{ index: number; end: number; label: string }> = [];
  const seenDiaspora = new Set<string>();

  // 1. Match multi-word heritage phrases first (e.g. "masala chai") so constituent tokens aren't duplicated
  for (const phrase of MULTI_WORD_HERITAGE_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const rx = new RegExp(`\\b${escaped}s?\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = rx.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      const overlaps = foundDiaspora.some((f) => start < f.end && end > f.index);
      const norm = m[0].replace(/\s+/g, ' ').toLowerCase();
      if (!overlaps && !seenDiaspora.has(norm)) {
        seenDiaspora.add(norm);
        foundDiaspora.push({ index: start, end, label: m[0].replace(/\s+/g, ' ') });
      }
    }
  }

  // 2. Match single-word heritage terms (including -s/-es plurals like "samosas") & verified UK spellings
  const ukTerms: string[] = [];
  const seenUk = new Set<string>();
  const wordRx = new RegExp("[\\p{L}][\\p{L}'’-]*[\\p{L}]|[\\p{L}]", 'gu');
  let wm: RegExpExecArray | null;

  while ((wm = wordRx.exec(text)) !== null) {
    const start = wm.index;
    const end = start + wm[0].length;
    const rawWord = wm[0];
    const lower = rawWord.toLowerCase();

    const insidePhrase = foundDiaspora.some((f) => start >= f.index && end <= f.end);
    if (!insidePhrase) {
      // Check non-excluded diaspora heritage term (singular or -s / -es plural)
      const baseSingular =
        DIASPORA_LEXICON.has(lower)
          ? lower
          : lower.endsWith('es') && DIASPORA_LEXICON.has(lower.slice(0, -2))
          ? lower.slice(0, -2)
          : lower.endsWith('s') && DIASPORA_LEXICON.has(lower.slice(0, -1))
          ? lower.slice(0, -1)
          : null;

      if (baseSingular && !GENERAL_ENGLISH_SHIELD_EXCLUSIONS.has(baseSingular) && !seenDiaspora.has(lower) && !seenDiaspora.has(baseSingular)) {
        seenDiaspora.add(lower);
        seenDiaspora.add(baseSingular);
        foundDiaspora.push({ index: start, end, label: rawWord });
      }
    }

    if (DISTINCTIVE_UK_SPELLINGS.has(lower) && !seenUk.has(lower)) {
      seenUk.add(lower);
      ukTerms.push(rawWord);
    }
  }

  foundDiaspora.sort((a, b) => a.index - b.index);
  return {
    diasporaTerms: foundDiaspora.map((f) => f.label),
    ukTerms,
  };
}

