import StudioClientPage from './StudioClientPage';

export default function StudioPage({ params }: { params: { id: string } }) {
  return <StudioClientPage params={params} />;
}
