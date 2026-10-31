# Memory Weaver: The Ultimate Hybrid Curriculum Standard
## Master Reference Document for NotebookLM: 6-Part / 24-Scene Symmetric Memoir Architecture
**Document Version:** 1.0.0 (Unified SSOT)  
**Classification:** Product Architecture, Narrative Design & Ergonomic Standard  
**Target Systems:** Desktop Studio (`/studio`), Fireside Mobile (`/studio/fireside`), Print Heirloom Engine, Master Reel Timeline, Audio Podcast Synthesiser  
**Verified Platform Commit SHA:** `d21e24dd`  

---

## 1. Executive Summary & Vision

Memory Weaver is an intelligent, multi-format autobiography studio engineered to capture, preserve, and celebrate generational family heritage. The platform transforms first-person recollections into three heirloom-grade deliverables:

1. **The Cinematic Video Memoir**: A multi-chapter, broadcast-quality documentary featuring authentic spoken monologues, historical B-roll photograph overlays, and dynamic soundscape integration.
2. **The Hardcover Heirloom Book**: A bound, typeset volume complete with archival photography plates, sensory vignettes, oral transcripts, and chapter forewords.
3. **The Oral History Audio Album**: An uncompressed acoustic archive and narrated podcast reel accompanied by subtle ambient musical scoring.

To achieve this across diverse generations—from 85-year-old immigrant grandparents sharing their migration journey to adult children recording family folklore—the curriculum must be **emotionally safe**, **cognitively manageable**, **culturally resonant**, and **structurally symmetric**.

The **Ultimate Hybrid Curriculum** standardises the entire platform on a **6-Part × 4-Scene = 24 Symmetric Scenes** architecture. This document defines the canonical specification, historical rationale, and multi-format adaptation rules for NotebookLM analysis.

---

## 2. The Dual-Surface Ergonomic Standard

