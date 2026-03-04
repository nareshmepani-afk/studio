import StudioClientPage from '@/components/studio/StudioClientPage';
import { getStudioState } from '@/lib/studio';

type StudioPageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function StudioPage({ params, searchParams }: StudioPageProps) {
  const sessionId = searchParams?.sessionId as string || 'default';
  const initialState = await getStudioState(sessionId);

  return <StudioClientPage params={params} initialState={initialState} />;
}
