'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  useEffect(() => {
    const resolveParams = async () => {
      const { id } = await params;
      router.replace(`/add-memory?sessionId=${id}`);
    };

    resolveParams();
  }, [params, router]);

  return null; // or a loading spinner
}
