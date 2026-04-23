import React, { Suspense } from 'react';
import { ProductionDeckContainer } from '@/components/studio/ProductionDeckContainer';

export default async function InterceptedProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[30]" />}>
      <ProductionDeckContainer promptId={resolvedParams.id} isModal={true} />
    </Suspense>
  );
}
