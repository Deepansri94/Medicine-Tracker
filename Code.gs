/**
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
 * You can configure these constants below, or set them in Apps Script:
 * Project Settings > Script Properties.
 * 
 * Supported WhatsApp Providers:
 * 1. "CALLMEBOT" (Recommended & Easiest: Free, takes 30s to setup.
 *    Get your free API key by sending "I allow callmebot to send me messages"
 *    to +34 644 44 42 06 on WhatsApp. See: https://www.callmebot.com/blog/free-api-whatsapp-messages/)
 * 2. "META" (Official WhatsApp Business Cloud API via Graph API)
 * 3. "TWILIO" (Twilio for WhatsApp API)
 * 4. "EMAIL" (Uses Google Apps Script MailApp to send email alerts as well)
 * =========================================================================
 */

const SHEET_NAME = "Medicines";

// Default WhatsApp Settings (can also be saved in Script Properties)
var DEFAULT_CONFIG = {
  // Recipient phone with international country code (e.g. "+1234567890" or "+919876543210")
  RECIPIENT_PHONE: "",
  // Provider: "CALLMEBOT", "META", "TWILIO", or "EMAIL"
  PROVIDER: "CALLMEBOT",
  // CallMeBot API key (if using CallMeBot)
  CALLMEBOT_API_KEY: "",
  // Meta Cloud API Token & Phone Number ID (if using Meta)
  META_ACCESS_TOKEN: "",
  META_PHONE_NUMBER_ID: "",
  // Optional email recipient for dual-channel alerts
  NOTIFICATION_EMAIL: Session.getActiveUser().getEmail() || ""
};

/**
 * Get Configuration from ScriptProperties or fallback to DEFAULT_CONFIG
 */
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

/**
 * Helper to get the target sheet and ensure 9 headers exist (including Col I: Last Notified Date)
 */
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
    // Check if Column I (Last Notified Date) exists in existing sheet
    var lastCol = sheet.getLastColumn();
    if (lastCol < 9) {
      sheet.getRange(1, 9).setValue("Last Notified Date").setFontWeight("bold").setBackground("#e6f4ea");
    }
  }
  return sheet;
}

