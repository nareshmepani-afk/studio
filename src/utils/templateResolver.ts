export interface ResolvedTemplateData {
  title: string;
  description: string;
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
 * Asynchronously imports static JSON fixtures to optimize client bundle splitting
 */
const dynamicTemplateRegistry: Record<string, () => Promise<any>> = {
  p_einstein: () => import('@/fixtures/einstein.json').then(m => m.default),
  // Curie template dynamic load scaffold
  // p_curie: () => import('@/fixtures/curie.json').then(m => m.default),
};

/**
 * Asynchronously resolves and loads template parameters based on route parameters
 * @param templateId The unique template route identifier
 * @returns Promise resolving to ResolvedTemplateData or null
 */
export async function resolveTemplateFixtureAsync(templateId: string): Promise<ResolvedTemplateData | null> {
  const loadFixture = dynamicTemplateRegistry[templateId];
  if (!loadFixture) return null;

  try {
    const data = await loadFixture();
    return {
      title: data.title || '',
      description: data.description || '',
      prose: data.prose || '',
      sensoryConfig: Array.isArray(data.sensoryConfig) ? data.sensoryConfig : [],
      narratorAgeAtTime: data.narratorAgeAtTime ?? data.age ?? 26,
      dateComponents: data.dateComponents || (data.year ? { year: Number(data.year) } : { year: 1905 }),
      timeframeScope: data.timeframeScope || 'event_scene',
      durationQuantity: data.durationQuantity ?? 1,
      durationUnit: data.durationUnit || 'years',
      narratorLocationAtEvent: data.narratorLocationAtEvent || data.location || 'Bern, Switzerland (Swiss Patent Office)',
      acts: data.acts,
      ...data,
    };
  } catch (e) {
    console.error(`[TemplateResolver] Async load failure for template ID: ${templateId}`, e);
    return null;
  }
}
