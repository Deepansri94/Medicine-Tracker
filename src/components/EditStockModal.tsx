import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { MedicineItem } from '../types';

interface EditStockModalProps {
  item: MedicineItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newStock: number) => void;
}

export const EditStockModal: React.FC<EditStockModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave
}) => {
  const [stockVal, setStockVal] = useState('0');

  useEffect(() => {
    if (item) {
      setStockVal(String(item.currentStock));
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Math.max(0, parseInt(stockVal, 10) || 0);
    onSave(item.id, parsed);
    onClose();
  };

  const handleQuickAdd = (delta: number) => {
    const current = Math.max(0, parseInt(stockVal, 10) || 0);
    setStockVal(String(Math.max(0, current + delta)));
  };

  const computedDays = item.dailyQty > 0 ? Math.floor((parseInt(stockVal, 10) || 0) / item.dailyQty) : 999;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden">
        
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Update Medicine Stock</h3>
            <p className="text-xs text-slate-500">{item.memberName} · {item.medicineName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Exact Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              required
              value={stockVal}
              onChange={e => setStockVal(e.target.value)}
              className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Quick delta buttons */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Quick Adjust:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickAdd(-1)}
                className="py-1 px-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                className="py-1 px-2 text-xs font-semibold rounded bg-teal-50 hover:bg-teal-100 text-teal-800"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(30)}
                className="py-1 px-2 text-xs font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
              >
                +30
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(60)}
                className="py-1 px-2 text-xs font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
              >
                +60
              </button>
            </div>
          </div>

          {/* Supply Duration Result */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-slate-600">Days of supply:</span>
            <span className="font-mono font-bold text-slate-900">
              {computedDays >= 900 ? '∞' : `${computedDays} days`}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Update Stock</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
