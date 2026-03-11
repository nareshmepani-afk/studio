'use client';

import { toast as sonnerToast } from 'sonner';

/**
 * A robust module for the useToast hook.
 * Strictly adheres to ES module standards to resolve "not a module" errors.
 */

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  [key: string]: any;
}

export const useToast = () => {
  return {
    toast: ({ title, description, variant, ...props }: ToastProps) => {
      sonnerToast(title || 'Notification', {
        description: description,
        ...props,
      });
    },
  };
};

// Ensure default export exists for compatibility with generic imports
export default useToast;
