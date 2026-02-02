
import StudioClientPage from './StudioClientPage';

interface StudioPageProps {
  params: {
    id: string;
  };
}

export default function StudioPage({ params }: StudioPageProps) {
  return <StudioClientPage params={params} />;
}