A core principle of Memory Weaver is **Surface Containment without Taxonomy Divergence**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CANONICAL CURRICULUM SSOT                              │
│       masterStoryStructure.ts  ◄─────────────►  firesidePrompts.ts          │
│               (6 Parts • 24 Core Scenes • 100% Title Equality)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│           DESKTOP STUDIO              │ │          FIRESIDE MOBILE          │
│          (/studio/production)         │ │         (/studio/fireside)        │
├───────────────────────────────────────┤ ├───────────────────────────────────┤
│ • Cinematic Soundstage (Act I–IV)     │ │ • Cozy Armchair Capture           │
│ • Teleprompter Speed & Pace Controls  │ │ • Conversational Memory Sparks     │
│ • External USB Camera/Mic Ingress     │ │ • 1-Tap Sensory Anchors            │
│ • Multi-Segment Video Timeline Review │ │ • Low-Friction Voice & Photo Memos │
│ • Print & Book Proofing Layouts       │ │ • Diaspora Multilingual Toggle    │
└───────────────────────────────────────┘ └───────────────────────────────────┘
```

### The Non-Negotiable Law of 1:1 Parity
- **Zero Cognitive Friction**: A narrator who begins drafting an idea on their phone in the evening on Fireside Mobile must see the exact same Chapter Name (`Part II: Formative Years & Early Echoes`) and Scene Title (`Scene 3: Crossroads and Choices`) when sitting down at their desk the next morning in the Desktop Studio.
- **Unified Identifiers**: Every scene shares an immutable pair of tokens across both surfaces: `id` (e.g. `part-2-scene-3`) and canonical `promptId` (e.g. `p6`).
- **Surface Autonomy**: While the presentation format adapts to device ergonomics (wide soundstage vs compact phone cards), the narrative prompts, questions, and titles remain identical.

---

## 3. Structural Evolution: Why the Ultimate Hybrid Won

To appreciate the design of the Ultimate Hybrid Standard, NotebookLM should evaluate the comparative matrix across three historical iterations:

| Feature / Metric | Source A (Original Template) | Source B (Early Expansion) | Ultimate Hybrid Standard (Canonical) |
| :--- | :--- | :--- | :--- |
| **Total Parts** | 5 Parts | 6 Parts | **6 Parts** |
| **Total Core Scenes** | 24 Prompts | 25 Scenes | **24 Scenes** |
| **Scene Distribution** | 5, 4, 5, 5, 5 *(Asymmetric)* | 4, 4, 4, 4, 4, 5 *(Lopsided End)* | **4, 4, 4, 4, 4, 4 (Perfect Symmetry)** |
| **Cognitive Workload** | High (5 scenes = ~60+ min) | Uneven in finale | **Optimal (4 scenes = ~35–45 min sitting)** |
| **Emotional Pacing** | Whim-whams (Love & Loss mixed) | Segregated chapters | **Harmonious (Love in Pt III, Trials in Pt IV)** |
| **Diaspora Anchor** | Missing cultural feast scene | Included (`p3_b`) | **Preserved (`p3_b` Traditions & Feasts)** |
| **Finale Structure** | Standalone reflection prompt | Standalone reflection prompt | **Synthesised into capstone blessing (`p23`)** |
| **Backward Compatibility** | High orphan risk | Zero alias mapping | **100% resilient alias mapping (`p24` -> `p23`)** |

### Key Rationale Pillars:
1. **Preventing Elder Cognitive Fatigue**:
   - Elderly narrators typically experience vocal strain and cognitive exhaustion after 35–45 minutes of active recollection.
   - 4 scenes per chapter establishes an instinctive, predictable rhythm: one chapter per recording session.
2. **Eliminating Emotional Whiplash**:
   - Source A combined *Falling in Love with Life* and *The Birth of Children* with *The Test of Fire* and *Holding On, Letting Go* in a single chapter.
   - The Ultimate Hybrid isolates romance, marriage, and early family life into **Part III**, allowing the narrator to dwell in joy before facing deep adversity and resilience in **Part IV**.
3. **Preserving Diaspora Cultural Identity**:
   - For immigrant and diaspora families, food, festive rituals, and faith gatherings are the bedrock of memory.
   - Retaining `part-1-scene-4` (*Traditions, Feasts & Sacred Days*) ensures elders can memorialize festival memories (Diwali, Eid, Vaisakhi, Hanukkah, Sunday roasts) as an essential foundation.
4. **Part VI Capstone Synthesis**:
   - Rather than ending with an abstract meta-prompt (*Time Travel, Reflections*), the Ultimate Hybrid synthesises retrospective wisdom directly into Scene 4: *The Story Continues*, concluding the biography on a heartfelt, outward blessing for future descendants.

---

## 4. The Canonical 6-Part / 24-Scene Curriculum Specification

```
═══════════════════════════════════════════════════════════════════════════════
PART I: ROOTS AND FOUNDATIONS
Theme: Ancestry, early geography, sensual childhood memories, and cultural roots.
═══════════════════════════════════════════════════════════════════════════════
```

### Scene 1: A Child of Two Worlds
- **Identifiers**: `id: part-1-scene-1` | `promptId: p1` | `sparkId: spark_roots_foundations`
- **Canonical Title**: **A Child of Two Worlds**
- **Multilingual Titles**:
  - English: *A Child of Two Worlds*
  - Gujarati: બે વિશ્વનું બાળક
  - Punjabi: ਦੋ ਦੁਨੀਆਂ ਦਾ ਬੱਚਾ
  - Hindi: दो दुनिया का बच्चा
- **Narrative Thesis**: Exploring your birthplace, family roots, and the cultural crossroads that shaped your beginnings.
- **Spoken Brainstorm Spark**: *"Where does your story truly begin? Take us back to the place of your birth, the landscape of your ancestors, and the cultural currents that flowed through your childhood home."*
- **Sensory Catalysts**:
  - *Visual*: The landscape outside your childhood window; the light in your mother's kitchen.
  - *Soundscape*: Languages spoken in the household; morning street sounds or birds.
  - *Aroma*: Traditional cooking aromas, earth after rain, incense or woodsmoke.
  - *Tactile*: The texture of old blankets, family clothing, or grandfather's hands.
- **Multi-Format Adaptation**:
  - *Video*: Opening establishing shots; juxtaposition of old black-and-white birthplace photos with narrator's direct camera gaze.
  - *Book*: Chapter 1 opening vignette; framed family tree or archival birth map plate.
  - *Audio*: Intimate acoustic intro with faint traditional drone or field recordings.

### Scene 2: The House I Grew Up In
- **Identifiers**: `id: part-1-scene-2` | `promptId: p2` | `sparkId: spark_childhood_home`
- **Canonical Title**: **The House I Grew Up In**
- **Multilingual Titles**:
  - English: *The House I Grew Up In*
  - Gujarati: મારું બાળપણનું ઘર
  - Punjabi: ਮੇਰਾ ਬਚਪਨ ਦਾ ਘਰ
  - Hindi: मेरा बचपन का घर
- **Narrative Thesis**: Daily routines, architecture, family rhythms, and earliest sensory imprints of home.
- **Spoken Brainstorm Spark**: *"Walk us through the front door of your childhood home. What did you smell, who was usually in the kitchen or parlour, and where did you feel safest?"*
- **Sensory Catalysts**:
  - *Visual*: Creaking floorboards, peeling wallpaper patterns, courtyard sunlight.
  - *Soundscape*: Clinking tea cups, voices calling from upstairs, radio playing news.
  - *Aroma*: Fresh bread, spiced tea, damp brick, laundry detergent.
- **Multi-Format Adaptation**:
  - *Video*: Panning photos of the family hearth, childhood bedroom, or neighbourhood street.
  - *Book*: Architectural sketch or vintage snapshot of the family homestead with detailed caption.
  - *Audio*: Spatial sound design emphasizing the interior acoustics of a home.

### Scene 3: Innocence and Curiosity
- **Identifiers**: `id: part-1-scene-3` | `promptId: p3` | `sparkId: spark_innocence_curiosity`
- **Canonical Title**: **Innocence and Curiosity**
- **Multilingual Titles**:
  - English: *Innocence and Curiosity*
  - Gujarati: નિર્દોષતા અને જિજ્ઞાસા
  - Punjabi: ਮਾਸੂਮੀਅਤ ਅਤੇ ਉਤਸੁਕਤਾ
  - Hindi: मासूमियत और जिज्ञासा
- **Narrative Thesis**: School days, early friendships, boundless dreams, and moments of uninhibited wonder.
- **Spoken Brainstorm Spark**: *"Remember a moment when the world felt magical, boundless, or completely safe. What was your favourite childhood secret or fascination?"*
- **Sensory Catalysts**:
  - *Visual*: School uniforms, chalkboards, dusty playgrounds, worn satchels.
  - *Soundscape*: School bells, childhood laughter, neighbourhood games.
  - *Tactile*: Scraping knees on pavement, carrying heavy books, cold river water.
- **Multi-Format Adaptation**:
  - *Video*: Fast-paced montage of childhood photographs, school reports, or handwritten drawings.
  - *Book*: Reproduction of a childhood school report card, certificate, or hand-drawn map.
  - *Audio*: Playful cadence, natural pauses as the narrator chuckles at childhood antics.

### Scene 4: Traditions, Feasts & Sacred Days
- **Identifiers**: `id: part-1-scene-4` | `promptId: p3_b` | `sparkId: spark_traditions_feasts`
- **Canonical Title**: **Traditions, Feasts & Sacred Days**
- **Multilingual Titles**:
  - English: *Traditions, Feasts & Sacred Days*
  - Gujarati: પરંપરાઓ, ઉત્સવો અને પવિત્ર દિવસો
  - Punjabi: ਪਰੰਪਰਾਵਾਂ, ਤਿਉਹਾਰ ਅਤੇ ਪਵਿੱਤਰ ਦਿਨ
  - Hindi: परंपराएं, त्योहार और पवित्र दिन
- **Narrative Thesis**: Cultural gatherings, holiday rituals, sacred recipes, and community celebrations.
- **Spoken Brainstorm Spark**: *"What festive aroma or holiday ritual instantly transports you to your grandmother's table? Who sat where, and what was the laughter like?"*
- **Sensory Catalysts**:
  - *Aroma*: Cardamom, roasted meats, turmeric, festive candles, baking dough.
  - *Soundscape*: Group prayers, temple bells, Christmas carols, folk songs, relatives talking over each other.
  - *Visual*: Best festive clothing, brass plates, embroidered tablecloths, festival lanterns.
- **Multi-Format Adaptation**:
  - *Video*: Rich color-graded footage highlighting festival photos and multi-generational feasts.
  - *Book*: Dedicated recipe card or festive banquet photo plate.
  - *Audio*: Warm, celebratory soundscape with subtle celebratory instrumentation.

---

```
═══════════════════════════════════════════════════════════════════════════════
PART II: FORMATIVE YEARS & EARLY ECHOES
Theme: Adolescent identity, sibling bonds, initial brushes with adversity, and mentors.
═══════════════════════════════════════════════════════════════════════════════
```

### Scene 1: Echoes of a Brother, Sister or Friends
- **Identifiers**: `id: part-2-scene-1` | `promptId: p4` | `sparkId: spark_humour_mishap`
- **Canonical Title**: **Echoes of a Brother, Sister or Friends**
- **Multilingual Titles**:
  - English: *Echoes of a Brother, Sister or Friends*
  - Gujarati: ભાઈ, બહેન અથવા મિત્રોના પડઘા
  - Punjabi: ਭੈਣ-ਭਰਾ ਜਾਂ ਦੋਸਤਾਂ ਦੀਆਂ ਯਾਦਾਂ
  - Hindi: भाई, बहन या दोस्तों की यादें
- **Narrative Thesis**: Formative friendships, sibling camaraderie, playful rebellions, and key peers.
- **Spoken Brainstorm Spark**: *"Tell the story of a childhood accomplice—a brother, sister, or best friend—who knew your secrets. What adventure or mishap did you share?"*

### Scene 2: The Shape of Loss
- **Identifiers**: `id: part-2-scene-2` | `promptId: p5` | `sparkId: spark_wisdom_hardship`
- **Canonical Title**: **The Shape of Loss**
- **Multilingual Titles**:
  - English: *The Shape of Loss*
  - Gujarati: નુકસાન અને વિદાયનું સ્વરૂપ
  - Punjabi: ਵਿਛੋੜੇ ਅਤੇ ਦੁੱਖ ਦਾ ਅਹਿਸਾਸ
  - Hindi: बिछड़ने और नुकसान का अहसास
- **Narrative Thesis**: First encounters with grief, separation, illness, or youth hardship.
- **Spoken Brainstorm Spark**: *"Reflect on the very first time you realized the world could be fragile or unfair. Who helped you bear that burden, and what quiet strength did it awaken?"*

### Scene 3: Crossroads and Choices
- **Identifiers**: `id: part-2-scene-3` | `promptId: p6` | `sparkId: spark_lessons_vocation`
- **Canonical Title**: **Crossroads and Choices**
- **Multilingual Titles**:
  - English: *Crossroads and Choices*
  - Gujarati: આંતરછેદ અને પસંદગીઓ
  - Punjabi: ਚੌਰਾਹੇ ਅਤੇ ਫੈਸਲੇ
  - Hindi: मोड़ और फैसले
- **Narrative Thesis**: Adolescence, moral crossroads, career decisions, and carving one's identity.
- **Spoken Brainstorm Spark**: *"Walk us through your first pivotal life decision—a job, a voyage, or standing up for your beliefs. What did you sacrifice to choose your path?"*

### Scene 4: Learning the Hard Way
- **Identifiers**: `id: part-2-scene-4` | `promptId: p7` | `sparkId: spark_learning_hard_way`
- **Canonical Title**: **Learning the Hard Way**
- **Multilingual Titles**:
  - English: *Learning the Hard Way*
  - Gujarati: અઘરી રીતે શીખવું
  - Punjabi: ਮੁਸ਼ਕਿਲ ਰਾਹਾਂ ਤੋਂ ਸਿੱਖਿਆ
  - Hindi: कठिन राहों से सीख
- **Narrative Thesis**: Early mistakes, harsh realities, mentors who set you straight, and humbler wisdom.
- **Spoken Brainstorm Spark**: *"What painful mistake did you make in your youth that turned out to be your greatest life teacher? Who gave you the tough advice you needed to hear?"*

---

```
═══════════════════════════════════════════════════════════════════════════════
PART III: LOVE, PARTNERSHIP & COMMITMENT
Theme: Romance, marriage, travel, domestic foundations, and the miracle of children.
═══════════════════════════════════════════════════════════════════════════════
```

### Scene 1: Journeys Within and Without
- **Identifiers**: `id: part-3-scene-1` | `promptId: p8` | `sparkId: spark_journeys_within_without`
- **Canonical Title**: **Journeys Within and Without**
- **Narrative Thesis**: Geographic migration, personal exploration, travel, and broadening horizons.
- **Spoken Brainstorm Spark**: *"What voyage or major journey fundamentally altered how you see yourself? What was it like to leave the familiar behind?"*

### Scene 2: A Person Becoming
- **Identifiers**: `id: part-3-scene-2` | `promptId: p9` | `sparkId: spark_person_becoming`
- **Canonical Title**: **A Person Becoming**
- **Narrative Thesis**: Stepping into early adulthood, building independence, and establishing life roots.
- **Spoken Brainstorm Spark**: *"Describe the precise moment you felt: 'I am no longer a child. I am standing on my own two feet.' What responsibility did you welcome?"*

### Scene 3: Falling in Love with Life
- **Identifiers**: `id: part-3-scene-3` | `promptId: p10` | `sparkId: spark_love_partner`
- **Canonical Title**: **Falling in Love with Life**
- **Narrative Thesis**: Courtship, finding a life partner, marriage vows, and mutual companionship.
- **Spoken Brainstorm Spark**: *"How did you meet your life partner? What was the spark that made you realise your lives were meant to intertwine?"*

### Scene 4: The Birth of Children
- **Identifiers**: `id: part-3-scene-4` | `promptId: p11` | `sparkId: spark_birth_children`
- **Canonical Title**: **The Birth of Children**
- **Narrative Thesis**: Parenthood, holding a newborn child, and the profound shift in purpose.
- **Spoken Brainstorm Spark**: *"Describe the moment you first held your child. How did your sense of time, love, and vulnerability change in that instant?"*

---

```
═══════════════════════════════════════════════════════════════════════════════
PART IV: TRIALS, TRIUMPHS & MILESTONES
Theme: Resilience, financial/health crises, spiritual anchors, and rising again.
═══════════════════════════════════════════════════════════════════════════════
```

### Scene 1: Holding On, Letting Go
- **Identifiers**: `id: part-4-scene-1` | `promptId: p12` | `sparkId: spark_holding_on_letting_go`
- **Canonical Title**: **Holding On, Letting Go**
- **Narrative Thesis**: Navigating complex family seasons, career shifts, and the courage to release expectations.
- **Spoken Brainstorm Spark**: *"When did life require you to surrender a long-held dream or let someone go? How did you make peace with the outcome?"*

### Scene 2: The Test of Fire
- **Identifiers**: `id: part-4-scene-2` | `promptId: p13` | `sparkId: spark_test_of_fire`
- **Canonical Title**: **The Test of Fire**
- **Narrative Thesis**: The greatest trial—financial hardship, illness, grief, or personal ordeal—and survival.
- **Spoken Brainstorm Spark**: *"Tell the story of your darkest season. What gave you the strength to wake up each morning, and who stood beside you in the fire?"*

### Scene 3: Faith in the Invisible
- **Identifiers**: `id: part-4-scene-3` | `promptId: p14` | `sparkId: spark_faith_invisible`
- **Canonical Title**: **Faith in the Invisible**
- **Narrative Thesis**: Spiritual evolution, prayer, meditation, or trusting an inner moral compass.
- **Spoken Brainstorm Spark**: *"When facts and logic failed, what spiritual anchor or inner faith kept your soul steady? How has your understanding of the Divine evolved?"*

### Scene 4: Wounds into Wisdom
- **Identifiers**: `id: part-4-scene-4` | `promptId: p15` | `sparkId: spark_wounds_into_wisdom`
- **Canonical Title**: **Wounds into Wisdom**
- **Narrative Thesis**: Integrating suffering into compassion, forgiving the past, and extracting gold from pain.
- **Spoken Brainstorm Spark**: *"Looking back at the hardships you survived, what empathy or wisdom did they forge that you could have gained no other way?"*

---

```
═══════════════════════════════════════════════════════════════════════════════
PART V: WISDOM, HARD-WON TRUTHS & VALUES
Theme: Self-reflection, letters of counsel, philosophical humor, and quiet triumphs.
═══════════════════════════════════════════════════════════════════════════════
```

### Scene 1: Letters to Those Who Are Watching
- **Identifiers**: `id: part-5-scene-1` | `promptId: p16` | `sparkId: spark_letters_to_watching`
- **Canonical Title**: **Letters to Those Who Are Watching**
- **Narrative Thesis**: Unfiltered counsel, pride, and guidance addressed directly to children and grandchildren.
- **Spoken Brainstorm Spark**: *"If you could whisper one enduring truth into the ears of your descendants while they sleep, what would you tell them about navigating this world?"*

### Scene 2: Conversations with Myself
- **Identifiers**: `id: part-5-scene-2` | `promptId: p17` | `sparkId: spark_conversations_myself`
- **Canonical Title**: **Conversations with Myself**
- **Narrative Thesis**: Honest contradictions, wry humor, philosophies of life, and accepting human frailty.
- **Spoken Brainstorm Spark**: *"What is something you used to be dogmatic about in your thirties that you now view with gentle amusement or humility?"*

### Scene 3: The Person in the Mirror
- **Identifiers**: `id: part-5-scene-3` | `promptId: p18` | `sparkId: spark_person_in_mirror`
- **Canonical Title**: **The Person in the Mirror**
- **Narrative Thesis**: Frank self-assessment: quirky habits, stubborn traits, simple joys, and self-acceptance.
- **Spoken Brainstorm Spark**: *"When you look in the mirror today, what character traits or habits make you smile? What part of yourself are you proudest of having protected?"*

### Scene 4: The Quiet Victories
- **Identifiers**: `id: part-5-scene-4` | `promptId: p19` | `sparkId: spark_quiet_victories`
- **Canonical Title**: **The Quiet Victories**
- **Narrative Thesis**: Unsung moments of integrity, private kindness, small acts that shaped the soul.
- **Spoken Brainstorm Spark**: *"Not the public awards, but the secret triumphs: what is an unseen moment where you chose kindness, patience, or honesty when no one was watching?"*

---

```
═══════════════════════════════════════════════════════════════════════════════
PART VI: THE CONTINUING STORY & HEIRLOOM LEGACY
Theme: Future dreams, spiritual clarity, peace with mortality, and the generational blessing.
═══════════════════════════════════════════════════════════════════════════════
```

### Scene 1: What Still Lies Ahead
- **Identifiers**: `id: part-6-scene-1` | `promptId: p20` | `sparkId: spark_what_still_lies_ahead`
- **Canonical Title**: **What Still Lies Ahead**
- **Narrative Thesis**: Hopes yet unfulfilled, curiosity about tomorrow, and aspirations for future generations.
- **Spoken Brainstorm Spark**: *"What curiosity or project still makes your eyes light up? What do you most hope to witness in the world your grandchildren will inherit?"*

### Scene 2: If I Could Do It Again
- **Identifiers**: `id: part-6-scene-2` | `promptId: p21` | `sparkId: spark_if_could_do_again`
- **Canonical Title**: **If I Could Do It Again**
- **Narrative Thesis**: Reflections on paths not taken, risks worth taking, and gracious peace with what was.
- **Spoken Brainstorm Spark**: *"If you were handed another lifetime tomorrow, what would you repeat with fierce joy, and what would you worry far less about?"*

### Scene 3: My Final Experiment with Truth
- **Identifiers**: `id: part-6-scene-3` | `promptId: p22` | `sparkId: spark_final_experiment_truth`
- **Canonical Title**: **My Final Experiment with Truth**
- **Narrative Thesis**: Defining personal moral clarity, authenticity, and core truths tested by time.
- **Spoken Brainstorm Spark**: *"Strip away money, titles, and social opinions: what is the fundamental truth about human nature, love, and life that you would stake your name upon?"*

### Scene 4: The Story Continues
- **Identifiers**: `id: part-6-scene-4` | `promptId: p23` | `sparkId: spark_legacy_blessing`
- **Canonical Title**: **The Story Continues**
- **Narrative Thesis**: The capstone heirloom blessing; reflections on how far you have travelled; weaving retrospective time travel directly into an enduring generational prayer.
- **Spoken Brainstorm Spark**: *"Look back upon the entire journey of your life—every tear, laughter, and triumph. What blessing and enduring love do you leave for your great-grandchildren 100 years from now?"*
- **Backward-Compatibility Alias Lock**:
  - Legacy prompts `p24`, `p24_1`, and scene ID `part-6-scene-5` (*Time Travel, Reflections*) seamlessly map here with zero orphaned database rows.

---

## 5. Multi-Format Output Engine: Video, Book & Audio

The Ultimate Hybrid Standard is not merely a question prompt list; it is a structural template designed for automated translation into physical and digital media.

```
                    ┌─────────────────────────────────────────┐
                    │   24 CANONICAL MEMOIR SCENES (SSOT)     │
                    └────────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────────────┐ ┌───────────────────────────────┐ ┌─────────────────────────┐
