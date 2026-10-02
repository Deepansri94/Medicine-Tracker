import React from 'react';
import { MedicineItem, WhatsAppConfig } from '../types';
import { Trash2, Edit3, Clock, AlertCircle, MessageSquare, Check } from 'lucide-react';
import { wasNotifiedToday } from '../utils/medicationUtils';

interface MedicineGridProps {
  medicines: MedicineItem[];
  whatsAppConfig: WhatsAppConfig;
  onUpdateStock: (id: string, delta: number) => void;
  onEditStock: (item: MedicineItem) => void;
  onDelete: (id: string) => void;
  onTriggerWhatsApp: (item: MedicineItem) => void;
}

export const MedicineGrid: React.FC<MedicineGridProps> = ({
  medicines,
  whatsAppConfig,
  onUpdateStock,
  onEditStock,
  onDelete,
  onTriggerWhatsApp
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {medicines.map(item => {
        const isCrit = item.status === 'Critical Reorder';
        const isLow = item.status === 'Low Stock';
        const notifiedToday = wasNotifiedToday(item.lastNotifiedDate);

        return (
          <div
            key={item.id}
            className={`bg-white border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm ${
              isCrit ? 'border-rose-200 ring-1 ring-rose-200' : isLow ? 'border-amber-200' : 'border-slate-200'
            }`}
          >
            <div>
              {/* Header: Member & Status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {item.memberName}
                </span>
                {isCrit ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    <AlertCircle className="w-3 h-3" />
                    Critical Reorder
                  </span>
                ) : isLow ? (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Low Stock
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    OK
                  </span>
                )}
              </div>

              {/* Medicine Name & Dosage */}
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {item.medicineName}
              </h3>
              {item.dosage && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {item.dosage}
                </p>
              )}

              {/* Timing */}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{item.timing || 'No timing specified'}</span>
              </div>

              {/* Stock and Days Left metric */}
              <div className="mt-3.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Current Stock</div>
                  <div className="text-lg font-mono font-bold text-slate-900">
                    {item.currentStock}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">
                      (min {item.refillThreshold})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Days Left</div>
                  <div className={`text-lg font-mono font-bold ${
                    isCrit ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-slate-900'
                  }`}>
                    {item.daysLeft >= 900 ? '∞' : `${item.daysLeft}d`}
                  </div>
                </div>
              </div>

              {/* Last Notified row */}
              <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Last WhatsApp Alert:</span>
                <span className="font-mono">
                  {item.lastNotifiedDate ? (
                    notifiedToday ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Today
                      </span>
                    ) : (
                      item.lastNotifiedDate.split(' ')[0]
                    )
                  ) : (
                    'None'
                  )}
                </span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                {(isCrit || isLow) && (
                  <button
                    onClick={() => onTriggerWhatsApp(item)}
                    className="p-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md"
                    title="Send WhatsApp Alert"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  </button>
                )}
                <button
                  onClick={() => onUpdateStock(item.id, -1)}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md"
                  title="Took 1 dose (-1)"
                >
                  -1
                </button>
                <button
                  onClick={() => onUpdateStock(item.id, 10)}
                  className="px-2 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md"
                  title="Add 10 pills"
                >
                  +10
                </button>
                <button
                  onClick={() => onUpdateStock(item.id, 30)}
                  className="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md"
                  title="Refill 30 pills"
                >
                  +30 Refill
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditStock(item)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                  title="Edit stock"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};
