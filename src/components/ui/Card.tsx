import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', id }) => {
  return (
    <div
      id={id}
      className={`bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 ${className}`}
    >
      {children}
    </div>
  );
};

interface InfoNoticeProps {
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose' | 'slate';
  className?: string;
}

const variantNoticeMap = {
  emerald: 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200',
  cyan: 'bg-cyan-950/40 border-cyan-800/40 text-cyan-200',
  purple: 'bg-purple-950/40 border-purple-800/40 text-purple-200',
  amber: 'bg-amber-950/40 border-amber-800/40 text-amber-200',
  rose: 'bg-rose-950/40 border-rose-800/40 text-rose-200',
  slate: 'bg-slate-900 border-slate-800 text-slate-300',
};

export const InfoNotice: React.FC<InfoNoticeProps> = ({
  title,
  children,
  icon,
  variant = 'emerald',
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${variantNoticeMap[variant]} ${className}`}>
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="space-y-1">
        {title && <strong className="text-white block font-bold">{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
};
