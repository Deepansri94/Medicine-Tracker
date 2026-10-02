import React from 'react';
import { MedicineItem, WhatsAppConfig } from '../types';
import { AlertCircle, ShoppingBag, ArrowRight, MessageSquare } from 'lucide-react';
import { getWhatsAppWebUrl } from '../utils/medicationUtils';

interface ReorderAlertBannerProps {
  medicines: MedicineItem[];
  whatsAppConfig: WhatsAppConfig;
  onRefill: (id: string, delta: number) => void;
  onFilterCritical: () => void;
  onTriggerWhatsApp: (item: MedicineItem) => void;
}

export const ReorderAlertBanner: React.FC<ReorderAlertBannerProps> = ({
  medicines,
  whatsAppConfig,
  onRefill,
  onFilterCritical,
  onTriggerWhatsApp
}) => {
  const criticalItems = medicines.filter(m => m.status === 'Critical Reorder');
  const lowItems = medicines.filter(m => m.status === 'Low Stock');

  if (criticalItems.length === 0 && lowItems.length === 0) {
    return null;
  }

  const alertTarget = criticalItems[0] || lowItems[0];

  return (
    <div className="mb-6 rounded-xl border border-rose-200 bg-linear-to-r from-rose-50 via-amber-50/40 to-white p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-rose-100 p-2 text-rose-700 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              Pharmacy Refill Attention Needed
              {criticalItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-600 text-white">
                  {criticalItems.length} Urgent
                </span>
              )}
            </h4>
            <div className="mt-1 text-xs text-slate-700 flex flex-wrap gap-x-2 gap-y-1 items-center">
              <span>Attention required for:</span>
              {criticalItems.map((item, idx) => (
                <span key={item.id} className="font-semibold text-rose-800">
                  {item.memberName} ({item.medicineName} – {item.currentStock} left, {item.daysLeft}d supply)
                  {idx < criticalItems.length - 1 ? ',' : ''}
                </span>
              ))}
              {criticalItems.length === 0 && lowItems.slice(0, 3).map((item, idx) => (
                <span key={item.id} className="font-medium text-amber-900">
                  {item.memberName} ({item.medicineName} – {item.daysLeft}d left)
                  {idx < Math.min(lowItems.length, 3) - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Send WhatsApp notification button */}
          {alertTarget && (
            <button
              onClick={() => onTriggerWhatsApp(alertTarget)}
              title="Send WhatsApp Alert to recipient"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>WhatsApp Alert</span>
            </button>
          )}

          {criticalItems.length > 0 && (
            <button
              onClick={() => onRefill(criticalItems[0].id, 30)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Refill {criticalItems[0].medicineName.split(' ')[0]} (+30)</span>
            </button>
          )}
          <button
            onClick={onFilterCritical}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white border border-rose-200 hover:border-rose-300 rounded-lg transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
