import React from 'react';
import { Pill, RefreshCw, Plus, Settings, FileCode, Sheet, MessageSquare } from 'lucide-react';
import { ConnectionMode, WhatsAppConfig } from '../types';

interface HeaderProps {
  mode: ConnectionMode;
  isSyncing: boolean;
  whatsAppConfig: WhatsAppConfig;
  onSync: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenSetupGuide: () => void;
  onOpenStandaloneModal: () => void;
  onOpenWhatsAppModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  isSyncing,
  whatsAppConfig,
  onSync,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenSetupGuide,
  onOpenStandaloneModal,
  onOpenWhatsAppModal
}) => {
  const hasWhatsApp = Boolean(whatsAppConfig.recipientPhone);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Family Medicine Tracker
                </h1>
                {mode === 'live' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Google Sheet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Demo Preview
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Connected to Google Sheet: <span className="font-semibold text-slate-700">"Family Medicine Tracker"</span> (Tab: <span className="font-mono text-slate-700">Medicines</span>)
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onSync}
              disabled={isSyncing}
              title="Refresh inventory from Google Sheet"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* WhatsApp notification setup button */}
            <button
              onClick={onOpenWhatsAppModal}
              title="Configure WhatsApp low-stock notifications"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                hasWhatsApp
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 ${hasWhatsApp ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>WhatsApp Alerts</span>
              {hasWhatsApp && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              onClick={onOpenSetupGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
            >
              <Sheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Code.gs &amp; Sheet</span>
            </button>

            <button
              onClick={onOpenStandaloneModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
              title="View & copy single-file index.html"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>Standalone HTML</span>
            </button>

            <button
              onClick={onOpenSettingsModal}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Configure Google Apps Script URL"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
