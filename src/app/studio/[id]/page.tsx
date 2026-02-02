import StudioClientPage from './StudioClientPage';

export default function StudioPage({ params }: any) {
  const { id } = params;

  return <StudioClientPage id={id} />;
}
