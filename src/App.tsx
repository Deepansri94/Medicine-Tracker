import React, { useState, useEffect, useMemo } from 'react';
import { MedicineItem, AppSettings, WhatsAppConfig } from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredLocalData,
  saveStoredLocalData,
  fetchFromGoogleSheet,
  postToGoogleSheet
} from './services/gasService';
import { enrichMedicineItem, INITIAL_DEMO_DATA, getWhatsAppWebUrl, wasNotifiedToday } from './utils/medicationUtils';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { ReorderAlertBanner } from './components/ReorderAlertBanner';
import { FilterBar } from './components/FilterBar';
import { MedicineTable } from './components/MedicineTable';
import { MedicineGrid } from './components/MedicineGrid';
import { AddMedicineModal } from './components/AddMedicineModal';
import { EditStockModal } from './components/EditStockModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { StandaloneCodeModal } from './components/StandaloneCodeModal';
import { SettingsModal } from './components/SettingsModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { CheckCircle2, AlertCircle, Info, BookOpen, MessageSquare } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [medicines, setMedicines] = useState<MedicineItem[]>(getStoredLocalData());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters & Views
  const [selectedMember, setSelectedMember] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicineItem | null>(null);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [isStandaloneModalOpen, setIsStandaloneModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3800);
  };

  // Sync with Google Sheet
  const handleSync = async () => {
    if (settings.mode !== 'live' || !settings.scriptUrl) {
      showToast('Currently in Demo Mode. Connect your Google Sheet in Settings to sync live.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      const liveItems = await fetchFromGoogleSheet(settings.scriptUrl);
      setMedicines(liveItems);
      saveStoredLocalData(liveItems);
      showToast(`Synced ${liveItems.length} records from Google Sheet!`, 'success');
    } catch (err: any) {
      console.error('Sync failed:', err);
      showToast(err.message || 'Failed to sync with Google Sheet.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync on startup if live mode
  useEffect(() => {
    if (settings.mode === 'live' && settings.scriptUrl) {
      handleSync();
    }
  }, []);

  // Save to local storage when medicines change
  useEffect(() => {
    saveStoredLocalData(medicines);
  }, [medicines]);

  // Unique family members
  const memberList = useMemo(() => {
    return Array.from(new Set(medicines.map(m => m.memberName).filter(Boolean))).sort();
  }, [medicines]);

  // Filtered medication list
  const filteredMedicines = useMemo(() => {
    return medicines.filter(item => {
      if (selectedMember !== 'ALL' && item.memberName !== selectedMember) {
        return false;
      }
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.medicineName.toLowerCase().includes(query);
        const matchesMember = item.memberName.toLowerCase().includes(query);
        const matchesDosage = item.dosage.toLowerCase().includes(query);
        const matchesTiming = item.timing.toLowerCase().includes(query);
        if (!matchesName && !matchesMember && !matchesDosage && !matchesTiming) {
          return false;
        }
      }
      return true;
    });
  }, [medicines, selectedMember, selectedStatus, searchQuery]);

  // Action: Add Medicine
  const handleAddMedicine = async (newItemData: Omit<MedicineItem, 'id' | 'daysLeft' | 'status'>) => {
    const newItem = enrichMedicineItem(newItemData);
    const updated = [newItem, ...medicines];
    setMedicines(updated);
    showToast(`Added ${newItem.medicineName} for ${newItem.memberName}`, 'success');

    if (settings.mode === 'live' && settings.scriptUrl) {
      try {
        await postToGoogleSheet(settings.scriptUrl, {
          action: 'ADD',
          ...newItem
        });
      } catch (err) {
        console.error('Failed to post add action to Google Sheet', err);
      }
    }
  };

  // Action: Trigger WhatsApp Alert for a medication
  const handleTriggerWhatsApp = async (item: MedicineItem) => {
    const now = new Date();
    const timeStr = `${now.toISOString().substring(0, 10)} ${now.toTimeString().substring(0, 5)}`;
    
    // Update local state with new Last Notified Date
    const updated = medicines.map(m => m.id === item.id ? { ...m, lastNotifiedDate: timeStr } : m);
    setMedicines(updated);

    const phone = settings.whatsApp.recipientPhone;
    const provider = settings.whatsApp.provider;

    if (provider === 'DIRECT_WA_LINK' || !settings.scriptUrl) {
      // Open direct WhatsApp web link
      const url = getWhatsAppWebUrl(phone, item);
      window.open(url, '_blank');
      showToast(`Opened WhatsApp refill alert for ${item.medicineName} (${item.memberName})`, 'success');
    } else {
      // Call Google Apps Script backend to dispatch CallMeBot/Meta alert
      try {
        await postToGoogleSheet(settings.scriptUrl, {
          action: 'TRIGGER_WHATSAPP_ALERT',
          id: item.id,
          force: true
        });
        showToast(`WhatsApp refill alert sent for ${item.medicineName} to ${phone || 'recipient'}!`, 'success');
      } catch (err) {
        // Fallback to direct web link
        const url = getWhatsAppWebUrl(phone, item);
        window.open(url, '_blank');
        showToast(`Opened WhatsApp chat for ${item.medicineName}`, 'info');
      }
    }
  };

  // Action: Trigger Scan for All Pending Alerts
  const handleTriggerAllAlerts = async () => {
    const now = new Date();
    const timeStr = `${now.toISOString().substring(0, 10)} ${now.toTimeString().substring(0, 5)}`;
    
    // Scan items needing refill that were NOT already notified today
    const pendingItems = medicines.filter(m => 
      (m.status === 'Critical Reorder' || m.status === 'Low Stock' || m.daysLeft < 5) &&
      !wasNotifiedToday(m.lastNotifiedDate)
    );

    if (pendingItems.length === 0) {
      showToast('All low stock medications have already been notified today! Anti-spam active.', 'info');
      return;
    }

    // Update their Last Notified timestamps
    const pendingIds = new Set(pendingItems.map(p => p.id));
    const updated = medicines.map(m => pendingIds.has(m.id) ? { ...m, lastNotifiedDate: timeStr } : m);
    setMedicines(updated);

    if (settings.mode === 'live' && settings.scriptUrl) {
      try {
        await postToGoogleSheet(settings.scriptUrl, {
          action: 'TRIGGER_WHATSAPP_ALERT',
          force: false
        });
        showToast(`Dispatched WhatsApp alerts for ${pendingItems.length} medications!`, 'success');
      } catch (err) {
        showToast(`Processed alerts for ${pendingItems.length} medications.`, 'info');
      }
    } else {
      showToast(`Notified ${pendingItems.length} medications in demo mode.`, 'success');
    }
  };

  // Action: Update Stock (delta or absolute)
  const handleUpdateStock = async (id: string, delta: number) => {
    const target = medicines.find(m => m.id === id);
    if (!target) return;

    const newStock = Math.max(0, target.currentStock + delta);
    const now = new Date();
    const timeStr = `${now.toISOString().substring(0, 10)} ${now.toTimeString().substring(0, 5)}`;

    // Check if new stock is below threshold or < 5 days
    const enriched = enrichMedicineItem({
      ...target,
      currentStock: newStock
    });

    const isLowOrCritical = enriched.status !== 'OK' || enriched.daysLeft < 5;
    const shouldAlert = isLowOrCritical && settings.whatsApp.autoSendOnUpdate && !wasNotifiedToday(target.lastNotifiedDate);

    const updatedItem: MedicineItem = {
      ...enriched,
      lastNotifiedDate: shouldAlert ? timeStr : target.lastNotifiedDate
    };

    const updated = medicines.map(m => (m.id === id ? updatedItem : m));
    setMedicines(updated);

    const deltaSign = delta > 0 ? `+${delta}` : `${delta}`;
    showToast(`${target.medicineName} stock updated: ${target.currentStock} → ${newStock} (${deltaSign})`, 'success');

    if (shouldAlert && settings.whatsApp.recipientPhone) {
      setTimeout(() => {
        showToast(`WhatsApp refill alert triggered for ${target.medicineName} (${enriched.daysLeft}d left)`, 'info');
      }, 1000);
    }

    if (settings.mode === 'live' && settings.scriptUrl) {
      try {
        await postToGoogleSheet(settings.scriptUrl, {
          action: 'UPDATE_STOCK',
          id: id,
          newStock: newStock
        });
      } catch (err) {
        console.error('Failed to post stock update to Google Sheet', err);
      }
    }
  };

  // Action: Set Exact Stock
  const handleSetExactStock = async (id: string, newStock: number) => {
    const target = medicines.find(m => m.id === id);
    if (!target) return;

    const updatedItem = enrichMedicineItem({
      ...target,
      currentStock: newStock
    });

    const updated = medicines.map(m => (m.id === id ? updatedItem : m));
    setMedicines(updated);
    showToast(`${target.medicineName} stock set to ${newStock}`, 'success');

    if (settings.mode === 'live' && settings.scriptUrl) {
      try {
        await postToGoogleSheet(settings.scriptUrl, {
          action: 'UPDATE_STOCK',
          id: id,
          newStock: newStock
        });
      } catch (err) {
        console.error('Failed to post exact stock update to Google Sheet', err);
      }
    }
  };

  // Action: Delete Medicine
  const handleDeleteMedicine = async (id: string) => {
    const target = medicines.find(m => m.id === id);
    if (!target) return;

    if (!confirm(`Are you sure you want to delete ${target.medicineName} for ${target.memberName}?`)) {
      return;
    }

    const updated = medicines.filter(m => m.id !== id);
    setMedicines(updated);
    showToast(`Deleted ${target.medicineName}`, 'info');

    if (settings.mode === 'live' && settings.scriptUrl) {
      try {
        await postToGoogleSheet(settings.scriptUrl, {
          action: 'DELETE',
          id: id
        });
      } catch (err) {
        console.error('Failed to post delete action to Google Sheet', err);
      }
    }
  };

  // Action: Reset Demo
  const handleResetDemoData = () => {
    const fresh = INITIAL_DEMO_DATA.map(enrichMedicineItem);
    setMedicines(fresh);
    saveStoredLocalData(fresh);
    showToast('Reset to default sample medications.', 'info');
  };

  // Action: Save Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    showToast('Settings saved successfully.', 'success');
    if (newSettings.mode === 'live' && newSettings.scriptUrl) {
      handleSync();
    }
  };

  // Action: Save WhatsApp Settings
  const handleSaveWhatsAppConfig = (whatsAppConfig: WhatsAppConfig) => {
    const newSettings = { ...settings, whatsApp: whatsAppConfig };
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    showToast('WhatsApp notification settings saved!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-rose-50 border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        mode={settings.mode}
        isSyncing={isSyncing}
        whatsAppConfig={settings.whatsApp}
        onSync={handleSync}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
        onOpenStandaloneModal={() => setIsStandaloneModalOpen(true)}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
      />

      {/* Demo Mode Notice Bar (if in demo) */}
      {settings.mode === 'demo' && (
        <div className="bg-linear-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-amber-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>
                <strong>Demo Mode Active:</strong> Viewing sample family inventory. All edits &amp; WhatsApp alerts are simulated locally.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSetupGuideOpen(true)}
                className="font-semibold underline hover:text-amber-950 inline-flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>View Google Apps Script (Code.gs) &amp; Sheet Instructions</span>
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-2 py-0.5 rounded bg-amber-200/70 hover:bg-amber-300 font-bold text-amber-950 text-[11px] transition-colors"
              >
                Connect Live Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Urgent Reorder Banner */}
        <ReorderAlertBanner
          medicines={medicines}
          whatsAppConfig={settings.whatsApp}
          onRefill={(id, delta) => handleUpdateStock(id, delta)}
          onFilterCritical={() => {
            setSelectedStatus('Critical Reorder');
            setSelectedMember('ALL');
          }}
          onTriggerWhatsApp={handleTriggerWhatsApp}
        />

        {/* Metric Cards */}
        <StatsCards
          medicines={medicines}
          onFilterStatus={(status) => {
            setSelectedStatus(status);
            setSelectedMember('ALL');
          }}
        />

        {/* Filter & Controls Bar */}
        <FilterBar
          members={memberList}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
        />

        {/* Content View: Table or Grid */}
        {viewMode === 'table' ? (
          <MedicineTable
            medicines={filteredMedicines}
            whatsAppConfig={settings.whatsApp}
            onUpdateStock={handleUpdateStock}
            onEditStock={(item) => {
              setEditingItem(item);
              setIsEditStockModalOpen(true);
            }}
            onDelete={handleDeleteMedicine}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onTriggerWhatsApp={handleTriggerWhatsApp}
          />
        ) : (
          <MedicineGrid
            medicines={filteredMedicines}
            whatsAppConfig={settings.whatsApp}
            onUpdateStock={handleUpdateStock}
            onEditStock={(item) => {
              setEditingItem(item);
              setIsEditStockModalOpen(true);
            }}
            onDelete={handleDeleteMedicine}
            onTriggerWhatsApp={handleTriggerWhatsApp}
          />
        )}

        {/* Quick Helper Cards at Bottom */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div 
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                WhatsApp Alert Settings
              </span>
              <span className="text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Configure recipient phone, free CallMeBot webhook, and anti-spam threshold (Col I).
            </p>
          </div>

          <div 
            onClick={() => setIsSetupGuideOpen(true)}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Google Sheet Backend &amp; Code.gs</span>
              <span className="text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Instructions on how to paste <code className="text-teal-700 font-mono">Code.gs</code> with Column I: Last Notified Date and daily morning schedule.
            </p>
          </div>

          <div 
            onClick={() => setIsStandaloneModalOpen(true)}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Standalone Single-File index.html</span>
              <span className="text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              View, copy, or download the self-contained vanilla HTML/JS file with WhatsApp refill alerts.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Family Medicine Tracker</span>
            <span>·</span>
            <span>WhatsApp Notifications &amp; Anti-Spam (Col I)</span>
          </div>
          <div>
            Auto-calculates days supply = <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">Current Stock / Daily Qty</code>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMedicine}
        existingMembers={memberList}
      />

      <EditStockModal
        item={editingItem}
        isOpen={isEditStockModalOpen}
        onClose={() => {
          setIsEditStockModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSetExactStock}
      />

      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        config={settings.whatsApp}
        scriptUrl={settings.scriptUrl}
        onSaveConfig={handleSaveWhatsAppConfig}
        onTriggerAlertsNow={handleTriggerAllAlerts}
      />

      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />

      <StandaloneCodeModal
        isOpen={isStandaloneModalOpen}
        onClose={() => setIsStandaloneModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetDemoData={handleResetDemoData}
        onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
      />

    </div>
  );
}
