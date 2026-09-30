/**
 * 🏛️ Production Root Route Redirect (MW-100-C)
 *
 * Prevents dead-end 404s when users navigate to bare `/studio/production`
 * without a dynamic `[id]` segment, redirecting cleanly to `/studio`
 * (the Master Curriculum Album).
 */

import { redirect } from 'next/navigation';

export default function ProductionRootRedirectPage() {
  redirect('/studio');
}
