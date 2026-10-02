export interface MedicineItem {
  id: string;
  memberName: string;
  medicineName: string;
  dosage: string;
  timing: string;
  dailyQty: number;
  currentStock: number;
  refillThreshold: number;
  daysLeft: number;
  status: 'OK' | 'Low Stock' | 'Critical Reorder';
  lastNotifiedDate?: string;
  notes?: string;
  lastUpdated?: string;
}

export type ConnectionMode = 'demo' | 'live';

export type WhatsAppProvider = 'CALLMEBOT' | 'META' | 'DIRECT_WA_LINK';

export interface WhatsAppConfig {
  recipientPhone: string;
  apiKey: string;
  provider: WhatsAppProvider;
  emailFallback: string;
  notifyThresholdDays: number;
  autoSendOnUpdate: boolean;
}

export interface AppSettings {
  scriptUrl: string;
  mode: ConnectionMode;
  autoSync: boolean;
  whatsApp: WhatsAppConfig;
}

export interface SetupStep {
  title: string;
  subtitle: string;
  instruction: string;
}
