import { MedicineItem, AppSettings, WhatsAppConfig } from '../types';
import { enrichMedicineItem, INITIAL_DEMO_DATA } from '../utils/medicationUtils';

const SETTINGS_KEY = 'family_med_tracker_settings';
const LOCAL_DATA_KEY = 'family_med_tracker_local_data';

export const CODE_GS_CONTENT = `/**
 * =========================================================================
 * FAMILY MEDICINE TRACKER - GOOGLE APPS SCRIPT (Code.gs)
 * With Automated WhatsApp Stock & Refill Alerts
 * =========================================================================
 * 
 * HEADERS IN ROW 1:
 * Col A: ID
 * Col B: Member Name
 * Col C: Medicine Name
 * Col D: Dosage
 * Col E: Timing
 * Col F: Daily Qty
 * Col G: Current Stock
 * Col H: Refill Threshold
 * Col I: Last Notified Date (NEW: Prevents notification spamming)
 * 
 * WHATSAPP CONFIGURATION:
 * Configure these variables or set them in Apps Script: Project Settings > Script Properties.
 * 
 * Easiest Provider (30-second free setup):
 * CALLMEBOT: Send "I allow callmebot to send me messages" to +34 644 44 42 06 on WhatsApp.
 * You will instantly get your free API key!
 * =========================================================================
 */

const SHEET_NAME = "Medicines";

var DEFAULT_CONFIG = {
  RECIPIENT_PHONE: "",
  PROVIDER: "CALLMEBOT",
  CALLMEBOT_API_KEY: "",
  META_ACCESS_TOKEN: "",
  META_PHONE_NUMBER_ID: "",
  NOTIFICATION_EMAIL: Session.getActiveUser().getEmail() || ""
};

function getConfig() {
  var props = PropertiesService.getScriptProperties().getProperties();
  return {
    RECIPIENT_PHONE: props.RECIPIENT_PHONE || DEFAULT_CONFIG.RECIPIENT_PHONE,
    PROVIDER: props.PROVIDER || DEFAULT_CONFIG.PROVIDER,
    CALLMEBOT_API_KEY: props.CALLMEBOT_API_KEY || DEFAULT_CONFIG.CALLMEBOT_API_KEY,
    META_ACCESS_TOKEN: props.META_ACCESS_TOKEN || DEFAULT_CONFIG.META_ACCESS_TOKEN,
    META_PHONE_NUMBER_ID: props.META_PHONE_NUMBER_ID || DEFAULT_CONFIG.META_PHONE_NUMBER_ID,
    NOTIFICATION_EMAIL: props.NOTIFICATION_EMAIL || DEFAULT_CONFIG.NOTIFICATION_EMAIL
  };
}

function getTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var files = DriveApp.getFilesByName("Family Medicine Tracker");
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      throw new Error('Spreadsheet "Family Medicine Tracker" not found.');
    }
  }

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "ID",
      "Member Name",
      "Medicine Name",
      "Dosage",
      "Timing",
      "Daily Qty",
      "Current Stock",
      "Refill Threshold",
      "Last Notified Date"
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#e6f4ea");
  } else {
    var lastCol = sheet.getLastColumn();
    if (lastCol < 9) {
      sheet.getRange(1, 9).setValue("Last Notified Date").setFontWeight("bold").setBackground("#e6f4ea");
    }
  }
  return sheet;
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action.toUpperCase() : "GET_MEDICINES";

    if (action === "TRIGGER_ALERTS") {
      var alertResult = checkAndSendStockAlerts(false);
      return createJsonResponse({
        status: "success",
        message: "Stock alert scan executed.",
        result: alertResult
      });
    }

    var sheet = getTargetSheet();
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createJsonResponse({
        status: "success",
        data: []
      });
    }

    var values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    var medicines = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var id = String(row[0] || "").trim();
      if (!id && !row[1] && !row[2]) continue;

      var dailyQty = Number(row[5]) || 0;
      var currentStock = Number(row[6]) || 0;
      var refillThreshold = Number(row[7]) || 0;
      var lastNotifiedDate = row[8] ? formatDateString(row[8]) : "";

      var daysLeft = dailyQty > 0 ? Math.floor(currentStock / dailyQty) : 999;
      
      var status = "OK";
      if (currentStock === 0 || daysLeft <= 3 || currentStock <= Math.floor(refillThreshold / 2)) {
        status = "Critical Reorder";
      } else if (currentStock <= refillThreshold || daysLeft <= 7) {
        status = "Low Stock";
      }

      medicines.push({
        id: id,
        memberName: String(row[1] || ""),
        medicineName: String(row[2] || ""),
        dosage: String(row[3] || ""),
        timing: String(row[4] || ""),
        dailyQty: dailyQty,
        currentStock: currentStock,
        refillThreshold: refillThreshold,
        lastNotifiedDate: lastNotifiedDate,
        daysLeft: daysLeft,
        status: status,
        rowIndex: i + 2
      });
    }

    return createJsonResponse({
      status: "success",
      count: medicines.length,
      data: medicines
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = String(payload.action || "").toUpperCase().trim();
    var sheet = getTargetSheet();

    if (action === "ADD") {
      var memberName = String(payload.memberName || "").trim();
      var medicineName = String(payload.medicineName || "").trim();
      
      if (!memberName || !medicineName) {
        return createJsonResponse({
          status: "error",
          message: "Member Name and Medicine Name are required."
        });
      }

      var id = payload.id ? String(payload.id).trim() : ("MED-" + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 900 + 100));
      var dosage = String(payload.dosage || "");
      var timing = String(payload.timing || "");
      var dailyQty = Number(payload.dailyQty) || 1;
      var currentStock = Number(payload.currentStock) || 0;
      var refillThreshold = Number(payload.refillThreshold) || 10;
      var lastNotifiedDate = "";

      sheet.appendRow([
        id,
        memberName,
        medicineName,
        dosage,
        timing,
        dailyQty,
        currentStock,
        refillThreshold,
        lastNotifiedDate
      ]);

      var daysLeft = dailyQty > 0 ? Math.floor(currentStock / dailyQty) : 999;
      var status = "OK";
      if (currentStock === 0 || daysLeft <= 3 || currentStock <= Math.floor(refillThreshold / 2)) {
        status = "Critical Reorder";
      } else if (currentStock <= refillThreshold || daysLeft <= 7) {
        status = "Low Stock";
      }

      if (status !== "OK" && (daysLeft < 5 || currentStock <= refillThreshold)) {
        checkAndSendSingleAlert(id, false);
      }

      return createJsonResponse({
        status: "success",
        message: "Medication added successfully",
        data: {
          id: id,
          memberName: memberName,
          medicineName: medicineName,
          dosage: dosage,
          timing: timing,
          dailyQty: dailyQty,
          currentStock: currentStock,
          refillThreshold: refillThreshold,
          lastNotifiedDate: lastNotifiedDate,
          daysLeft: daysLeft,
          status: status
        }
      });
    }

    else if (action === "UPDATE_STOCK") {
      var targetId = String(payload.id || "").trim();
      if (!targetId) {
        return createJsonResponse({
          status: "error",
          message: "ID is required for UPDATE_STOCK"
        });
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({
          status: "error",
          message: "Sheet contains no medication records"
        });
      }

      var idRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      var foundRow = -1;

      for (var j = 0; j < idRange.length; j++) {
        if (String(idRange[j][0]).trim() === targetId) {
          foundRow = j + 2;
          break;
        }
      }

      if (foundRow === -1) {
        return createJsonResponse({
          status: "error",
          message: "Medication with ID '" + targetId + "' not found"
        });
      }

      var currentStockCell = sheet.getRange(foundRow, 7);
      var oldStock = Number(currentStockCell.getValue()) || 0;
      var newStock = oldStock;

      if (payload.newStock !== undefined && payload.newStock !== null) {
        newStock = Math.max(0, Number(payload.newStock));
      } else if (payload.delta !== undefined && payload.delta !== null) {
        newStock = Math.max(0, oldStock + Number(payload.delta));
      }

      currentStockCell.setValue(newStock);

      var updatedRow = sheet.getRange(foundRow, 1, 1, 9).getValues()[0];
      var dQty = Number(updatedRow[5]) || 1;
      var rThreshold = Number(updatedRow[7]) || 10;
      var dLeft = dQty > 0 ? Math.floor(newStock / dQty) : 999;
      var uStatus = "OK";
      if (newStock === 0 || dLeft <= 3 || newStock <= Math.floor(rThreshold / 2)) {
        uStatus = "Critical Reorder";
      } else if (newStock <= rThreshold || dLeft <= 7) {
        uStatus = "Low Stock";
      }

      var alertTriggered = false;
      if (uStatus !== "OK" && (dLeft < 5 || newStock <= rThreshold)) {
        alertTriggered = checkAndSendSingleAlert(targetId, false);
      }

      var updatedLastNotified = sheet.getRange(foundRow, 9).getValue();

      return createJsonResponse({
        status: "success",
        message: "Stock updated successfully",
        id: targetId,
        newStock: newStock,
        daysLeft: dLeft,
        status: uStatus,
        lastNotifiedDate: updatedLastNotified ? formatDateString(updatedLastNotified) : "",
        alertSent: alertTriggered
      });
    }

    else if (action === "DELETE") {
      var deleteId = String(payload.id || "").trim();
      var totalRows = sheet.getLastRow();
      if (totalRows <= 1) return createJsonResponse({ status: "error", message: "Empty sheet" });

      var allIds = sheet.getRange(2, 1, totalRows - 1, 1).getValues();
      var deleteRowIndex = -1;

      for (var k = 0; k < allIds.length; k++) {
        if (String(allIds[k][0]).trim() === deleteId) {
          deleteRowIndex = k + 2;
          break;
        }
      }

      if (deleteRowIndex !== -1) {
        sheet.deleteRow(deleteRowIndex);
        return createJsonResponse({ status: "success", message: "Deleted successfully", deletedId: deleteId });
      }
      return createJsonResponse({ status: "error", message: "ID not found" });
    }

    else if (action === "TRIGGER_WHATSAPP_ALERT") {
      var medId = String(payload.id || "").trim();
      var force = payload.force === true;
      var result = medId ? checkAndSendSingleAlert(medId, force) : checkAndSendStockAlerts(force);
      return createJsonResponse({ status: "success", message: "WhatsApp alert triggered", result: result });
    }

    else if (action === "TEST_WHATSAPP") {
      var testPhone = String(payload.phone || "").trim();
      var testKey = String(payload.apiKey || "").trim();
      var testProvider = String(payload.provider || "CALLMEBOT").toUpperCase();
      var testMsg = "✅ *Family Medicine Tracker*\\nWhatsApp notifications connected! You will receive refill alerts when any medication is low or critical.";
      var testSuccess = sendWhatsAppMessage(testMsg, testPhone, testKey, testProvider);

      return createJsonResponse({
        status: testSuccess ? "success" : "error",
        message: testSuccess ? "Test WhatsApp message sent!" : "Failed to send WhatsApp message. Check phone number and API key."
      });
    }

    return createJsonResponse({ status: "error", message: "Unsupported action: " + action });

  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function checkAndSendStockAlerts(force) {
  var sheet = getTargetSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { scanned: 0, sent: 0 };

  var values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  var sentCount = 0;
  var now = new Date();
  var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var id = String(row[0] || "").trim();
    if (!id) continue;

    var memberName = String(row[1] || "Family Member");
    var medicineName = String(row[2] || "Medication");
    var dosage = String(row[3] || "");
    var timing = String(row[4] || "");
    var dailyQty = Number(row[5]) || 1;
    var currentStock = Number(row[6]) || 0;
    var refillThreshold = Number(row[7]) || 10;
    var lastNotifiedRaw = row[8];

    var daysLeft = dailyQty > 0 ? Math.floor(currentStock / dailyQty) : 999;
    var isCritical = currentStock === 0 || daysLeft <= 3 || currentStock <= Math.floor(refillThreshold / 2);
    var isLow = currentStock <= refillThreshold || daysLeft <= 7;
    var needsAlert = isCritical || isLow || daysLeft < 5 || currentStock <= refillThreshold;

    if (!needsAlert) continue;

    if (!force && lastNotifiedRaw) {
      var lastDateStr = formatDateString(lastNotifiedRaw).substring(0, 10);
      if (lastDateStr === todayStr) continue;
    }

    var statusTitle = isCritical ? "🚨 *CRITICAL REORDER NEEDED*" : "⚠️ *LOW STOCK WARNING*";
    var msg = statusTitle + "\\n\\n" +
              "👤 *Member:* " + memberName + "\\n" +
              "💊 *Medicine:* " + medicineName + (dosage ? " (" + dosage + ")" : "") + "\\n" +
              "📦 *Current Stock:* " + currentStock + " pills\\n" +
              "⏱️ *Supply Left:* " + (daysLeft >= 900 ? "N/A" : daysLeft + " days") + "\\n" +
              "🎯 *Refill Threshold:* " + refillThreshold + " pills\\n" +
              (timing ? "⏰ *Timing:* " + timing + "\\n" : "") +
              "\\n👉 Please arrange a pharmacy refill or order soon.";

    var sent = sendWhatsAppMessage(msg);
    if (sent) {
      sheet.getRange(i + 2, 9).setValue(Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"));
      sentCount++;
    }
  }

  return { scanned: values.length, sent: sentCount };
}

function checkAndSendSingleAlert(targetId, force) {
  var sheet = getTargetSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  var values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === targetId) {
      var row = values[i];
      var memberName = String(row[1] || "");
      var medicineName = String(row[2] || "");
      var dosage = String(row[3] || "");
      var timing = String(row[4] || "");
      var dailyQty = Number(row[5]) || 1;
      var currentStock = Number(row[6]) || 0;
      var refillThreshold = Number(row[7]) || 10;
      var lastNotifiedRaw = row[8];

      var daysLeft = dailyQty > 0 ? Math.floor(currentStock / dailyQty) : 999;
      var isCritical = currentStock === 0 || daysLeft <= 3 || currentStock <= Math.floor(refillThreshold / 2);
      var isLow = currentStock <= refillThreshold || daysLeft <= 7;
      var needsAlert = isCritical || isLow || daysLeft < 5 || currentStock <= refillThreshold;

      if (!needsAlert && !force) return false;

      var now = new Date();
      var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");

      if (!force && lastNotifiedRaw) {
        var lastDateStr = formatDateString(lastNotifiedRaw).substring(0, 10);
        if (lastDateStr === todayStr) return false;
      }

      var statusTitle = isCritical ? "🚨 *CRITICAL REORDER ALERT*" : "⚠️ *LOW STOCK WARNING*";
      var msg = statusTitle + "\\n\\n" +
                "👤 *Member:* " + memberName + "\\n" +
                "💊 *Medicine:* " + medicineName + (dosage ? " (" + dosage + ")" : "") + "\\n" +
                "📦 *Current Stock:* " + currentStock + " pills\\n" +
                "⏱️ *Days Left:* " + (daysLeft >= 900 ? "N/A" : daysLeft + " days") + "\\n" +
                "🎯 *Refill Threshold:* " + refillThreshold + " pills\\n" +
                (timing ? "⏰ *Timing:* " + timing + "\\n" : "") +
                "\\n👉 Please refill soon!";

      var sent = sendWhatsAppMessage(msg);
      if (sent) {
        sheet.getRange(i + 2, 9).setValue(Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"));
        return true;
      }
      return false;
    }
  }
  return false;
}

function sendWhatsAppMessage(messageText, overridePhone, overrideApiKey, overrideProvider) {
  var config = getConfig();
  var phone = overridePhone || config.RECIPIENT_PHONE;
  var provider = overrideProvider || config.PROVIDER || "CALLMEBOT";
  var apiKey = overrideApiKey || config.CALLMEBOT_API_KEY;

  if (!phone) {
    sendEmailFallback(messageText);
    return false;
  }

  phone = phone.replace(/[\\s\\-\\(\\)]/g, "");
  if (!phone.startsWith("+")) phone = "+" + phone;

  try {
    if (provider === "CALLMEBOT") {
      if (!apiKey) {
        sendEmailFallback(messageText);
        return false;
      }
      var cleanPhone = phone.replace("+", "");
      var url = "https://api.callmebot.com/whatsapp.php?phone=" + cleanPhone + "&text=" + encodeURIComponent(messageText) + "&apikey=" + apiKey;
      var response = UrlFetchApp.fetch(url, { method: "GET", muteHttpExceptions: true });
      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        sendEmailFallback(messageText);
        return true;
      }
    }
    sendEmailFallback(messageText);
    return false;
  } catch (err) {
    sendEmailFallback(messageText);
    return false;
  }
}

function sendEmailFallback(messageText) {
  try {
    var email = getConfig().NOTIFICATION_EMAIL;
    if (email) {
      MailApp.sendEmail({
        to: email,
        subject: "Family Medicine Tracker - Stock Alert",
        body: messageText.replace(/\\*/g, "")
      });
    }
  } catch (e) {}
}

function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  }
  return String(val);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        scriptUrl: parsed.scriptUrl || '',
        mode: parsed.mode || 'demo',
        autoSync: parsed.autoSync !== false,
        whatsApp: {
          recipientPhone: parsed.whatsApp?.recipientPhone || '',
          apiKey: parsed.whatsApp?.apiKey || '',
          provider: parsed.whatsApp?.provider || 'CALLMEBOT',
          emailFallback: parsed.whatsApp?.emailFallback || '',
          notifyThresholdDays: parsed.whatsApp?.notifyThresholdDays || 5,
          autoSendOnUpdate: parsed.whatsApp?.autoSendOnUpdate !== false
        }
      };
    }
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return {
    scriptUrl: '',
    mode: 'demo',
    autoSync: true,
    whatsApp: {
      recipientPhone: '',
      apiKey: '',
      provider: 'CALLMEBOT',
      emailFallback: '',
      notifyThresholdDays: 5,
      autoSendOnUpdate: true
    }
  };
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function getStoredLocalData(): MedicineItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(enrichMedicineItem);
      }
    }
  } catch (e) {
    console.error('Error loading local data', e);
  }
  return INITIAL_DEMO_DATA.map(enrichMedicineItem);
}

export function saveStoredLocalData(items: MedicineItem[]): void {
  try {
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving local data', e);
  }
}

/**
 * Fetch all medicines from Google Apps Script Web App
 */
export async function fetchFromGoogleSheet(scriptUrl: string): Promise<MedicineItem[]> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    throw new Error('Please configure a valid Google Apps Script Web App URL.');
  }

  const cleanUrl = scriptUrl.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Apps Script returned HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status === 'error') {
      throw new Error(json.message || 'Error reported by Google Sheet script');
    }

    const data: any[] = json.data || [];
    return data.map(enrichMedicineItem);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Check that your Apps Script Web App is deployed and accessible.');
    }
    throw error;
  }
}

/**
 * Post an action to Google Apps Script Web App
 */
export async function postToGoogleSheet(
  scriptUrl: string,
  payload: Record<string, any>
): Promise<any> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return;
  }

  const cleanUrl = scriptUrl.trim();

  try {
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });
  } catch (error: any) {
    console.warn('Google Sheet POST notification warning:', error);
  }
}

/**
 * Trigger WhatsApp alert directly
 */
export async function triggerWhatsAppAlert(
  scriptUrl: string,
  medId?: string,
  force: boolean = false
): Promise<void> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) return;
  await postToGoogleSheet(scriptUrl, {
    action: 'TRIGGER_WHATSAPP_ALERT',
    id: medId,
    force: force
  });
}
