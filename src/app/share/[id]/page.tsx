import { redirect } from 'next/navigation';

interface ShareRedirectProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ShareRedirectPage({ params }: ShareRedirectProps) {
  const resolvedParams = await params;
  redirect(`/cinema?id=${resolvedParams.id}`);
}
