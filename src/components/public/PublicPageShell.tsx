import { PublicFooter } from './PublicFooter';

interface PublicPageShellProps {
  children: React.ReactNode;
  className?: string;
  narrowWidth?: boolean;
}

export function PublicPageShell({
  children,
  className = '',
  narrowWidth = false,
}: PublicPageShellProps) {
  return (
    <div className="bg-[#0A0A0A] min-h-screen text-white flex flex-col justify-between">
      <main
        className={`mx-auto w-full flex-1 min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8 ${
          narrowWidth ? 'max-w-3xl' : 'max-w-7xl'
        } ${className}`}
      >
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
