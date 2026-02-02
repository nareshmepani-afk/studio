import StudioClientPage from '@/components/studio/StudioClientPage';

export default function StudioPage({ params }: { params: { id: string } }) {
  return <StudioClientPage params={params} />;
}