│ CINEMATIC VIDEO REEL  │ │   HEIRLOOM HARDCOVER BOOK     │ │    ORAL AUDIO ALBUM     │
├───────────────────────┤ ├───────────────────────────────┤ ├─────────────────────────┤
│ • 6 Thematic Chapters │ │ • 6 Archival Sections         │ │ • 6 Audio Discs / Sides │
│ • 4 Scenes per Title  │ │ • 4 Spreads per Section       │ │ • 4 Tracks per Episode  │
│ • Archival Photo Diss.│ │ • Typeset Narrative Vignette  │ │ • Uncompressed Acoustics│
│ • Color-Graded HUD    │ │ • Sepia & Duotone Plates      │ │ • Ambient Score Weave   │
│ • Subtitle Transcripts│ │ • Footnoted Oral Dialects     │ │ • Voice-Only Master     │
└───────────────────────┘ └───────────────────────────────┘ └─────────────────────────┘
```

### Format 1: The Cinematic Video Memoir
- **Master Reel Sequence**: The 24 scenes form a 6-chapter video production. Each chapter lasts ~8–12 minutes, producing an ~60-minute feature autobiography.
- **Visual Pace**: For each scene, the narrator's face-to-camera performance in Act III is interlaced with uploaded family archival photographs at marked narrative timestamps.
- **Chapter Bumpers**: Dynamic motion bumpers introduce each of the 6 canonical parts using the unified English and mother-tongue titles.

### Format 2: The Hardcover Heirloom Book
- **Page Layout**: Exactly 24 core story chapters across 6 thematic parts.
- **Typography & Formatting**:
  - *Part Dividers*: Full-bleed textured cardstock with gold-leaf typography of the canonical Part Title.
  - *Scene Heading*: Canonical Scene Title (e.g., *Scene 3: Crossroads and Choices*).
  - *Prologue Vignette*: The narrative spark prompt typeset in italicised Garamond.
  - *Narrator Prose*: The polished monologue resulting from Act I & Act II.
  - *Photo Plate*: High-resolution photo plate opposite each scene's text, captioned with the year and family members.

### Format 3: The Oral History Audio Album
- **Tracklist Architecture**: Exactly 24 audio tracks, grouped into 6 suites (e.g. *Suite I: Roots & Foundations, Tracks 1–4*).
- **Soundtrack Scoring**: Each part is bound to an acoustic motif (e.g. nostalgic strings for Part I, contemplative piano for Part IV, uplifting brass/woodwinds for Part VI).
- **Archival Preservation**: Pure lossless audio files (`.wav` / `.flac`) stored in the Generational Vault for future audio generation or speech cloning with family consent.

---

## 6. Anti-Regression Governance & Architectural Lock

To ensure no future developer, AI assistant, or automated refactor inadvertently alters these titles, changes chapter order, or breaks Desktop/Fireside parity, the platform enforces three strict governance mechanisms:

### 1. Vitest Immutable Snapshot Test (`src/test/curriculum_ssot_arch_mw_127.test.ts`)
- **Hard-Coded Snapshot Verification**: The test suite maintains a frozen dictionary containing the exact 6 Part Titles and 24 Scene Titles.
- **Two-Way Parity**: The test asserts `scene.title === spark.title` AND `scene.title === IMMUTABLE_SNAPSHOT[partIdx][sceneIdx]`.
- **Pre-Push Failure Gate**: Git hooks reject any `git push` if even a single comma or character in any title deviates from this snapshot.

### 2. TypeScript Strong Typing & Frozen Tuples
- `MASTER_STORY_STRUCTURE` and `FIRESIDE_PROMPT_SPARKS` enforce `MasterStoryScene` and `FiresidePromptSpark` interfaces.
- Any attempt to remove or add a prompt ID without matching arrays will fail compilation at `npm run build` and `tsc --noEmit`.

### 3. Rule Codification in `.agents/AGENTS.md`
- The governance rules mandate that curriculum titles are an immutable platform standard. Renaming, reordering, or modifying them is strictly forbidden without formal product director sign-off and an updated RFC.

---

## 7. NotebookLM Evaluation Queries & Interrogation Prompts

When ingesting this document into NotebookLM, copy and paste the following prompt suites to evaluate, verify, and generate cross-format assets:

### Query Suite 1: Architectural & Narrative Soundness
> *"Analyze the emotional progression across the 6 parts of the Ultimate Hybrid Curriculum. How does isolating romance and family formation in Part III from adversity and crisis in Part IV improve narrative safety for an aging storyteller compared to traditional 5-part autobiography templates?"*

### Query Suite 2: Ergonomic & Cross-Surface Parity
> *"Explain why it is critical for Memory Weaver's Desktop Studio and Fireside Mobile to maintain 100% identical titles across all 24 scenes. What cognitive disorientation occurs if a mobile prompt uses different nomenclature than the desktop soundstage?"*

### Query Suite 3: Multi-Format Translation Engine
> *"Demonstrate how Part I Scene 4 ('Traditions, Feasts & Sacred Days') translates simultaneously into: (1) a 3-minute video scene with photo B-roll, (2) a double-page spread in a printed heirloom book, and (3) an intimate chapter in an audio memoir."*

### Query Suite 4: Capstone Resolution & Legacy Blessing
> *"Examine Part VI Scene 4 ('The Story Continues'). How does synthesizing the retrospective 'Time Travel' concept directly into the final legacy blessing create a more emotionally satisfying conclusion than ending on an abstract self-help reflection prompt?"*


---

## 8. Teleprompter Prompt Injection Schema (v1.63)

### Ergonomic Specifications for Elders (Aged 50 to 85+)
- **Target Runtime**: 3–5 minutes per scene (~35–45 minutes total per 4-scene chapter).
- **Display Typography**: Proportional Sans-Serif font, rendered at 28pt minimum to ensure effortless legibility across 4K and large studio teleprompter monitors.
- **Auto-Pacing Engine**: Adaptive Cadence Engine with natural breath pauses (single slash `/` = 200ms clause pause, double slash `//` = 500ms full breath brake).
- **Directorial Guidance**: Scene-specific lighting adjustments, camera framing, vocal pacing, and emotional grounding cues embedded into the director's monitoring console.

