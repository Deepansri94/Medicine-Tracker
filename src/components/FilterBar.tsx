import React from 'react';
import { Search, LayoutList, LayoutGrid, X } from 'lucide-react';

interface FilterBarProps {
  members: string[];
  selectedMember: string;
  onSelectMember: (member: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  viewMode: 'table' | 'grid';
  onToggleViewMode: (mode: 'table' | 'grid') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  members,
  selectedMember,
  onSelectMember,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
  viewMode,
  onToggleViewMode
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 mb-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Family Member filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Member:
          </span>
          <button
            onClick={() => onSelectMember('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              selectedMember === 'ALL'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Members
          </button>
          {members.map(member => (
            <button
              key={member}
              onClick={() => onSelectMember(member)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedMember === member
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {member}
            </button>
          ))}
        </div>

        {/* Search & Status Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search medication or dosage..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={e => onSelectStatus(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-teal-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="Critical Reorder">Critical Reorders Only</option>
            <option value="Low Stock">Low Stock Only</option>
            <option value="OK">Well Stocked (OK)</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => onToggleViewMode('table')}
              title="Table view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleViewMode('grid')}
              title="Card grid view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-teal-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
