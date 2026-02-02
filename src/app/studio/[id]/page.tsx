import StudioClientPage from './StudioClientPage';

// Cache-busting comment
export default function StudioPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { id } = params;

  return <StudioClientPage id={id} />;
}
