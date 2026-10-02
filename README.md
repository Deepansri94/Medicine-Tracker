# 💊 Family Medicine Tracker

A lightweight, production-ready **Family Medicine & Refill Tracker** web application backed by **Google Sheets** and **Google Apps Script**, featuring automated **WhatsApp low-stock notifications** with built-in anti-spam protection.

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-emerald)
![License](https://img.shields.io/badge/License-Apache%202.0-blue)
![Backend](https://img.shields.io/badge/Backend-Google%20Sheets%20%2B%20Apps%20Script-green)
![Notifications](https://img.shields.io/badge/Alerts-WhatsApp%20Webhook-25D366)

---

## 🌟 Features

- **Google Sheets As Database**: Your data lives in your personal Google Sheet. No paid databases or servers required.
- **Automated WhatsApp Alerts**: Instant notification when any medication drops below its **Refill Threshold** or has **less than 5 days supply** remaining.
- **Anti-Spam Intelligence**: Uses **Column I (`Last Notified Date`)** to prevent spamming notifications more than once every 24 hours.
- **Smart Days-Left Calculation**: Automatically computes remaining days of supply (`Current Stock / Daily Qty`) and visual stock progress bars.
- **Status Indicator Badges**: Instant visual identification for **Critical Reorder** (≤ 3 days supply or empty), **Low Stock** (≤ 7 days supply), and **OK**.
- **Quick Stock Actions**: One-click `+10` pills, `+30 Refill` (1 month), and `-1` dose recorded.
- **Family Member Filtering & Search**: Instant filtering by family member (Mom, Dad, Grandma, Children) or searching by medication name/dosage.
- **Dual Delivery Modes**:
  1. **Full-Featured React App** (TypeScript + Vite + Tailwind CSS + Lucide Icons).
  2. **Standalone Single-File Web App** (`/standalone/index.html`) requiring zero build tools or servers.

---

## 📁 Repository Structure

```text
├── Code.gs                   # Complete Google Apps Script backend code
├── README.md                 # Project documentation & setup instructions
├── index.html                # App entry point
├── package.json              # Dependencies and build scripts
├── standalone/
│   └── index.html            # Zero-dependency, single-file HTML/CSS/JS version
└── src/
    ├── App.tsx               # Main application component & state orchestrator
    ├── components/
    │   ├── Header.tsx        # Brand navigation & mode indicators
    │   ├── StatsCards.tsx    # Summary metrics & urgent counters
    │   ├── ReorderAlertBanner.tsx # Refill urgency alert banner
    │   ├── FilterBar.tsx     # Member tabs, search bar & view toggle
    │   ├── MedicineTable.tsx # High-contrast medical inventory table
    │   ├── MedicineGrid.tsx  # Responsive card grid view
    │   ├── AddMedicineModal.tsx # Form to register family medications
    │   ├── EditStockModal.tsx   # Custom stock adjuster dialog
    │   ├── SetupGuideModal.tsx  # Step-by-step in-app deployment guide
    │   ├── StandaloneCodeModal.tsx # In-app single-file viewer & exporter
    │   ├── WhatsAppModal.tsx    # WhatsApp webhook configuration & test ping
    │   └── SettingsModal.tsx    # Google Apps Script Web App URL settings
    ├── services/
    │   ├── gasService.ts     # Google Apps Script HTTP client & offline store
    │   └── standaloneHtmlContent.ts # Single-file HTML source
    ├── types.ts              # TypeScript interfaces
    └── utils/
        └── medicationUtils.ts# Dosage math, status formulas & WhatsApp text generator
```

---

## 📊 Google Sheets Backend Setup

### 1. Create Your Sheet
1. Open [Google Sheets](https://sheets.new) and name the spreadsheet: **`Family Medicine Tracker`**.
2. Rename the active sheet tab to: **`Medicines`**.
3. In **Row 1** (cells `A1` to `I1`), add the following 9 column headers:

| Col | Header Name | Type | Description |
|---|---|---|---|
| **A** | `ID` | String | Unique record ID (e.g. `MED-101`) |
| **B** | `Member Name` | String | Family member taking this medication |
| **C** | `Medicine Name` | String | Brand or generic name of medication |
| **D** | `Dosage` | String | e.g. `500mg`, `1 tablet`, `5ml` |
| **E** | `Timing` | String | e.g. `Morning`, `Bedtime`, `With meals` |
| **F** | `Daily Qty` | Number | Units consumed per day |
| **G** | `Current Stock` | Number | Remaining pills/liquid units in cabinet |
| **H** | `Refill Threshold`| Number | Alert trigger level (e.g. `10`) |
| **I** | `Last Notified Date`| String | Timestamp of last alert to avoid spamming |

---

## ⚙️ Google Apps Script Deployment (`Code.gs`)

1. In your Google Sheet menu, click **Extensions** > **Apps Script**.
2. Delete any default code in `Code.gs`.
3. Copy the entire content of [`Code.gs`](./Code.gs) from this repository and paste it into the editor.
4. Click the **Save** icon (or `Ctrl+S` / `Cmd+S`).
5. Click **Deploy** (top right) > **New deployment**.
6. Click the gear icon ⚙️ next to *Select type* and select **Web app**.
7. Set the deployment configuration:
   - **Description**: `Family Medicine Tracker API`
   - **Execute as**: `Me (your email)`
   - **Who has access**: **`Anyone`** *(Required so web frontends can call the API)*
8. Click **Deploy**, authorize permissions when prompted, and copy your **Web App URL** (`https://script.google.com/macros/s/.../exec`).

### Setting Up Automatic Daily Morning WhatsApp Scans
To have Google Apps Script automatically check medication inventory every morning at 8:00 AM:
1. In the Apps Script toolbar, select the function **`createDailyNotificationTrigger`**.
2. Click **Run** once. This creates an automatic Google Cloud time-based trigger.

---

## 💬 WhatsApp Notifications Setup (Free 30s Webhook)

The tracker supports **CallMeBot**, a free, reliable webhook for sending WhatsApp messages directly to your personal phone number.

1. On your phone, open WhatsApp and send the following message to **`+34 644 44 42 06`**:
   ```text
   I allow callmebot to send me messages
   ```
2. CallMeBot will reply within seconds with your personal **API Key**.
3. In the Family Medicine Tracker app:
   - Click **WhatsApp Alerts** in the top navigation bar.
   - Enter your phone number with international country code (e.g. `+1234567890` or `+919876543210`).
   - Enter your **CallMeBot API Key**.
   - Click **Send Test WhatsApp Ping** to verify connectivity, then click **Save**.

### How Anti-Spam Protection Works:
When stock drops below threshold or has less than 5 days supply, Google Apps Script checks **Column I (`Last Notified Date`)**. If an alert was already dispatched today (`yyyy-MM-dd`), duplicate notifications are automatically skipped unless manually forced.

---

## 🚀 Local Development & Build

### Prerequisites
- Node.js 18+
- npm or bun

### Getting Started
```bash
# Clone the repository
git clone https://github.com/<your-username>/family-medicine-tracker.git

# Navigate into project directory
cd family-medicine-tracker

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🌐 Publishing to GitHub

To push this project to a new repository on your GitHub account:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Stage all files
git add .

# 3. Create initial commit
git commit -m "feat: complete family medicine tracker with Google Sheets and WhatsApp alerts"

# 4. Create a new repository on github.com (named e.g. 'family-medicine-tracker')

# 5. Link and push to your remote repository
git remote add origin https://github.com/Deepansri94/Medicine-Tracker.git
git branch -M main
git push -u origin main
```

Or using the GitHub CLI:
```bash
gh repo create family-medicine-tracker --public --source=. --remote=origin --push
```

---

## 📄 Standalone Single-File Version

If you want a portable version that runs without Node.js or any build tools, open [`standalone/index.html`](./standalone/index.html) directly in any web browser! You can also host it for free on **GitHub Pages**, **Netlify Drop**, or **Vercel**.

---

## 🔒 Privacy & Security

- Medication data is stored strictly in your private Google Sheet account.
- The Google Apps Script executes under your own Google account credentials.
- No third-party data tracking, telemetry, or analytics.

---

## ⚖️ License
Apache-2.0 License.
