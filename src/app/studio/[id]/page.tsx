import StudioClientPage from '@/components/studio/StudioClientPage';
import { getStudioState } from '@/lib/studio';

// The custom StudioPageProps type is removed to avoid conflicts.
// The props are typed inline instead.
export default async function StudioPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sessionId = searchParams?.sessionId as string || 'default';
  const initialState = await getStudioState(sessionId);

  return <StudioClientPage params={params} initialState={initialState} />;
}
