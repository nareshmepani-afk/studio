import { ReactNode } from 'react';

interface RemoteControlSectionProps {
  title: string;
  children: ReactNode;
}

export const RemoteControlSection = ({ title, children }: RemoteControlSectionProps) => {
  return (
    <div className="bg-studio-card p-3 rounded-md">
      <h3 className="text-sm font-bold text-center text-studio-text-secondary mb-2">{title}</h3>
      {children}
    </div>
  );
};
