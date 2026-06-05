import { notFound } from 'next/navigation';
import DevHUD from '@/components/dev/DevHUD';

export const metadata = {
  title: 'Dev Control Cockpit | Memory Weaver',
  description: 'Chronicle Cinema internal developer control deck.',
};

export default async function DevPage() {
  // Strict environmental shield to prevent access in production builds
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <DevHUD />;
}
