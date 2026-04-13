'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clapperboard, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { Prompt } from '@/types';
import { cn } from '@/lib/utils';

interface StudioChapterContentProps {
  prompt: Prompt;
  parentPrompt?: Prompt;
  script: string;
  isModal?: boolean;
  isCompleted?: boolean;
}

export default function StudioChapterContent({ 
  prompt, 
  parentPrompt, 
  script,
  isModal = false,
  isCompleted = false
}: StudioChapterContentProps) {
  const displayPrompt = parentPrompt || prompt;

  return (
    <div className={cn(
      "relative z-10 mx-auto",
      isModal ? "p-0" : "container pt-10 px-4 max-w-4xl pb-20"
    )}>
      {!isModal && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Link href="/studio">
            <Button variant="ghost" className="mb-8 hover:bg-white/5 text-white/60 hover:text-white transition-all group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Studio
            </Button>
          </Link>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: isModal ? 0 : 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className={cn(
          "bg-white/[0.03] border-white/10 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden rounded-[2.5rem] border-t-white/20",
          isModal && "bg-transparent border-none shadow-none backdrop-blur-0 p-0 rounded-none border-t-0"
        )}>
          <CardHeader className={cn(
            "border-b border-white/5 pb-8 p-8 md:p-12",
            isModal && "px-0 pt-0 pb-2"
          )}>
            <div className={cn("flex items-center gap-3 mb-6", isModal && "mb-3")}>
              <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                <Clapperboard className="h-6 w-6 text-primary" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Production Brief</p>
            </div>
            
            <CardTitle className="text-2xl md:text-3xl font-headline font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent italic tracking-tight">
              {displayPrompt.title}
            </CardTitle>
            
            {parentPrompt && (
              <div className="inline-flex items-center mt-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-primary/80 text-xs font-bold uppercase tracking-wider">Scene: {prompt.title}</span>
              </div>
            )}
            
            <CardDescription className="text-white/50 italic mt-3 text-base leading-relaxed font-medium">
              "{prompt.description}"
            </CardDescription>
          </CardHeader>

          <CardContent className={cn(
            "p-8 md:p-12 pt-10",
            isModal && "px-0 pb-0 pt-0"
          )}>
            <div className="prose prose-invert prose-lg max-w-none">
              <h2 className="flex items-center text-primary/90 font-headline text-lg font-bold mb-4 tracking-tight">
                <BookOpen className="mr-3 h-5 w-5 text-primary/60" />
                Teleprompter Script
              </h2>
              
              <div className="relative group/script">
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent rounded-full shadow-[0_0_10px_rgba(var(--primary),0.2)]" />
                <div className="space-y-4 text-white/90 leading-[1.6] italic text-base md:text-lg font-medium tracking-tight">
                  {script.split('\n').map((paragraph, index) => (
                    <motion.p 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                      className="last:mb-0 relative"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-16 flex justify-end"
            >
              <Link href={`/record?promptId=${prompt.id}`}>
                <Button size="lg" className="rounded-full px-14 h-16 text-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_45px_rgba(var(--primary),0.6)] transition-all transform hover:scale-105 active:scale-95 bg-primary text-primary-foreground group overflow-hidden relative">
                  <span className="relative z-10 flex items-center gap-3">
                    {isCompleted ? (
                      <>
                        <Edit3 className="w-6 h-6" />
                        Edit Scene
                      </>
                    ) : (
                      <>
                        Start Production
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                </Button>
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
