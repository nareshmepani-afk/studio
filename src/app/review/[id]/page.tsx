// /src/app/review/[id]/page.tsx

interface ReviewPageProps {
  params: Promise<{ id: string }>; // In Next.js 15, params is a Promise
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  // 1. Await the params before using them
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="p-8 text-white">
      <h1>Reviewing Session: {id}</h1>
      {/* ... the rest of your UI ... */}
    </div>
  );
}