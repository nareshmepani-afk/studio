'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { PublicPageShell } from '@/components/public/PublicPageShell';
import { Button } from '@/components/ui/button';
import { sendContactAction } from '@/actions/sendContactAction';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  category: string;
  message: string;
}

export function ContactContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const result = await sendContactAction(data);
      if (result.success) {
        toast.success('Message sent successfully', {
          description: "We'll get back to you as soon as possible.",
        });
        reset();
      } else {
        toast.error('Failed to send message', {
          description: result.error || 'Please try again later.',
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred', {
        description: 'Please try emailing us directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageShell>
      <div className="bg-[#050505] min-h-screen text-[#E5E5E5] py-20 px-6 sm:px-8 lg:px-12 font-sans">
        <div className="max-w-3xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight">
              Director Concierge
            </h1>
            <p className="text-xl text-neutral-400 font-light">
              Get in touch for production support, custom archival requests, and general enquiries.
            </p>
          </div>

          <div className="bg-[#121212] rounded-3xl border border-white/5 p-8 md:p-12 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-neutral-300">Name</label>
                  <input
                    id="name"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Jane Doe"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-neutral-300">Email</label>
                  <input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="jane@example.com"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-neutral-300">Category</label>
                <select
                  id="category"
                  {...register('category', { required: 'Please select a category' })}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">Select a category...</option>
                  <option value="Production Support">Production Support</option>
                  <option value="Custom Archival Request">Custom Archival Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="General Enquiry">General Enquiry</option>
                </select>
                {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-neutral-300">Message</label>
                <textarea
                  id="message"
                  rows={6}
                  {...register('message', { 
                    required: 'Message is required',
                    maxLength: {
                      value: 5000,
                      message: 'Message must be under 5,000 characters'
                    }
                  })}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y"
                  placeholder="How can we help with your production?"
                />
                {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>}
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium py-6 rounded-xl transition-all shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
            </form>
          </div>

          <div className="text-center space-y-4 pt-8 border-t border-white/5">
            <p className="text-neutral-400">
              Or email us directly at <a href="mailto:support@memoryweaver.studio" className="text-amber-500 hover:text-amber-400 transition-colors">support@memoryweaver.studio</a>
            </p>
            <p className="text-sm text-neutral-500 font-mono">
              For urgent bugs, press <kbd className="px-2 py-1 bg-neutral-900 rounded border border-white/10 font-sans">Ctrl</kbd> + <kbd className="px-2 py-1 bg-neutral-900 rounded border border-white/10 font-sans">/</kbd> anywhere in the studio
            </p>
          </div>

        </div>
      </div>
    </PublicPageShell>
  );
}
