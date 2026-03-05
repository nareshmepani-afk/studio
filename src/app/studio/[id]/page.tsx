import StudioClientPage from '@/components/studio/StudioClientPage';
import { getStudioState } from '@/lib/studio';

// Correctly typing the async page component based on the reference file
// `src/app/prompts/[promptId]/page.tsx`. The `params` prop is a Promise.
export default async function StudioPage({
  params: paramsPromise,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = await paramsPromise;
  const sessionId = searchParams?.sessionId as string || 'default';
  const initialState = await getStudioState(sessionId);

  return <StudioClientPage params={params} initialState={initialState} />;
}
