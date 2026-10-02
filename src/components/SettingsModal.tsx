import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, Key, ExternalLink, Database } from 'lucide-react';
import { AppSettings } from '../types';
import { fetchFromGoogleSheet } from '../services/gasService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetDemoData: () => void;
  onOpenSetupGuide: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetDemoData,
  onOpenSetupGuide
}) => {
  const [url, setUrl] = useState(settings.scriptUrl);
  const [mode, setMode] = useState(settings.mode);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a Google Apps Script Web App URL first.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const items = await fetchFromGoogleSheet(url.trim());
      setTestResult({
        success: true,
        message: `Successfully connected to sheet! Received ${items.length} records.`,
        count: items.length
      });
      setMode('live');
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect. Ensure your deployment access is set to "Anyone".'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      scriptUrl: url.trim(),
      mode: url.trim() ? mode : 'demo'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">Google Sheet Connection</h3>
            <p className="text-xs text-slate-500">Configure your Apps Script Web App endpoint</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          
          {/* Mode selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Operating Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('live')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'live'
                    ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Live Google Sheet
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Syncs directly with your Google Sheet tab "Medicines"
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('demo')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'demo'
                    ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Local Demo Mode
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Works offline with realistic sample family data
                </div>
              </button>
            </div>
          </div>

          {/* Web App URL input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Google Apps Script Web App URL
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSetupGuide();
                }}
                className="text-teal-600 hover:underline font-semibold text-[11px]"
              >
                Need instructions?
              </button>
            </div>
            <input
              type="url"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Obtained after clicking <strong>Deploy &gt; New deployment &gt; Web app</strong> in your Google Sheet script editor.
            </p>
          </div>

          {/* Test Connection Button */}
          <div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-teal-600' : ''}`} />
              <span>{isTesting ? 'Testing connection...' : 'Test Connection'}</span>
            </button>

            {testResult && (
              <div
                className={`mt-2 p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{testResult.message}</div>
                  {!testResult.success && (
                    <div className="text-[11px] mt-1 text-rose-700">
                      Did you set <strong>"Who has access"</strong> to <strong>"Anyone"</strong> during deployment? Google Apps Script requires this for public web apps.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Data option */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700 block">Reset Demo Inventory</span>
              <span className="text-[11px] text-slate-400">Restore default demo medications for family</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset to default sample medicines?')) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-slate-100 rounded border border-slate-200"
            >
              Reset Demo
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
            >
              Save &amp; Apply
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
