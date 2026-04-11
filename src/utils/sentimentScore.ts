export type PulseState = 'neutral' | 'calm' | 'intense';

export interface SentimentResult {
  score: number;
  state: PulseState;
}

export function analyzeSentiment(text: string): SentimentResult {
  if (!text) return { score: 0, state: 'neutral' };

  const content = text.toLowerCase();
  
  const intenseWords = ['storm', 'shout', 'shouting', 'cold', 'angry', 'fast', 'run', 'running', 'fear', 'broken', 'scream', 'screaming', 'terror', 'crash'];
  const calmWords = ['warmth', 'warm', 'slow', 'lullaby', 'peace', 'quiet', 'gentle', 'soft', 'breeze', 'calm', 'rest', 'sleep'];

  let intenseCount = 0;
  let calmCount = 0;

  const words = content.split(/\s+/);
  words.forEach(rawWord => {
    const word = rawWord.replace(/[^a-z]/g, '');
    if (intenseWords.includes(word)) intenseCount++;
    if (calmWords.includes(word)) calmCount++;
  });

  // Calculate generic score
  const score = intenseCount - calmCount;
  
  let state: PulseState = 'neutral';
  if (score >= 1) state = 'intense';
  else if (score <= -1) state = 'calm';

  return { score, state };
}
