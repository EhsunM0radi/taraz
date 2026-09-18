import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  hint,
  error,
  icon,
  children,
  className = '',
  id,
}) => {
  return (
    <div className={`space-y-1.5 ${className}`} id={id}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <span>{label}</span>
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
        {hint && <span className="text-[11px] text-slate-500 font-normal">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
