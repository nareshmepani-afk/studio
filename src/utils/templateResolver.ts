import einsteinFixture from '@/fixtures/einstein.json';

export interface ResolvedTemplateData {
  title: string;
  description: string;
  originalHook?: string;
  prose: string;
  sensoryConfig: any[];
  narratorAgeAtTime?: number;
  dateComponents?: { year?: number; month?: number; day?: number };
  timeframeScope?: string;
  durationQuantity?: number;
  durationUnit?: string;
  narratorLocationAtEvent?: string;
  acts?: any;
  [key: string]: any;
}

/**
 * Synchronous static template registry for 0ms deterministic initial hydration
 */
const staticTemplateRegistry: Record<string, any> = {
  p_einstein: einsteinFixture,
};

/**
 * Asynchronously imports static JSON fixtures to optimize client bundle splitting
 */
const dynamicTemplateRegistry: Record<string, () => Promise<any>> = {
  p_einstein: () => import('@/fixtures/einstein.json').then(m => m.default),
  // Curie template dynamic load scaffold
  // p_curie: () => import('@/fixtures/curie.json').then(m => m.default),
};

function formatTemplatePayload(data: any): ResolvedTemplateData {
  return {
    title: data.title || '',
    description: data.description || '',
    originalHook: data.originalHook || data.description || '',
    prose: data.prose || '',
    sensoryConfig: Array.isArray(data.sensoryConfig) ? data.sensoryConfig : [],
    sensory: data.sensory || undefined,
    narratorAgeAtTime: data.narratorAgeAtTime ?? data.age ?? 5,
    age: data.age ?? data.narratorAgeAtTime ?? 5,
    dateComponents: data.dateComponents || (data.year ? { day: '14', month: 'March', year: String(data.year) } : { day: '14', month: 'March', year: '1884' }),
    year: data.year ? Number(data.year) : 1884,
    timeframeScope: data.timeframeScope || 'event_scene',
    durationQuantity: data.durationQuantity ?? 1,
    durationUnit: data.durationUnit || 'days',
    location: data.location || data.narratorLocationAtEvent || 'Munich (Family Residence)',
    country: data.country || 'Germany',
    narratorLocationAtEvent: data.narratorLocationAtEvent || data.location || 'Munich, Germany (Family Residence)',
    acts: data.acts,
    ...data,
  };
}

/**
 * Synchronously resolves and loads template parameters with 0ms latency
 * @param templateId The unique template route identifier
 * @returns ResolvedTemplateData or null
 */
export function resolveTemplateFixture(templateId: string): ResolvedTemplateData | null {
  const data = staticTemplateRegistry[templateId];
  if (!data) return null;
  return formatTemplatePayload(data);
}

/**
 * Asynchronously resolves and loads template parameters based on route parameters
 * @param templateId The unique template route identifier
 * @returns Promise resolving to ResolvedTemplateData or null
 */
export async function resolveTemplateFixtureAsync(templateId: string): Promise<ResolvedTemplateData | null> {
  const syncData = resolveTemplateFixture(templateId);
  if (syncData) return syncData;

  const loadFixture = dynamicTemplateRegistry[templateId];
  if (!loadFixture) return null;

  try {
    const data = await loadFixture();
    return formatTemplatePayload(data);
  } catch (e) {
    console.error(`[TemplateResolver] Async load failure for template ID: ${templateId}`, e);
    return null;
  }
}
