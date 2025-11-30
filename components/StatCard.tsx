import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  colorClass: string;
  helpText?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon: Icon, colorClass, helpText }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 h-full group">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg bg-opacity-10 dark:bg-opacity-20 ${colorClass.replace('text-', 'bg-')} ${colorClass} transition-colors`}>
          <Icon size={20} />
        </div>
        {helpText && (
          <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700">
            {helpText}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left block">
            {value}
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">{unit}</span>
        </div>
      </div>
    </div>
  );
};