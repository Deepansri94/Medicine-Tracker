import React from 'react';
import { MedicineItem } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle2, Users, Pill } from 'lucide-react';

interface StatsCardsProps {
  medicines: MedicineItem[];
  onFilterStatus?: (status: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ medicines, onFilterStatus }) => {
  const total = medicines.length;
  const critical = medicines.filter(m => m.status === 'Critical Reorder').length;
  const low = medicines.filter(m => m.status === 'Low Stock').length;
  const ok = medicines.filter(m => m.status === 'OK').length;
  
  const uniqueMembers = Array.from(new Set(medicines.map(m => m.memberName).filter(Boolean)));
  const totalDailyDoses = medicines.reduce((acc, curr) => acc + (curr.dailyQty || 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Active Meds */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('ALL')}
        className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Meds
          </span>
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Pill className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {total}
          </span>
          <span className="text-xs text-slate-500">
            across {uniqueMembers.length} {uniqueMembers.length === 1 ? 'person' : 'members'}
          </span>
        </div>
      </div>

      {/* Critical Reorders */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('Critical Reorder')}
        className={`bg-white border rounded-xl p-4 shadow-xs transition-colors cursor-pointer ${
          critical > 0 ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-200' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
            Critical Reorder
          </span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            critical > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'
          }`}>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${critical > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {critical}
          </span>
          <span className="text-xs text-rose-600 font-medium">
            {critical > 0 ? '≤ 3 days supply remaining' : 'All safe'}
          </span>
        </div>
      </div>

      {/* Low Stock Warning */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('Low Stock')}
        className={`bg-white border rounded-xl p-4 shadow-xs transition-colors cursor-pointer ${
          low > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Low Stock
          </span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            low > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${low > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {low}
          </span>
          <span className="text-xs text-amber-700">
            {low > 0 ? '≤ 7 days or under threshold' : 'None low'}
          </span>
        </div>
      </div>

      {/* Well Stocked (OK) */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('OK')}
        className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Adequate Stock
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {ok}
          </span>
          <span className="text-xs text-emerald-700">
            {totalDailyDoses} doses / day tracked
          </span>
        </div>
      </div>
    </div>
  );
};
