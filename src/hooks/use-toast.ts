'use client';

import { toast as sonnerToast } from 'sonner';

/**
 * A robust shim for the useToast hook that bridges to our chosen 
 * notification library (sonner). This satisfies standard Shadcn UI imports.
 */
export const useToast = () => {
  return {
    toast: ({ title, description, ...props }: { title?: string; description?: string; [key: string]: any }) => {
      sonnerToast(title || 'Notification', {
        description: description,
        ...props,
      });
    },
  };
};

export default useToast;
