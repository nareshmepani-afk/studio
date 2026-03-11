'use client';

import { toast as sonnerToast } from 'sonner';

/**
 * A robust shim for the useToast hook that bridges to our chosen 
 * notification library (sonner). 
 * 
 * NOTE: This file MUST have an export to be considered a valid module.
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

export default useToast;