### Complete Scene-by-Scene Prompt Injection Table

| Part & Scene | Canonical Title | Teleprompter Prompt | Directorial Cue | Target Runtime |
| :--- | :--- | :--- | :--- | :--- |
| **Scene 1.1** | **A Child of Two Worlds** | *"Take us back to the very beginning. Where were your feet first planted, and what were the cultural roots, ancestral lands, or family traditions that shaped the air you breathed as a child?"* | Warm ambient lighting; encourage slow storytelling and unhurried pronunciation of family names/places. | 3–5 min |
| **Scene 1.2** | **The House I Grew Up In** | *"Describe the physical home of your childhood. Walk us through the rooms, the front door, the kitchen smells, the sounds outside the window, and the daily rhythm of life within those walls."* | Focus on sensory memory: textures, weather, and echoes of daily life. | 3–5 min |
| **Scene 1.3** | **Innocence and Curiosity** | *"What did the world look like through the eyes of your younger self? Tell us about your early friendships, school days, secret hiding places, and moments of genuine wonder or discovery."* | Softer fill light; prompt a gentle smile and nostalgic reflection. | 3–5 min |
| **Scene 1.4** | **Traditions, Feasts & Sacred Days** | *"Bring us into your family’s most treasured celebrations—whether Diwali, Eid, Christmas, lunar festivals, or sacred family feasts. What foods, blessings, songs, and customs defined your heritage?"* | Emphasize sensory revival: spices, fabrics, hymns, and generational customs. | 3–5 min |
| **Scene 2.1** | **Echoes of a Brother, Sister or Friends** | *"Who walked beside you during your youth? Tell us about your siblings, childhood companions, or early mentors whose voices, rivalries, or kindness helped form your character."* | Encourage personal anecdotes highlighting human connection and early social bonds. | 3–5 min |
| **Scene 2.2** | **The Shape of Loss** | *"When did you first encounter real loss, heartbreak, or the hard edges of the world? How did you navigate that initial grief, and what did it teach you about your own resilience?"* | Subtle dimming of back-light; maintain a respectful, unhurried pace to allow emotional gravity. | 3–5 min |
| **Scene 2.3** | **Crossroads and Choices** | *"Think back to adolescence and early independence. What were the pivotal forks in the road, identity dilemmas, or major decisions that forced you to choose who you wanted to become?"* | Shift tone toward decisive turning points and youthful self-discovery. | 3–5 min |
| **Scene 2.4** | **Learning the Hard Way** | *"We all stumble before we learn. Share a significant mistake or misstep from your youth that humbled you, and explain what guidance or inner strength helped you back up."* | Encouraging, reflective cue emphasizing humility and self-correction. | 3–5 min |
| **Scene 3.1** | **Journeys Within and Without** | *"As you stepped toward adulthood, what physical journeys, travels, or educational leaps expanded your horizons? How did moving beyond your comfort zone change your perspective?"* | Brightening visual palette; focus on transition, exploration, and expanding independence. | 3–5 min |
| **Scene 3.2** | **A Person Becoming** | *"Stepping into adult responsibilities—earning your first wages, managing your own life, and carving your unique place in the world. What did true independence feel like?"* | Grounded, assured framing. | 3–5 min |
| **Scene 3.3** | **Falling in Love with Life** | *"Tell the story of romance, courtship, and profound partnership. How did you know you had found your person, and what did falling in love unlock within your heart?"* | Warm, romantic color-grading shift; relaxed posture prompt. | 3–5 min |
| **Scene 3.4** | **The Birth of Children** | *"Welcoming new life into your arms. Describe the exact moment your child arrived, and how that profound transformation rewrote your purpose, fears, and capacity to love."* | Deeply intimate close-up framing; unhurried teleprompter scroll. | 3–5 min |
| **Scene 4.1** | **Holding On, Letting Go** | *"Life inevitably tests us with financial storms, emotional crises, and difficult sacrifices. What was a season where you had to hold on tightly while letting go of what you could no longer control?"* | Controlled studio lighting; balanced, steady pace honoring the gravity of hardship. | 3–5 min |
| **Scene 4.2** | **The Test of Fire** | *"Describe a period of severe adversity that tested your endurance to the absolute limit. When the path ahead was dark, where did you find the strength to keep going?"* | Solemn, respectful framing; allow natural pauses for emotional integration. | 3–5 min |
| **Scene 4.3** | **Faith in the Invisible** | *"Through trials and dark seasons, what served as your anchor? Whether spiritual beliefs, prayer, inner light, or a quiet philosophy, how did you maintain hope?"* | Gentle upward lighting accent; calm, meditative cadence. | 3–5 min |
| **Scene 4.4** | **Wounds into Wisdom** | *"Looking back at the scars left by past struggles, how did those wounds eventually soften your judgement, deepen your empathy, and turn into hard-won wisdom?"* | Reflective, wise tone; transitioning from survival to acceptance. | 3–5 min |
| **Scene 5.1** | **Letters to Those Who Are Watching** | *"If your children and grandchildren could listen to only one piece of life advice from you, what core principles and timeless values would you want them to live by?"* | Direct gaze into camera lens; authoritative yet deeply affectionate delivery. | 3–5 min |
| **Scene 5.2** | **Conversations with Myself** | *"In the quiet hours of solitude, what internal contradictions, humours, or philosophical doubts do you wrestle with? Share your most honest inner monologue."* | Intimate, conversational lighting; light-hearted and candid cadence. | 3–5 min |
| **Scene 5.3** | **The Person in the Mirror** | *"An honest self-reckoning. Looking at the person you have become across a lifetime—complete with habits, flaws, joys, and triumphs—how do you greet yourself today?"* | Balanced, centered composition; self-acceptance and authenticity focus. | 3–5 min |
| **Scene 5.4** | **The Quiet Victories** | *"History often remembers the loud moments, but a life is built in silence. What are your quiet victories—those unheralded acts of integrity and kindness that shaped your soul?"* | Warm, glowing fill light; celebrating dignity in everyday choices. | 3–5 min |
| **Scene 6.1** | **What Still Lies Ahead** | *"Curiosity has no expiration date. What unfinished dreams, future milestones, or simple tomorrow-hopes are you still looking forward to pursuing?"* | Uplifting lighting shift; energetic and forward-looking posture. | 3–5 min |
| **Scene 6.2** | **If I Could Do It Again** | *"If you could step back into past afternoons and walk those joyful paths once more, which cherished moments would you revisit, and what would you hold a little tighter?"* | Nostalgic golden-hour colour profile; gentle, fond expression. | 3–5 min |
| **Scene 6.3** | **My Final Experiment with Truth** | *"When all is said and done, what is your defining personal truth? What core conviction or value stands immovable at the center of your life?"* | Strong, centered studio framing; firm and resolute delivery. | 3–5 min |
| **Scene 6.4** | **The Story Continues** | *"Look directly down the lens into the eyes of your descendants 100 years from now. Leave them your final enduring blessing, your love, and your message across the century."* | Full emotional resonance; intimate close-up, unhurried fade-out. | 3–5 min |