/**
 * Handle GET requests - Fetches all medication rows with Last Notified Date
 */
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
        data: [],
        config: getSanitizedConfig()
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
      data: medicines,
      config: getSanitizedConfig()
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Handle POST requests - ADD, UPDATE_STOCK, DELETE, SEND_ALERT, SAVE_CONFIG
 */
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

    // -------------------------------------------------------------
    // ACTION 1: ADD
    // -------------------------------------------------------------
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

      // Check if newly added medication is immediately low or critical
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

    // -------------------------------------------------------------
    // ACTION 2: UPDATE_STOCK
    // -------------------------------------------------------------
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
      } else {
        return createJsonResponse({
          status: "error",
          message: "Please provide 'newStock' or 'delta' (e.g., +10 or -1)"
        });
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

      // Check and trigger WhatsApp alert if stock fell below threshold or < 5 days supply
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

    // -------------------------------------------------------------
    // ACTION 3: DELETE
    // -------------------------------------------------------------
    else if (action === "DELETE") {
      var deleteId = String(payload.id || "").trim();
      if (!deleteId) {
        return createJsonResponse({
          status: "error",
          message: "ID is required for DELETE"
        });
      }

      var totalRows = sheet.getLastRow();
      if (totalRows <= 1) {
        return createJsonResponse({
          status: "error",
          message: "Sheet contains no medication records"
        });
      }

      var allIds = sheet.getRange(2, 1, totalRows - 1, 1).getValues();
      var deleteRowIndex = -1;

      for (var k = 0; k < allIds.length; k++) {
        if (String(allIds[k][0]).trim() === deleteId) {
          deleteRowIndex = k + 2;
          break;
        }
      }

      if (deleteRowIndex === -1) {
        return createJsonResponse({
          status: "error",
          message: "Medication with ID '" + deleteId + "' not found"
        });
      }

      sheet.deleteRow(deleteRowIndex);

      return createJsonResponse({
        status: "success",
        message: "Medication deleted successfully",
        deletedId: deleteId
      });
    }

    // -------------------------------------------------------------
    // ACTION 4: TRIGGER_WHATSAPP_ALERT (Manual or forced trigger for a medicine)
    // -------------------------------------------------------------
    else if (action === "TRIGGER_WHATSAPP_ALERT") {
      var medId = String(payload.id || "").trim();
      var force = payload.force === true; // If true, ignores lastNotifiedDate check
      
      var result = medId ? checkAndSendSingleAlert(medId, force) : checkAndSendStockAlerts(force);
      
      return createJsonResponse({
        status: "success",
        message: "WhatsApp alert dispatched.",
        result: result
      });
    }

    // -------------------------------------------------------------
    // ACTION 5: TEST_WHATSAPP (Send a test ping to verify recipient phone)
    // -------------------------------------------------------------
    else if (action === "TEST_WHATSAPP") {
      var testPhone = String(payload.phone || "").trim();
      var testKey = String(payload.apiKey || "").trim();
      var testProvider = String(payload.provider || "CALLMEBOT").toUpperCase();

      var testMsg = "✅ *Family Medicine Tracker*\nWhatsApp notifications are successfully connected! You will receive instant refill alerts when any medication is low or critical.";
      
      var testSuccess = sendWhatsAppMessage(testMsg, testPhone, testKey, testProvider);

      return createJsonResponse({
        status: testSuccess ? "success" : "error",
        message: testSuccess ? "Test WhatsApp message sent successfully!" : "Failed to send WhatsApp message. Please check your phone number and API key."
      });
    }

    // -------------------------------------------------------------
    // ACTION 6: SAVE_WHATSAPP_CONFIG
    // -------------------------------------------------------------
    else if (action === "SAVE_WHATSAPP_CONFIG") {
      var scriptProps = PropertiesService.getScriptProperties();
      if (payload.phone) scriptProps.setProperty("RECIPIENT_PHONE", String(payload.phone).trim());
      if (payload.provider) scriptProps.setProperty("PROVIDER", String(payload.provider).trim());
      if (payload.apiKey) scriptProps.setProperty("CALLMEBOT_API_KEY", String(payload.apiKey).trim());
      if (payload.metaToken) scriptProps.setProperty("META_ACCESS_TOKEN", String(payload.metaToken).trim());
      if (payload.metaPhoneId) scriptProps.setProperty("META_PHONE_NUMBER_ID", String(payload.metaPhoneId).trim());
      if (payload.email) scriptProps.setProperty("NOTIFICATION_EMAIL", String(payload.email).trim());

      return createJsonResponse({
        status: "success",
        message: "WhatsApp notification settings saved in Google Apps Script.",
        config: getSanitizedConfig()
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Unsupported action: '" + action + "'."
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Checks all medications and sends WhatsApp/Email alerts for items with
 * Stock <= Refill Threshold OR Days Left < 5.
 * Uses Column I ("Last Notified Date") to prevent spamming within 24 hours.
 */
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

    // Check anti-spam: If already notified today and not forced, skip
    if (!force && lastNotifiedRaw) {
      var lastDateStr = formatDateString(lastNotifiedRaw).substring(0, 10);
      if (lastDateStr === todayStr) {
        Logger.log("Skipping " + medicineName + " for " + memberName + " - already notified today (" + lastDateStr + ")");
        continue;
      }
    }

    // Build WhatsApp message
    var statusTitle = isCritical ? "🚨 *CRITICAL REORDER NEEDED*" : "⚠️ *LOW STOCK WARNING*";
    var msg = statusTitle + "\n\n" +
              "👤 *Member:* " + memberName + "\n" +
              "💊 *Medicine:* " + medicineName + (dosage ? " (" + dosage + ")" : "") + "\n" +
              "📦 *Current Stock:* " + currentStock + " pills\n" +
              "⏱️ *Supply Remaining:* " + (daysLeft >= 900 ? "N/A" : daysLeft + " days") + "\n" +
              "🎯 *Refill Threshold:* " + refillThreshold + " pills\n" +
              (timing ? "⏰ *Timing:* " + timing + "\n" : "") +
              "\n👉 Please arrange a pharmacy refill or order soon to prevent missing doses.";

    var sent = sendWhatsAppMessage(msg);
    if (sent) {
      // Update Column I (Row index: i + 2, Column: 9)
      var timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
      sheet.getRange(i + 2, 9).setValue(timestamp);
      sentCount++;
    }
  }

  return { scanned: values.length, sent: sentCount };
}

/**
 * Checks and sends alert for a single medication ID
 */
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
        if (lastDateStr === todayStr) {
          Logger.log("Already notified today for " + medicineName);
          return false;
        }
      }

      var statusTitle = isCritical ? "🚨 *CRITICAL REORDER ALERT*" : "⚠️ *LOW STOCK WARNING*";
      var msg = statusTitle + "\n\n" +
                "👤 *Member:* " + memberName + "\n" +
                "💊 *Medicine:* " + medicineName + (dosage ? " (" + dosage + ")" : "") + "\n" +
                "📦 *Current Stock:* " + currentStock + " pills\n" +
                "⏱️ *Days Left:* " + (daysLeft >= 900 ? "N/A" : daysLeft + " days") + "\n" +
                "🎯 *Refill Threshold:* " + refillThreshold + " pills\n" +
                (timing ? "⏰ *Timing:* " + timing + "\n" : "") +
                "\n👉 Please refill soon!";

      var sent = sendWhatsAppMessage(msg);
      if (sent) {
        var timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
        sheet.getRange(i + 2, 9).setValue(timestamp);
        return true;
      }
      return false;
    }
  }
  return false;
}

