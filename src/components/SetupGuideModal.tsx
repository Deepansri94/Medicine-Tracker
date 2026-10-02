import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Sheet, FileCode, MessageSquare, ShieldCheck } from 'lucide-react';
import { CODE_GS_CONTENT } from '../services/gasService';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'code' | 'headers' | 'whatsapp'>('steps');

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(CODE_GS_CONTENT);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyHeaders = async () => {
    const headers = "ID\tMember Name\tMedicine Name\tDosage\tTiming\tDaily Qty\tCurrent Stock\tRefill Threshold\tLast Notified Date";
    try {
      await navigator.clipboard.writeText(headers);
      setCopiedHeaders(true);
      setTimeout(() => setCopiedHeaders(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Google Sheets &amp; Apps Script Setup Guide
              </h2>
              <p className="text-xs text-slate-500">
                With Automated WhatsApp Refill Alerts &amp; Anti-Spam (Col I)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'steps' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Step-by-Step
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  activeTab === 'whatsapp' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Setup</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  activeTab === 'code' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Code.gs</span>
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'headers' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sheet Headers
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {activeTab === 'steps' && (
            <div className="space-y-6">
              
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Create your Google Sheet
                  </h3>
                  <p className="text-slate-600">
                    Open <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline font-semibold inline-flex items-center gap-0.5">Google Sheets <ExternalLink className="w-3 h-3" /></a> and name your spreadsheet: <strong className="text-slate-900">"Family Medicine Tracker"</strong>.
                  </p>
                  <p className="text-slate-600">
                    Ensure the active tab/sheet is named <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-teal-800">Medicines</code>.
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-800 mb-0.5">9 Columns in Row 1:</div>
                      <div className="font-mono text-[11px] text-slate-600">
                        A: ID · B: Member Name · C: Medicine Name · D: Dosage · E: Timing · F: Daily Qty · G: Current Stock · H: Refill Threshold · <strong>I: Last Notified Date</strong>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyHeaders}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-xs shrink-0"
                    >
                      {copiedHeaders ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedHeaders ? 'Copied 9 Headers!' : 'Copy Headers'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Open Google Apps Script
                  </h3>
                  <p className="text-slate-600">
                    In your Google Sheet top menu, click on <strong className="text-slate-900">Extensions</strong> &gt; <strong className="text-slate-900">Apps Script</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Paste Code.gs (Includes WhatsApp Notifications &amp; Anti-Spam)
                    </h3>
                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied Code.gs!' : 'Copy Code.gs'}</span>
                    </button>
                  </div>
                  <p className="text-slate-600">
                    Select everything in the Apps Script editor (<kbd className="bg-slate-100 border border-slate-300 px-1 rounded">Ctrl+A</kbd>), delete it, and paste the code. Press <kbd className="bg-slate-100 border border-slate-300 px-1 rounded">Ctrl+S</kbd> to save.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-sm">
                  4
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Deploy as Web App ("Anyone" Access)
                  </h3>
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                    <ol className="list-decimal list-inside space-y-1.5 text-amber-800">
                      <li>Click the blue <strong className="text-slate-900 font-bold">Deploy</strong> button (top right) &gt; <strong className="text-slate-900 font-bold">New deployment</strong>.</li>
                      <li>Click the gear icon <span className="font-mono">⚙️</span> next to "Select type" and choose <strong className="text-slate-900 font-bold">Web app</strong>.</li>
                      <li>Execute as: <strong className="text-slate-900 font-bold">Me</strong></li>
                      <li>Who has access: <strong className="text-rose-700 font-bold uppercase underline">Anyone</strong></li>
                      <li>Click <strong className="text-slate-900 font-bold">Deploy</strong> and copy your Web App URL.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-sm">
                  5
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Optional: Daily 8:00 AM WhatsApp Scan Trigger
                  </h3>
                  <p className="text-slate-600">
                    To make Google automatically scan medications every morning at 8:00 AM and send WhatsApp alerts, simply select the function <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-teal-800">createDailyNotificationTrigger</code> in the Apps Script editor and click <strong>Run</strong> once!
                  </p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  Free 30-Second WhatsApp Notification Setup (CallMeBot)
                </h3>
                <p className="text-emerald-900 text-xs">
                  CallMeBot is a free webhook bot for Google Apps Script that dispatches real WhatsApp messages to your personal phone number.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-emerald-900">
                  <li>
                    On WhatsApp, send the message: <code className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold text-slate-900">I allow callmebot to send me messages</code> to <strong className="font-mono text-emerald-800">+34 644 44 42 06</strong>.
                  </li>
                  <li>
                    Within 5 seconds, CallMeBot will reply with your personal API Key.
                  </li>
                  <li>
                    In this app, click <strong className="text-emerald-800">WhatsApp Alerts</strong> (top right header) &gt; enter your phone number &amp; API Key &gt; Click <strong>Save WhatsApp Settings</strong>.
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Anti-Spam Column I ("Last Notified Date")
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To prevent notifying you repeatedly on the same day, Google Apps Script updates <strong>Column I ("Last Notified Date")</strong> with the current timestamp whenever an alert is sent.
                  If the medication stock is checked again on the same day, Apps Script checks Column I and skips sending duplicate alerts!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Code.gs Source Code</h3>
                  <p className="text-slate-500 text-[11px]">
                    Includes WhatsApp sending, anti-spam Column I, doGet, doPost, and daily morning trigger
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[500px]">
                  {CODE_GS_CONTENT}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Spreadsheet Headers (9 Columns)</h3>
                <button
                  onClick={handleCopyHeaders}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
                >
                  {copiedHeaders ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHeaders ? 'Copied!' : 'Copy Headers (Tab-separated)'}</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Col</th>
                      <th className="p-2 border-r border-slate-200">Header Name</th>
                      <th className="p-2 border-r border-slate-200">Type</th>
                      <th className="p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    <tr><td className="p-2 font-bold border-r">A</td><td className="p-2 border-r font-bold text-teal-800">ID</td><td className="p-2 border-r text-slate-500">String</td><td className="p-2 text-slate-600">Unique identifier (e.g. MED-101)</td></tr>
                    <tr><td className="p-2 font-bold border-r">B</td><td className="p-2 border-r font-bold text-teal-800">Member Name</td><td className="p-2 border-r text-slate-500">String</td><td className="p-2 text-slate-600">Family member taking this med</td></tr>
                    <tr><td className="p-2 font-bold border-r">C</td><td className="p-2 border-r font-bold text-teal-800">Medicine Name</td><td className="p-2 border-r text-slate-500">String</td><td className="p-2 text-slate-600">Prescription or supplement name</td></tr>
                    <tr><td className="p-2 font-bold border-r">D</td><td className="p-2 border-r font-bold text-teal-800">Dosage</td><td className="p-2 border-r text-slate-500">String</td><td className="p-2 text-slate-600">e.g. 500mg, 1 tablet</td></tr>
                    <tr><td className="p-2 font-bold border-r">E</td><td className="p-2 border-r font-bold text-teal-800">Timing</td><td className="p-2 border-r text-slate-500">String</td><td className="p-2 text-slate-600">Morning, Bedtime, With Meals</td></tr>
                    <tr><td className="p-2 font-bold border-r">F</td><td className="p-2 border-r font-bold text-teal-800">Daily Qty</td><td className="p-2 border-r text-slate-500">Number</td><td className="p-2 text-slate-600">Units consumed per day</td></tr>
                    <tr><td className="p-2 font-bold border-r">G</td><td className="p-2 border-r font-bold text-teal-800">Current Stock</td><td className="p-2 border-r text-slate-500">Number</td><td className="p-2 text-slate-600">Remaining pills in cabinet</td></tr>
                    <tr><td className="p-2 font-bold border-r">H</td><td className="p-2 border-r font-bold text-teal-800">Refill Threshold</td><td className="p-2 border-r text-slate-500">Number</td><td className="p-2 text-slate-600">Refill warning trigger count</td></tr>
                    <tr className="bg-emerald-50/50"><td className="p-2 font-bold border-r text-emerald-800">I</td><td className="p-2 border-r font-bold text-emerald-800">Last Notified Date</td><td className="p-2 border-r text-slate-500">String/Date</td><td className="p-2 text-slate-700">Timestamp of last WhatsApp alert to prevent spamming</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Automated WhatsApp notification logic is built into <code className="font-mono text-slate-700">Code.gs</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
