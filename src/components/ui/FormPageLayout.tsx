import React from 'react';
import { PageHeader } from './PageHeader';

interface FormPageLayoutProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  accentColor?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose' | 'slate';
  onBack: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl';
}

export const FormPageLayout: React.FC<FormPageLayoutProps> = ({
  title,
  subtitle,
  badge,
  icon,
  accentColor = 'emerald',
  onBack,
  rightAction,
  children,
  maxWidth = 'max-w-2xl',
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      <PageHeader
        title={title}
        subtitle={subtitle}
        badge={badge}
        icon={icon}
        accentColor={accentColor}
        onBack={onBack}
        rightAction={rightAction}
      />
      <main className={`flex-1 w-full ${maxWidth} mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in fade-in duration-150`}>
        {children}
      </main>
    </div>
  );
};
