'use client';

/**
 * Re-exporting the useToast hook to satisfy Shadcn component expectations.
 * Providing both named and default exports to prevent "not a module" errors in build workers.
 */
import { useToast } from '../../hooks/use-toast';

export { useToast };
export default useToast;
