import React from 'react';
import { MedicineItem, WhatsAppConfig } from '../types';
import { Trash2, Plus, Minus, Edit3, AlertCircle, Clock, Pill, MessageSquare, Check } from 'lucide-react';
import { wasNotifiedToday } from '../utils/medicationUtils';

interface MedicineTableProps {
  medicines: MedicineItem[];
  whatsAppConfig: WhatsAppConfig;
  onUpdateStock: (id: string, delta: number) => void;
  onEditStock: (item: MedicineItem) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
  onTriggerWhatsApp: (item: MedicineItem) => void;
}

export const MedicineTable: React.FC<MedicineTableProps> = ({
  medicines,
  whatsAppConfig,
  onUpdateStock,
  onEditStock,
  onDelete,
  onOpenAddModal,
  onTriggerWhatsApp
}) => {
  if (medicines.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Pill className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No medications found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          No records match your active search or member filter. Try clearing filters or add a new medication.
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add First Medication</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <th className="py-3 px-4">Member Name</th>
              <th className="py-3 px-4">Medicine &amp; Dosage</th>
              <th className="py-3 px-4">Timing &amp; Regimen</th>
              <th className="py-3 px-4 text-center">Daily Qty</th>
              <th className="py-3 px-4">Current Stock</th>
              <th className="py-3 px-4">Days Left</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Notified (WhatsApp)</th>
              <th className="py-3 px-4 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines.map(item => {
              const daysLeft = item.daysLeft;
              const isCrit = item.status === 'Critical Reorder';
              const isLow = item.status === 'Low Stock';
              const notifiedToday = wasNotifiedToday(item.lastNotifiedDate);
              
              const maxScale = Math.max(item.refillThreshold * 2, 30);
              const percentage = Math.min(100, Math.round((item.currentStock / maxScale) * 100));

              return (
                <tr 
                  key={item.id} 
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isCrit ? 'bg-rose-50/20' : ''
                  }`}
                >
                  {/* Member Name */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] uppercase">
                        {item.memberName.charAt(0) || 'M'}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {item.memberName}
                      </span>
                    </div>
                  </td>

                  {/* Medicine Name & Dosage */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-xs">
                      {item.medicineName}
                    </div>
                    {item.dosage && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.dosage}
                      </div>
                    )}
                  </td>

                  {/* Timing & Schedule */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]" title={item.timing}>
                        {item.timing || 'Not specified'}
                      </span>
                    </div>
                  </td>

                  {/* Daily Qty */}
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                    {item.dailyQty} / day
                  </td>

                  {/* Current Stock */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-bold ${
                        isCrit ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-slate-800'
                      }`}>
                        {item.currentStock}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (min {item.refillThreshold})
                      </span>
                    </div>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isCrit ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </td>

                  {/* Days Left */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isCrit && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                      <span className={`font-mono font-bold text-xs ${
                        isCrit ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-slate-800'
                      }`}>
                        {daysLeft >= 900 ? '∞ days' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      supply left
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {isCrit ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Critical Reorder
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        OK
                      </span>
                    )}
                  </td>

                  {/* Column I: Last Notified Date & Anti-Spam Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.lastNotifiedDate ? (
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700">
                          {notifiedToday ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Today
                            </span>
                          ) : (
                            <span>{item.lastNotifiedDate.split(' ')[0]}</span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            ({item.lastNotifiedDate.split(' ')[1] || ''})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {notifiedToday ? 'Protected from spam' : 'Ready for next alert'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">
                        Not alerted yet
                      </span>
                    )}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* WhatsApp Alert Button */}
                      {(isCrit || isLow) && (
                        <button
                          onClick={() => onTriggerWhatsApp(item)}
                          title={`Send WhatsApp refill alert for ${item.medicineName}`}
                          className={`p-1.5 rounded border transition-colors ${
                            notifiedToday
                              ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Dose Taken (-1) */}
                      <button
                        onClick={() => onUpdateStock(item.id, -1)}
                        title="Record 1 dose taken (-1)"
                        className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      {/* +10 quick stock */}
                      <button
                        onClick={() => onUpdateStock(item.id, 10)}
                        title="Add +10 pills"
                        className="px-2 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors"
                      >
                        +10
                      </button>

                      {/* +30 full refill */}
                      <button
                        onClick={() => onUpdateStock(item.id, 30)}
                        title="Refill 30 pills (1 month)"
                        className="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                      >
                        +30 Refill
                      </button>

                      {/* Custom stock edit */}
                      <button
                        onClick={() => onEditStock(item)}
                        title="Set exact stock"
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(item.id)}
                        title="Delete medication"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
