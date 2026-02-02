import StudioClientPage from '@/components/studio/StudioClientPage';

// PageProps are now a Promise, as Next.js 15 requires for Server Components
type StudioPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudioPage({ params }: StudioPageProps) {
  // Await the params to resolve the promise before passing to the client component
  const resolvedParams = await params;
  return <StudioClientPage params={resolvedParams} />;
}
