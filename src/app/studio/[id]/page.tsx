import StudioClientPage from '@/components/studio/StudioClientPage';
import { getStudioState } from '@/lib/studio';

// Correctly typing the async page component by wrapping both `params` and
// `searchParams` in a Promise, as indicated by the build errors.
export default async function StudioPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const sessionId = searchParams?.sessionId as string || 'default';
  const initialState = await getStudioState(sessionId);

  return <StudioClientPage params={params} initialState={initialState} />;
}