/**
 * Dispatches WhatsApp notification via CallMeBot, Meta Cloud API, or Twilio
 */
function sendWhatsAppMessage(messageText, overridePhone, overrideApiKey, overrideProvider) {
  var config = getConfig();
  var phone = overridePhone || config.RECIPIENT_PHONE;
  var provider = overrideProvider || config.PROVIDER || "CALLMEBOT";
  var apiKey = overrideApiKey || config.CALLMEBOT_API_KEY;

  if (!phone) {
    Logger.log("No recipient phone configured for WhatsApp alert. Skipping WhatsApp.");
    sendEmailFallback(messageText);
    return false;
  }

  // Sanitize phone (remove spaces, dashes, parentheses)
  phone = phone.replace(/[\s\-\(\)]/g, "");
  if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  try {
    // -------------------------------------------------------------
    // Provider 1: CallMeBot (Free, Instant Webhook)
    // -------------------------------------------------------------
    if (provider === "CALLMEBOT") {
      if (!apiKey) {
        Logger.log("CallMeBot API Key missing. Please configure CALLMEBOT_API_KEY.");
        sendEmailFallback(messageText);
        return false;
      }

      var encodedText = encodeURIComponent(messageText);
      // Clean phone number for CallMeBot (without the '+')
      var cleanPhone = phone.replace("+", "");
      var url = "https://api.callmebot.com/whatsapp.php?phone=" + cleanPhone + "&text=" + encodedText + "&apikey=" + apiKey;

      var response = UrlFetchApp.fetch(url, {
        method: "GET",
        muteHttpExceptions: true
      });

      var resCode = response.getResponseCode();
      Logger.log("CallMeBot HTTP " + resCode + ": " + response.getContentText());
      if (resCode >= 200 && resCode < 300) {
        sendEmailFallback(messageText); // Also send dual-channel email
        return true;
      }
    }

    // -------------------------------------------------------------
    // Provider 2: Meta WhatsApp Cloud API (Graph API)
    // -------------------------------------------------------------
    else if (provider === "META") {
      var token = config.META_ACCESS_TOKEN;
      var phoneId = config.META_PHONE_NUMBER_ID;

      if (!token || !phoneId) {
        Logger.log("Meta Cloud API credentials missing.");
        sendEmailFallback(messageText);
        return false;
      }

      var metaUrl = "https://graph.facebook.com/v18.0/" + phoneId + "/messages";
      var metaPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone.replace("+", ""),
        type: "text",
        text: { body: messageText }
      };

      var metaRes = UrlFetchApp.fetch(metaUrl, {
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + token },
        payload: JSON.stringify(metaPayload),
        muteHttpExceptions: true
      });

      Logger.log("Meta Graph API response: " + metaRes.getContentText());
      if (metaRes.getResponseCode() === 200) {
        sendEmailFallback(messageText);
        return true;
      }
    }

    // Fallback: Send Email if WhatsApp call failed
    sendEmailFallback(messageText);
    return false;

  } catch (err) {
    Logger.log("Error sending WhatsApp notification: " + err.toString());
    sendEmailFallback(messageText);
    return false;
  }
}

/**
 * Dual-channel fallback: Sends alert to Google account email as well
 */
function sendEmailFallback(messageText) {
  try {
    var email = getConfig().NOTIFICATION_EMAIL;
    if (email) {
      MailApp.sendEmail({
        to: email,
        subject: "Family Medicine Tracker - Stock Alert",
        body: messageText.replace(/\*/g, "") // Clean markdown asterisks for plain text email
      });
      Logger.log("Email notification delivered to " + email);
    }
  } catch (e) {
    Logger.log("Email fallback error: " + e.toString());
  }
}

/**
 * Creates an automatic daily trigger in Apps Script to scan medicines every morning at 8:00 AM
 */
function createDailyNotificationTrigger() {
  // Delete existing triggers for checkAndSendStockAlerts
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "checkAndSendStockAlerts") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create new daily trigger at 8:00 AM
  ScriptApp.newTrigger("checkAndSendStockAlerts")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  Logger.log("Daily WhatsApp alert trigger scheduled for 8:00 AM every day.");
}

/**
 * Helper to format date strings cleanly
 */
function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
  }
  return String(val);
}

function getSanitizedConfig() {
  var cfg = getConfig();
  return {
    recipientPhone: cfg.RECIPIENT_PHONE,
    provider: cfg.PROVIDER,
    hasApiKey: Boolean(cfg.CALLMEBOT_API_KEY),
    notificationEmail: cfg.NOTIFICATION_EMAIL
  };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
