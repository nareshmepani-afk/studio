import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function StudioChapterLoading() {
  return (
    <div className="container relative z-10 mx-auto pt-10 px-4 max-w-4xl pb-20">
      <div className="mb-8 w-32 h-10 bg-white/5 rounded-lg animate-pulse" />
      
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden rounded-[2.5rem]">
        <CardHeader className="border-b border-white/5 pb-8 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/5 rounded-xl w-10 h-10 animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded-full animate-pulse" />
          </div>
          
          <div className="h-12 w-3/4 bg-white/10 rounded-xl mb-4 animate-pulse" />
          <div className="h-12 w-1/2 bg-white/10 rounded-xl animate-pulse" />
          
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-5/6 bg-white/5 rounded-full animate-pulse" />
          </div>
        </CardHeader>

        <CardContent className="p-8 md:p-12 pt-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-8 w-8 bg-white/5 rounded-full animate-pulse" />
            <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />
          </div>
          
          <div className="space-y-6 pl-6 border-l-2 border-white/5">
            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-4/5 bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-3/4 bg-white/5 rounded-full animate-pulse" />
          </div>

          <div className="mt-16 flex justify-end">
            <div className="w-48 h-16 bg-white/10 rounded-full animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
