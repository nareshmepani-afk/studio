/**
 * @fileOverview Memory Weaver Teleprompter Schema (v1.63)
 * Specification: SPEC-MW-163 (Ultimate Hybrid Curriculum Standard)
 * 
 * Optimized for elder narrators (aged 50 to 85+) recording under theatrical studio lighting
 * and 4K desktop teleprompters, ensuring low cognitive load, natural speech pacing, and built-in
 * emotional grounding.
 * 
 * Target Runtime: 3–5 minutes per scene
 * Font: Proportional Sans-Serif (28pt minimum)
 * Auto-Pacing: Adaptive Cadence Engine
 */

export interface TeleprompterSceneSchema {
  scene_id: string; // e.g. "1.1", "part-1-scene-1"
  canonical_scene_id: string; // e.g. "part-1-scene-1"
  prompt_id: string; // e.g. "p1"
  title: string;
  teleprompter_prompt: string;
  directorial_cue: string;
  target_runtime_minutes: string;
}

export interface TeleprompterPartSchema {
  part_number: number;
  part_id: string; // e.g. "part-i"
  title: string;
  scenes: TeleprompterSceneSchema[];
}

export interface MemoryWeaverTeleprompterSpecification {
  spec_id: 'SPEC-MW-163';
  title: 'Ultimate Hybrid Curriculum Standard';
  schema_version: 'v1.63';
  total_parts: 6;
  total_scenes: 24;
  cadence: '4 scenes per part (symmetric model)';
  target_runtime_per_scene: '3–5 minutes';
  font_standard: 'Proportional Sans-Serif (28pt minimum)';
  auto_pacing: 'Adaptive Cadence Engine';
  parts: TeleprompterPartSchema[];
}

