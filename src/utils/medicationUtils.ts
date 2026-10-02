import { MedicineItem } from '../types';

export const INITIAL_DEMO_DATA: MedicineItem[] = [
  {
    id: "MED-101",
    memberName: "Grandma Martha",
    medicineName: "Metformin 500mg",
    dosage: "1 tablet (500mg)",
    timing: "Morning & Evening with meals",
    dailyQty: 2,
    currentStock: 6,
    refillThreshold: 14,
    daysLeft: 3,
    status: "Critical Reorder",
    lastNotifiedDate: "2026-10-01 08:30",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "MED-102",
    memberName: "Grandma Martha",
    medicineName: "Lisinopril 10mg",
    dosage: "1 tablet (10mg)",
    timing: "Morning before breakfast",
    dailyQty: 1,
    currentStock: 4,
    refillThreshold: 10,
    daysLeft: 4,
    status: "Critical Reorder",
    lastNotifiedDate: "",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "MED-103",
    memberName: "Dad Robert",
    medicineName: "Atorvastatin 20mg",
    dosage: "1 tablet (20mg)",
    timing: "Bedtime",
    dailyQty: 1,
    currentStock: 22,
    refillThreshold: 10,
    daysLeft: 22,
    status: "OK",
    lastNotifiedDate: "",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "MED-104",
    memberName: "Mom Sarah",
    medicineName: "Levothyroxine 75mcg",
    dosage: "1 tablet (75mcg)",
    timing: "Morning (30 min before food)",
    dailyQty: 1,
    currentStock: 45,
    refillThreshold: 15,
    daysLeft: 45,
    status: "OK",
    lastNotifiedDate: "",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "MED-105",
    memberName: "Leo (Son)",
    medicineName: "Amoxicillin 250mg",
    dosage: "5ml liquid suspension",
    timing: "Three times daily after meals",
    dailyQty: 3,
    currentStock: 8,
    refillThreshold: 12,
    daysLeft: 2,
    status: "Critical Reorder",
    lastNotifiedDate: "2026-09-30 09:15",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "MED-106",
    memberName: "Leo (Son)",
    medicineName: "Children's Multivitamin",
    dosage: "1 gummy chewable",
    timing: "Morning with breakfast",
    dailyQty: 1,
    currentStock: 16,
    refillThreshold: 10,
    daysLeft: 16,
    status: "OK",
    lastNotifiedDate: "",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "MED-107",
    memberName: "Mom Sarah",
    medicineName: "Vitamin D3 2000 IU",
    dosage: "1 softgel",
    timing: "Lunch with food",
    dailyQty: 1,
    currentStock: 9,
    refillThreshold: 14,
    daysLeft: 9,
    status: "Low Stock",
    lastNotifiedDate: "",
    lastUpdated: new Date().toISOString()
  }
];

export function computeMedicineStatus(stock: number, dailyQty: number, threshold: number): {
  daysLeft: number;
  status: 'OK' | 'Low Stock' | 'Critical Reorder';
} {
  const daily = Math.max(0, dailyQty);
  const current = Math.max(0, stock);
  const limit = Math.max(1, threshold);

  const daysLeft = daily > 0 ? Math.floor(current / daily) : 999;

  let status: 'OK' | 'Low Stock' | 'Critical Reorder' = 'OK';

  if (current === 0 || daysLeft <= 3 || current <= Math.floor(limit / 2)) {
    status = 'Critical Reorder';
  } else if (current <= limit || daysLeft <= 7) {
    status = 'Low Stock';
  }

  return { daysLeft, status };
}

export function enrichMedicineItem(raw: Partial<MedicineItem>): MedicineItem {
  const dailyQty = Number(raw.dailyQty) > 0 ? Number(raw.dailyQty) : 1;
  const currentStock = Math.max(0, Number(raw.currentStock) || 0);
  const refillThreshold = Math.max(1, Number(raw.refillThreshold) || 10);
  
  const { daysLeft, status } = computeMedicineStatus(currentStock, dailyQty, refillThreshold);

  return {
    id: raw.id || `MED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    memberName: String(raw.memberName || '').trim(),
    medicineName: String(raw.medicineName || '').trim(),
    dosage: String(raw.dosage || '').trim(),
    timing: String(raw.timing || '').trim(),
    dailyQty,
    currentStock,
    refillThreshold,
    daysLeft,
    status,
    lastNotifiedDate: raw.lastNotifiedDate ? String(raw.lastNotifiedDate) : '',
    notes: raw.notes || '',
    lastUpdated: raw.lastUpdated || new Date().toISOString()
  };
}

/**
 * Generates the clean formatted WhatsApp alert text
 */
export function formatWhatsAppAlertText(item: MedicineItem): string {
  const isCritical = item.status === 'Critical Reorder';
  const header = isCritical ? '🚨 *CRITICAL REORDER ALERT*' : '⚠️ *LOW STOCK REFILL NOTICE*';
  
  return `${header}
*Family Medicine Tracker*

👤 *Member:* ${item.memberName}
💊 *Medicine:* ${item.medicineName}${item.dosage ? ` (${item.dosage})` : ''}
📦 *Current Stock:* ${item.currentStock} units
⏱️ *Supply Remaining:* ${item.daysLeft >= 900 ? 'N/A' : `${item.daysLeft} days`}
🎯 *Refill Threshold:* ${item.refillThreshold} units
${item.timing ? `⏰ *Timing:* ${item.timing}\n` : ''}
👉 Please order a pharmacy refill soon to prevent missed doses.`;
}

/**
 * Builds a direct WhatsApp Click-to-Chat URL (e.g. https://wa.me/...)
 */
export function getWhatsAppWebUrl(phone: string, item: MedicineItem): string {
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  const text = encodeURIComponent(formatWhatsAppAlertText(item));
  if (!cleanPhone) {
    return `https://wa.me/?text=${text}`;
  }
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

/**
 * Checks if notification was already sent today
 */
export function wasNotifiedToday(lastNotifiedDate?: string): boolean {
  if (!lastNotifiedDate) return false;
  const today = new Date().toISOString().substring(0, 10);
  return lastNotifiedDate.startsWith(today);
}
