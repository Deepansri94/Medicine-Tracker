import React, { useState } from 'react';
import { X, Pill, Plus } from 'lucide-react';
import { MedicineItem } from '../types';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<MedicineItem, 'id' | 'daysLeft' | 'status'>) => void;
  existingMembers: string[];
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingMembers
}) => {
  const [memberName, setMemberName] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timing, setTiming] = useState('');
  const [dailyQty, setDailyQty] = useState('1');
  const [currentStock, setCurrentStock] = useState('30');
  const [refillThreshold, setRefillThreshold] = useState('10');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !medicineName.trim()) return;

    onAdd({
      memberName: memberName.trim(),
      medicineName: medicineName.trim(),
      dosage: dosage.trim(),
      timing: timing.trim(),
      dailyQty: parseFloat(dailyQty) || 1,
      currentStock: parseInt(currentStock, 10) || 0,
      refillThreshold: parseInt(refillThreshold, 10) || 10,
      notes: notes.trim()
    });

    // Reset
    setMedicineName('');
    setDosage('');
    setTiming('');
    setDailyQty('1');
    setCurrentStock('30');
    setRefillThreshold('10');
    setNotes('');
    onClose();
  };

  const timingPresets = ['Morning', 'Noon', 'Evening', 'Bedtime', 'With meals', 'Before meals'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Family Medication</h3>
              <p className="text-xs text-slate-500">Record a new medicine in your Google Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Member Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Family Member Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={memberName}
              onChange={e => setMemberName(e.target.value)}
              placeholder="e.g. Grandma Martha, Dad Robert, Leo (Son)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
            {existingMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[11px] text-slate-400 self-center mr-1">Quick pick:</span>
                {existingMembers.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMemberName(m)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Medicine Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Medicine Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={medicineName}
              onChange={e => setMedicineName(e.target.value)}
              placeholder="e.g. Metformin, Lisinopril, Atorvastatin, Amoxicillin"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Dosage & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dosage
              </label>
              <input
                type="text"
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                placeholder="e.g. 500mg, 1 tablet, 5ml"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Timing / Schedule
              </label>
              <input
                type="text"
                value={timing}
                onChange={e => setTiming(e.target.value)}
                placeholder="e.g. Morning & Evening"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600"
              />
            </div>
          </div>

          {/* Timing presets */}
          <div className="flex flex-wrap gap-1">
            {timingPresets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setTiming(prev => prev ? `${prev}, ${preset}` : preset)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-[10px] transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Numbers: Daily Qty, Current Stock, Refill Threshold */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Daily Qty <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                required
                value={dailyQty}
                onChange={e => setDailyQty(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 font-mono"
              />
              <span className="text-[10px] text-slate-400">Pills / day</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={currentStock}
                onChange={e => setCurrentStock(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 font-mono"
              />
              <span className="text-[10px] text-slate-400">In cabinet</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Refill Threshold
              </label>
              <input
                type="number"
                min="1"
                required
                value={refillThreshold}
                onChange={e => setRefillThreshold(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 font-mono"
              />
              <span className="text-[10px] text-slate-400">Alert level</span>
            </div>
          </div>

          {/* Days Supply Preview */}
          {parseFloat(dailyQty) > 0 && (
            <div className="p-2.5 bg-teal-50/70 border border-teal-200/80 rounded-lg flex items-center justify-between">
              <span className="text-teal-900 font-medium">Estimated supply duration:</span>
              <span className="font-mono font-bold text-teal-800">
                {Math.floor((parseInt(currentStock, 10) || 0) / (parseFloat(dailyQty) || 1))} days
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Save Medication</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
