import StudioClientPage from './StudioClientPage';

export default async function StudioPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  return <StudioClientPage id={id} />;
}