### Canonical Machine-Readable Injection Payload (JSON Schema)
```json
{
  "spec_id": "SPEC-MW-163",
  "title": "Ultimate Hybrid Curriculum Standard",
  "total_parts": 6,
  "total_scenes": 24,
  "cadence": "4 scenes per part (symmetric model)",
  "parts": [
    {
      "part_number": 1,
      "title": "Roots and Foundations",
      "scenes": [
        {
          "scene_id": "1.1",
          "title": "A Child of Two Worlds",
          "teleprompter_prompt": "Take us back to the very beginning. Where were your feet first planted, and what were the cultural roots, ancestral lands, or family traditions that shaped the air you breathed as a child?",
          "directorial_cue": "Warm ambient lighting; encourage slow storytelling and unhurried pronunciation of family names/places."
        },
        {
          "scene_id": "1.2",
          "title": "The House I Grew Up In",
          "teleprompter_prompt": "Describe the physical home of your childhood. Walk us through the rooms, the front door, the kitchen smells, the sounds outside the window, and the daily rhythm of life within those walls.",
          "directorial_cue": "Focus on sensory memory: textures, weather, and echoes of daily life."
        },
        {
          "scene_id": "1.3",
          "title": "Innocence and Curiosity",
          "teleprompter_prompt": "What did the world look like through the eyes of your younger self? Tell us about your early friendships, school days, secret hiding places, and moments of genuine wonder or discovery.",
          "directorial_cue": "Softer fill light; prompt a gentle smile and nostalgic reflection."
        },
        {
          "scene_id": "1.4",
          "title": "Traditions, Feasts & Sacred Days",
          "teleprompter_prompt": "Bring us into your family’s most treasured celebrations—whether Diwali, Eid, Christmas, lunar festivals, or sacred family feasts. What foods, blessings, songs, and customs defined your heritage?",
          "directorial_cue": "Emphasize sensory revival: spices, fabrics, hymns, and generational customs."
        }
      ]
    },
    {
      "part_number": 2,
      "title": "Formative Years & Early Echoes",
      "scenes": [
        {
          "scene_id": "2.1",
          "title": "Echoes of a Brother, Sister or Friends",
          "teleprompter_prompt": "Who walked beside you during your youth? Tell us about your siblings, childhood companions, or early mentors whose voices, rivalries, or kindness helped form your character.",
          "directorial_cue": "Encourage personal anecdotes highlighting human connection and early social bonds."
        },
        {
          "scene_id": "2.2",
          "title": "The Shape of Loss",
          "teleprompter_prompt": "When did you first encounter real loss, heartbreak, or the hard edges of the world? How did you navigate that initial grief, and what did it teach you about your own resilience?",
          "directorial_cue": "Subtle dimming of back-light; maintain a respectful, unhurried pace to allow emotional gravity."
        },
        {
          "scene_id": "2.3",
          "title": "Crossroads and Choices",
          "teleprompter_prompt": "Think back to adolescence and early independence. What were the pivotal forks in the road, identity dilemmas, or major decisions that forced you to choose who you wanted to become?",
          "directorial_cue": "Shift tone toward decisive turning points and youthful self-discovery."
        },
        {
          "scene_id": "2.4",
          "title": "Learning the Hard Way",
          "teleprompter_prompt": "We all stumble before we learn. Share a significant mistake or misstep from your youth that humbled you, and explain what guidance or inner strength helped you back up.",
          "directorial_cue": "Encouraging, reflective cue emphasizing humility and self-correction."
        }
      ]
    },
    {
      "part_number": 3,
      "title": "Love, Partnership & Commitment",
      "scenes": [
        {
          "scene_id": "3.1",
          "title": "Journeys Within and Without",
          "teleprompter_prompt": "As you stepped toward adulthood, what physical journeys, travels, or educational leaps expanded your horizons? How did moving beyond your comfort zone change your perspective?",
          "directorial_cue": "Brightening visual palette; focus on transition, exploration, and expanding independence."
        },
        {
          "scene_id": "3.2",
          "title": "A Person Becoming",
          "teleprompter_prompt": "Stepping into adult responsibilities—earning your first wages, managing your own life, and carving your unique place in the world. What did true independence feel like?",
          "directorial_cue": "Grounded, assured framing."
        },
        {
          "scene_id": "3.3",
          "title": "Falling in Love with Life",
          "teleprompter_prompt": "Tell the story of romance, courtship, and profound partnership. How did you know you had found your person, and what did falling in love unlock within your heart?",
          "directorial_cue": "Warm, romantic color-grading shift; relaxed posture prompt."
        },
        {
          "scene_id": "3.4",
          "title": "The Birth of Children",
          "teleprompter_prompt": "Welcoming new life into your arms. Describe the exact moment your child arrived, and how that profound transformation rewrote your purpose, fears, and capacity to love.",
          "directorial_cue": "Deeply intimate close-up framing; unhurried teleprompter scroll."
        }
      ]
    },
    {
      "part_number": 4,
      "title": "Trials, Triumphs & Milestones",
      "scenes": [
        {
          "scene_id": "4.1",
          "title": "Holding On, Letting Go",
          "teleprompter_prompt": "Life inevitably tests us with financial storms, emotional crises, and difficult sacrifices. What was a season where you had to hold on tightly while letting go of what you could no longer control?",
          "directorial_cue": "Controlled studio lighting; balanced, steady pace honoring the gravity of hardship."
        },
        {
          "scene_id": "4.2",
          "title": "The Test of Fire",
          "teleprompter_prompt": "Describe a period of severe adversity that tested your endurance to the absolute limit. When the path ahead was dark, where did you find the strength to keep going?",
          "directorial_cue": "Solemn, respectful framing; allow natural pauses for emotional integration."
        },
        {
          "scene_id": "4.3",
          "title": "Faith in the Invisible",
          "teleprompter_prompt": "Through trials and dark seasons, what served as your anchor? Whether spiritual beliefs, prayer, inner light, or a quiet philosophy, how did you maintain hope?",
          "directorial_cue": "Gentle upward lighting accent; calm, meditative cadence."
        },
        {
          "scene_id": "4.4",
          "title": "Wounds into Wisdom",
          "teleprompter_prompt": "Looking back at the scars left by past struggles, how did those wounds eventually soften your judgement, deepen your empathy, and turn into hard-won wisdom?",
          "directorial_cue": "Reflective, wise tone; transitioning from survival to acceptance."
        }
      ]
    },
    {
      "part_number": 5,
      "title": "Wisdom, Hard-Won Truths & Values",
      "scenes": [
        {
          "scene_id": "5.1",
          "title": "Letters to Those Who Are Watching",
          "teleprompter_prompt": "If your children and grandchildren could listen to only one piece of life advice from you, what core principles and timeless values would you want them to live by?",
          "directorial_cue": "Direct gaze into camera lens; authoritative yet deeply affectionate delivery."
        },
        {
          "scene_id": "5.2",
          "title": "Conversations with Myself",
          "teleprompter_prompt": "In the quiet hours of solitude, what internal contradictions, humours, or philosophical doubts do you wrestle with? Share your most honest inner monologue.",
          "directorial_cue": "Intimate, conversational lighting; light-hearted and candid cadence."
        },
        {
          "scene_id": "5.3",
          "title": "The Person in the Mirror",
          "teleprompter_prompt": "An honest self-reckoning. Looking at the person you have become across a lifetime—complete with habits, flaws, joys, and triumphs—how do you greet yourself today?",
          "directorial_cue": "Balanced, centered composition; self-acceptance and authenticity focus."
        },
        {
          "scene_id": "5.4",
          "title": "The Quiet Victories",
          "teleprompter_prompt": "History often remembers the loud moments, but a life is built in silence. What are your quiet victories—those unheralded acts of integrity and kindness that shaped your soul?",
          "directorial_cue": "Warm, glowing fill light; celebrating dignity in everyday choices."
        }
      ]
    },
    {
      "part_number": 6,
      "title": "The Continuing Story & Heirloom Legacy",
      "scenes": [
        {
          "scene_id": "6.1",
          "title": "What Still Lies Ahead",
          "teleprompter_prompt": "Curiosity has no expiration date. What unfinished dreams, future milestones, or simple tomorrow-hopes are you still looking forward to pursuing?",
          "directorial_cue": "Uplifting lighting shift; energetic and forward-looking posture."
        },
        {
          "scene_id": "6.2",
          "title": "If I Could Do It Again",
          "teleprompter_prompt": "If you could step back into past afternoons and walk those joyful paths once more, which cherished moments would you revisit, and what would you hold a little tighter?",
          "directorial_cue": "Nostalgic golden-hour colour profile; gentle, fond expression."
        },
        {
          "scene_id": "6.3",
          "title": "My Final Experiment with Truth",
          "teleprompter_prompt": "When all is said and done, what is your defining personal truth? What core conviction or value stands immovable at the center of your life?",
          "directorial_cue": "Strong, centered studio framing; firm and resolute delivery."
        },
        {
          "scene_id": "6.4",
          "title": "The Story Continues",
          "teleprompter_prompt": "Look directly down the lens into the eyes of your descendants 100 years from now. Leave them your final enduring blessing, your love, and your message across the century.",
          "directorial_cue": "Full emotional resonance; intimate close-up, unhurried fade-out."
        }
      ]
    }
  ]
}
```
