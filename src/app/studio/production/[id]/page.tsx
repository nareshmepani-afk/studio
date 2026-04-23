import React, { Suspense } from 'react';
import { ProductionDeckContainer } from '@/components/studio/ProductionDeckContainer';

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ProductionDeckContainer promptId={resolvedParams.id} isModal={false} />
    </Suspense>
  );
}
