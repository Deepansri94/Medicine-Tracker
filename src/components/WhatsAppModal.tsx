import React, { useState } from 'react';
import { X, Send, MessageSquare, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Phone } from 'lucide-react';
import { WhatsAppConfig } from '../types';
import { postToGoogleSheet } from '../services/gasService';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WhatsAppConfig;
  scriptUrl: string;
  onSaveConfig: (config: WhatsAppConfig) => void;
  onTriggerAlertsNow: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  config,
  scriptUrl,
  onSaveConfig,
  onTriggerAlertsNow
}) => {
  const [phone, setPhone] = useState(config.recipientPhone);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [provider, setProvider] = useState(config.provider);
  const [thresholdDays, setThresholdDays] = useState(String(config.notifyThresholdDays || 5));
  const [autoSend, setAutoSend] = useState(config.autoSendOnUpdate !== false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestWhatsApp = async () => {
    if (!phone.trim()) {
      setTestResult({ success: false, message: 'Please enter a recipient phone number (with country code).' });
      return;
    }

    if (provider === 'CALLMEBOT' && !apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter your CallMeBot API key.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Call CallMeBot directly from client or via Apps Script
    if (provider === 'CALLMEBOT' && apiKey.trim()) {
      try {
        const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
        const testText = encodeURIComponent('✅ *Family Medicine Tracker*\nWhatsApp notifications connected! You will receive refill alerts when medication stock is low.');
        const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${testText}&apikey=${apiKey.trim()}`;

        // Note: CallMeBot supports direct GET requests
        await fetch(callMeBotUrl, { mode: 'no-cors' });
        setTestResult({
          success: true,
          message: `Dispatched test WhatsApp message to ${phone}! Check your WhatsApp.`
        });
      } catch (err: any) {
        setTestResult({
          success: false,
          message: err.message || 'Failed to dispatch test WhatsApp.'
        });
      } finally {
        setIsTesting(false);
      }
    } else {
      // Direct Web link test
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      const testText = encodeURIComponent('✅ *Family Medicine Tracker*\nTesting WhatsApp alert message.');
      window.open(`https://wa.me/${cleanPhone}?text=${testText}`, '_blank');
      setTestResult({
        success: true,
        message: 'Opened WhatsApp Web test chat in new tab!'
      });
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: WhatsAppConfig = {
      recipientPhone: phone.trim(),
      apiKey: apiKey.trim(),
      provider: provider,
      emailFallback: config.emailFallback || '',
      notifyThresholdDays: parseInt(thresholdDays, 10) || 5,
      autoSendOnUpdate: autoSend
    };
    onSaveConfig(updated);

    if (scriptUrl) {
      postToGoogleSheet(scriptUrl, {
        action: 'SAVE_WHATSAPP_CONFIG',
        phone: phone.trim(),
        apiKey: apiKey.trim(),
        provider: provider
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                WhatsApp Stock &amp; Refill Alerts
              </h3>
              <p className="text-xs text-slate-600">
                Automated alerts when stock &lt; 5 days supply or under refill threshold
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Anti-Spam Notice */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-teal-900">
              <strong>Anti-Spam Column I ("Last Notified Date"):</strong> Google Apps Script records the date and time each alert is sent. It will never alert more than once in 24 hours for the same medication unless manually triggered.
            </div>
          </div>

          {/* Recipient Phone */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Recipient WhatsApp Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1234567890 or +919876543210 (include country code)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Must include country code (e.g. +1 for US/Canada, +44 for UK, +91 for India).
            </p>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block font-semibold text-slate-800 mb-2">
              WhatsApp Integration Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('CALLMEBOT')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === 'CALLMEBOT'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>CallMeBot API</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Free &amp; Instant</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Automated background WhatsApp dispatch from Google Apps Script.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('DIRECT_WA_LINK')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === 'DIRECT_WA_LINK'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Direct Click-to-Chat</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">Zero Setup</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  1-Click button opens WhatsApp Web / app with pre-filled message.
                </div>
              </button>
            </div>
          </div>

          {/* CallMeBot API Key Setup Instructions */}
          {provider === 'CALLMEBOT' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">How to get your free CallMeBot API Key:</span>
                <span className="text-[10px] text-slate-500 font-medium">Takes 30 seconds</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600">
                <li>
                  Save <strong>+34 644 44 42 06</strong> in your phone contacts as <em>CallMeBot</em>, or click{' '}
                  <a
                    href="https://wa.me/34644444206?text=I%20allow%20callmebot%20to%20send%20me%20messages"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    here to message them on WhatsApp <ExternalLink className="w-3 h-3" />
                  </a>.
                </li>
                <li>
                  Send the text: <code className="bg-white px-1 py-0.5 rounded font-mono border text-slate-800">I allow callmebot to send me messages</code>
                </li>
                <li>
                  CallMeBot will reply within 5 seconds with: <em>"API Activated! Your apikey is: 123456"</em>
                </li>
                <li>
                  Paste that API Key into the field below:
                </li>
              </ol>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  CallMeBot API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="e.g. 948215"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-600 bg-white"
                />
              </div>
            </div>
          )}

          {/* Threshold and Auto-send */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Refill Alert Threshold (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={thresholdDays}
                onChange={e => setThresholdDays(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
              />
              <span className="text-[10px] text-slate-400">Triggers if supply &lt; this number of days</span>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={autoSend}
                  onChange={e => setAutoSend(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Auto-alert on stock decrease
                </span>
              </label>
              <span className="text-[10px] text-slate-400 ml-6">
                Whenever a dose is taken or stock updated below threshold
              </span>
            </div>
          </div>

          {/* Test WhatsApp message action */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleTestWhatsApp}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Sending test...' : 'Send Test WhatsApp Ping'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onTriggerAlertsNow();
                onClose();
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Scan &amp; Alert Pending Items Now
            </button>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
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
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Preview of Message */}
          <div className="p-3 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              WhatsApp Alert Message Preview:
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
              {`🚨 *CRITICAL REORDER NEEDED*

👤 *Member:* Grandma Martha
💊 *Medicine:* Metformin 500mg (1 tablet)
📦 *Current Stock:* 6 pills
⏱️ *Supply Remaining:* 3 days
🎯 *Refill Threshold:* 14 pills
⏰ *Timing:* Morning & Evening

👉 Please arrange a pharmacy refill or order soon.`}
            </div>
          </div>

          {/* Form Actions */}
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
              className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              Save WhatsApp Settings
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