export const TELEPROMPTER_SCHEMA: MemoryWeaverTeleprompterSpecification = {
  spec_id: 'SPEC-MW-163',
  title: 'Ultimate Hybrid Curriculum Standard',
  schema_version: 'v1.63',
  total_parts: 6,
  total_scenes: 24,
  cadence: '4 scenes per part (symmetric model)',
  target_runtime_per_scene: '3–5 minutes',
  font_standard: 'Proportional Sans-Serif (28pt minimum)',
  auto_pacing: 'Adaptive Cadence Engine',
  parts: [
    {
      part_number: 1,
      part_id: 'part-i',
      title: 'Roots and Foundations',
      scenes: [
        {
          scene_id: '1.1',
          canonical_scene_id: 'part-1-scene-1',
          prompt_id: 'p1',
          title: 'A Child of Two Worlds',
          teleprompter_prompt:
            'Take us back to the very beginning. Where were your feet first planted, and what were the cultural roots, ancestral lands, or family traditions that shaped the air you breathed as a child?',
          directorial_cue:
            'Warm ambient lighting; encourage slow storytelling and unhurried pronunciation of family names/places.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '1.2',
          canonical_scene_id: 'part-1-scene-2',
          prompt_id: 'p2',
          title: 'The House I Grew Up In',
          teleprompter_prompt:
            'Describe the physical home of your childhood. Walk us through the rooms, the front door, the kitchen smells, the sounds outside the window, and the daily rhythm of life within those walls.',
          directorial_cue:
            'Focus on sensory memory: textures, weather, and echoes of daily life.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '1.3',
          canonical_scene_id: 'part-1-scene-3',
          prompt_id: 'p3',
          title: 'Innocence and Curiosity',
          teleprompter_prompt:
            'What did the world look like through the eyes of your younger self? Tell us about your early friendships, school days, secret hiding places, and moments of genuine wonder or discovery.',
          directorial_cue:
            'Softer fill light; prompt a gentle smile and nostalgic reflection.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '1.4',
          canonical_scene_id: 'part-1-scene-4',
          prompt_id: 'p3_b',
          title: 'Traditions, Feasts & Sacred Days',
          teleprompter_prompt:
            'Bring us into your family’s most treasured celebrations—whether Diwali, Eid, Christmas, lunar festivals, or sacred family feasts. What foods, blessings, songs, and customs defined your heritage?',
          directorial_cue:
            'Emphasize sensory revival: spices, fabrics, hymns, and generational customs.',
          target_runtime_minutes: '3–5',
        },
      ],
    },
    {
      part_number: 2,
      part_id: 'part-ii',
      title: 'Formative Years & Early Echoes',
      scenes: [
        {
          scene_id: '2.1',
          canonical_scene_id: 'part-2-scene-1',
          prompt_id: 'p4',
          title: 'Echoes of a Brother, Sister or Friends',
          teleprompter_prompt:
            'Who walked beside you during your youth? Tell us about your siblings, childhood companions, or early mentors whose voices, rivalries, or kindness helped form your character.',
          directorial_cue:
            'Encourage personal anecdotes highlighting human connection and early social bonds.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '2.2',
          canonical_scene_id: 'part-2-scene-2',
          prompt_id: 'p5',
          title: 'The Shape of Loss',
          teleprompter_prompt:
            'When did you first encounter real loss, heartbreak, or the hard edges of the world? How did you navigate that initial grief, and what did it teach you about your own resilience?',
          directorial_cue:
            'Subtle dimming of back-light; maintain a respectful, unhurried pace to allow emotional gravity.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '2.3',
          canonical_scene_id: 'part-2-scene-3',
          prompt_id: 'p6',
          title: 'Crossroads and Choices',
          teleprompter_prompt:
            'Think back to adolescence and early independence. What were the pivotal forks in the road, identity dilemmas, or major decisions that forced you to choose who you wanted to become?',
          directorial_cue:
            'Shift tone toward decisive turning points and youthful self-discovery.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '2.4',
          canonical_scene_id: 'part-2-scene-4',
          prompt_id: 'p7',
          title: 'Learning the Hard Way',
          teleprompter_prompt:
            'We all stumble before we learn. Share a significant mistake or misstep from your youth that humbled you, and explain what guidance or inner strength helped you back up.',
          directorial_cue:
            'Encouraging, reflective cue emphasizing humility and self-correction.',
          target_runtime_minutes: '3–5',
        },
      ],
    },
    {
      part_number: 3,
      part_id: 'part-iii',
      title: 'Love, Partnership & Commitment',
      scenes: [
        {
          scene_id: '3.1',
          canonical_scene_id: 'part-3-scene-1',
          prompt_id: 'p8',
          title: 'Journeys Within and Without',
          teleprompter_prompt:
            'As you stepped toward adulthood, what physical journeys, travels, or educational leaps expanded your horizons? How did moving beyond your comfort zone change your perspective?',
          directorial_cue:
            'Brightening visual palette; focus on transition, exploration, and expanding independence.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '3.2',
          canonical_scene_id: 'part-3-scene-2',
          prompt_id: 'p9',
          title: 'A Person Becoming',
          teleprompter_prompt:
            'Stepping into adult responsibilities—earning your first wages, managing your own life, and carving your unique place in the world. What did true independence feel like?',
          directorial_cue:
            'Grounded, assured framing.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '3.3',
          canonical_scene_id: 'part-3-scene-3',
          prompt_id: 'p10',
          title: 'Falling in Love with Life',
          teleprompter_prompt:
            'Tell the story of romance, courtship, and profound partnership. How did you know you had found your person, and what did falling in love unlock within your heart?',
          directorial_cue:
            'Warm, romantic color-grading shift; relaxed posture prompt.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '3.4',
          canonical_scene_id: 'part-3-scene-4',
          prompt_id: 'p11',
          title: 'The Birth of Children',
          teleprompter_prompt:
            'Welcoming new life into your arms. Describe the exact moment your child arrived, and how that profound transformation rewrote your purpose, fears, and capacity to love.',
          directorial_cue:
            'Deeply intimate close-up framing; unhurried teleprompter scroll.',
          target_runtime_minutes: '3–5',
        },
      ],
    },
    {
      part_number: 4,
      part_id: 'part-iv',
      title: 'Trials, Triumphs & Milestones',
      scenes: [
        {
          scene_id: '4.1',
          canonical_scene_id: 'part-4-scene-1',
          prompt_id: 'p12',
          title: 'Holding On, Letting Go',
          teleprompter_prompt:
            'Life inevitably tests us with financial storms, emotional crises, and difficult sacrifices. What was a season where you had to hold on tightly while letting go of what you could no longer control?',
          directorial_cue:
            'Controlled studio lighting; balanced, steady pace honoring the gravity of hardship.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '4.2',
          canonical_scene_id: 'part-4-scene-2',
          prompt_id: 'p13',
          title: 'The Test of Fire',
          teleprompter_prompt:
            'Describe a period of severe adversity that tested your endurance to the absolute limit. When the path ahead was dark, where did you find the strength to keep going?',
          directorial_cue:
            'Solemn, respectful framing; allow natural pauses for emotional integration.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '4.3',
          canonical_scene_id: 'part-4-scene-3',
          prompt_id: 'p14',
          title: 'Faith in the Invisible',
          teleprompter_prompt:
            'Through trials and dark seasons, what served as your anchor? Whether spiritual beliefs, prayer, inner light, or a quiet philosophy, how did you maintain hope?',
          directorial_cue:
            'Gentle upward lighting accent; calm, meditative cadence.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '4.4',
          canonical_scene_id: 'part-4-scene-4',
          prompt_id: 'p15',
          title: 'Wounds into Wisdom',
          teleprompter_prompt:
            'Looking back at the scars left by past struggles, how did those wounds eventually soften your judgement, deepen your empathy, and turn into hard-won wisdom?',
          directorial_cue:
            'Reflective, wise tone; transitioning from survival to acceptance.',
          target_runtime_minutes: '3–5',
        },
      ],
    },
    {
      part_number: 5,
      part_id: 'part-v',
      title: 'Wisdom, Hard-Won Truths & Values',
      scenes: [
        {
          scene_id: '5.1',
          canonical_scene_id: 'part-5-scene-1',
          prompt_id: 'p16',
          title: 'Letters to Those Who Are Watching',
          teleprompter_prompt:
            'If your children and grandchildren could listen to only one piece of life advice from you, what core principles and timeless values would you want them to live by?',
          directorial_cue:
            'Direct gaze into camera lens; authoritative yet deeply affectionate delivery.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '5.2',
          canonical_scene_id: 'part-5-scene-2',
          prompt_id: 'p17',
          title: 'Conversations with Myself',
          teleprompter_prompt:
            'In the quiet hours of solitude, what internal contradictions, humours, or philosophical doubts do you wrestle with? Share your most honest inner monologue.',
          directorial_cue:
            'Intimate, conversational lighting; light-hearted and candid cadence.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '5.3',
          canonical_scene_id: 'part-5-scene-3',
          prompt_id: 'p18',
          title: 'The Person in the Mirror',
          teleprompter_prompt:
            'An honest self-reckoning. Looking at the person you have become across a lifetime—complete with habits, flaws, joys, and triumphs—how do you greet yourself today?',
          directorial_cue:
            'Balanced, centered composition; self-acceptance and authenticity focus.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '5.4',
          canonical_scene_id: 'part-5-scene-4',
          prompt_id: 'p19',
          title: 'The Quiet Victories',
          teleprompter_prompt:
            'History often remembers the loud moments, but a life is built in silence. What are your quiet victories—those unheralded acts of integrity and kindness that shaped your soul?',
          directorial_cue:
            'Warm, glowing fill light; celebrating dignity in everyday choices.',
          target_runtime_minutes: '3–5',
        },
      ],
    },
    {
      part_number: 6,
      part_id: 'part-vi',
      title: 'The Continuing Story & Heirloom Legacy',
      scenes: [
        {
          scene_id: '6.1',
          canonical_scene_id: 'part-6-scene-1',
          prompt_id: 'p20',
          title: 'What Still Lies Ahead',
          teleprompter_prompt:
            'Curiosity has no expiration date. What unfinished dreams, future milestones, or simple tomorrow-hopes are you still looking forward to pursuing?',
          directorial_cue:
            'Uplifting lighting shift; energetic and forward-looking posture.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '6.2',
          canonical_scene_id: 'part-6-scene-2',
          prompt_id: 'p21',
          title: 'If I Could Do It Again',
          teleprompter_prompt:
            'If you could step back into past afternoons and walk those joyful paths once more, which cherished moments would you revisit, and what would you hold a little tighter?',
          directorial_cue:
            'Nostalgic golden-hour colour profile; gentle, fond expression.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '6.3',
          canonical_scene_id: 'part-6-scene-3',
          prompt_id: 'p22',
          title: 'My Final Experiment with Truth',
          teleprompter_prompt:
            'When all is said and done, what is your defining personal truth? What core conviction or value stands immovable at the center of your life?',
          directorial_cue:
            'Strong, centered studio framing; firm and resolute delivery.',
          target_runtime_minutes: '3–5',
        },
        {
          scene_id: '6.4',
          canonical_scene_id: 'part-6-scene-4',
          prompt_id: 'p23',
          title: 'The Story Continues',
          teleprompter_prompt:
            'Look directly down the lens into the eyes of your descendants 100 years from now. Leave them your final enduring blessing, your love, and your message across the century.',
          directorial_cue:
            'Full emotional resonance; intimate close-up, unhurried fade-out.',
          target_runtime_minutes: '3–5',
        },
      ],
    },
  ],
};

/**
 * Looks up a teleprompter scene schema by scene_id (e.g. "1.1"), canonical scene ID (e.g. "part-1-scene-1"),
 * or prompt ID (e.g. "p1"). Supports legacy alias fallback for p24 / part-6-scene-5 -> 6.4.
 */
export function getTeleprompterScene(identifier: string): TeleprompterSceneSchema | undefined {
  if (!identifier) return undefined;
  const cleanId = identifier.trim();

  // Legacy fallback alias
  if (cleanId === 'p24' || cleanId === 'part-6-scene-5' || cleanId === '6.5') {
    return getTeleprompterScene('part-6-scene-4');
  }

  for (const part of TELEPROMPTER_SCHEMA.parts) {
    for (const scene of part.scenes) {
      if (
        scene.scene_id === cleanId ||
        scene.canonical_scene_id === cleanId ||
        scene.prompt_id === cleanId
      ) {
        return scene;
      }
    }
  }
  return undefined;
}
