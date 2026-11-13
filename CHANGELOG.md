# Vairavan Kovil App - Development Activity and Changelog

This document maintains a permanent, detailed record of all features, bug fixes, UI enhancements, database schema updates, and system activity logging implemented in the Vairavan Kovil application.

---

## November 12, 2026 (Today)

### 1. WhatsApp Reminder Automation and Daily Background Scheduler
- **Feature**: Created automated daily multi-lingual WhatsApp reminder dispatcher.
- **Backend Service**: `backend/src/services/whatsappAutomationService.js`
  - Runs in background using Indian Standard Time (IST, UTC+5:30).
  - Configurable dispatch time: triggers daily at **06:00 AM IST** (customizable).
  - **Tamil Reminder Schedule**: Dispatches template message **5 days before** pooja date ($D - 5$).
  - **English Reminder Schedule**: Dispatches template message **2 days before** pooja date ($D - 2$).
  - **Zero Duplicate Guard**: Checks `yearly_booking_records` (`wa_status_ta` / `wa_status_en`) to guarantee no devotee receives duplicate messages for the same pooja year.
  - Initialized on server boot in `backend/src/server.js`.
- **System Activity Logging**:
  - Automatically records dispatched batches in `whatsapp_send_history` (`id, lang, target_date, total, sent, failed, triggered_by, error_details`).
  - Records an audit log in `history_logs` (`action = 'Automated WhatsApp Dispatch'`).
- **Endpoints Added**:
  - `POST /api/whatsapp/trigger-automation`: On-demand dry-run / manual trigger for administrators.

### 2. WhatsApp Dashboard Devotee Selection Checkboxes
- **Files Modified**: `frontend/src/pages/WhatsAppDashboard.jsx`, `backend/src/controllers/whatsappController.js`
- **UI Changes**:
  - Added a **Master "Select All / Deselect All"** checkbox in the table header.
  - Added individual row **checkboxes** as the first column for each devotee (desktop table and mobile cards).
  - Default state: **All loaded devotees are selected by default**.
  - Dynamic Action Buttons: "Send English" and "Send Tamil" show selected count (e.g. `Send English (2)`) and only dispatch to selected devotees.
- **Backend**:
  - `whatsappController.sendBatch` accepts `selectedBookingIds` array to filter devotees before dispatching.

### 3. WhatsApp Automation Settings UI (`/settings`)
- **File Modified**: `frontend/src/pages/Settings.jsx`
- **UI Design**: Clean, minimal card matching the Fee Configuration design (no emojis, no unwanted subtitles or boxes):
  - **Automation Status**: ON / OFF toggle switch (`Enabled` / `Disabled`).
  - **Dispatch Time (IST)**: Custom typed 12-hour picker `[ 06 ] : [ 00 ]` with **`AM` / `PM`** toggle buttons. Designed to fit inside the card with zero horizontal overflow and no native 60-number popup menus.
  - **Tamil Schedule**: Number input for days ahead (default: 5).
  - **English Schedule**: Number input for days ahead (default: 2).
  - **Save Button**: Clean right-aligned `Save Automation Settings` button.
- **Database Persistence**:
  - Handled via `backend/src/controllers/settingsController.js`:
    - `whatsapp_automation_enabled` (`true`/`false`)
    - `whatsapp_dispatch_time` (`06:00`)
    - `whatsapp_tamil_lead_days` (`5`)
    - `whatsapp_english_lead_days` (`2`)

### 4. Fee Configuration Cards Cleanup (`/settings`)
- **File Modified**: `frontend/src/pages/Settings.jsx`
- Removed the 3 lower calculation preview boxes:
  - Removed Card 1 calculation summary badge (`Booked > 6 Mos Ahead: Rs. 3,500 / Booked Within 6 Mos: Rs. 3,700`).
  - Removed Card 2 live transfer calculation preview box (`1-Time Transfer Calculation (Sample)`).
  - Removed Card 3 info box (`Walk-in Daily Pooja Charge`).
- Retained all input fields, labels, and save functionality intact.

### 5. Thuritha Kattalai UI Refinement
- **Files Modified**: `frontend/src/components/ThurithaKattalaiModal.jsx`, `frontend/src/pages/ThurithaKattalaiRegister.jsx`
- Matched design to Uchikala & Arthajama modal (warm cream background, pill inputs, Star dropdown loaded from database via `api.getDropdownOptions()`).
- Removed unnecessary slot text and fee breakdown badge.

### 6. Devotee Registration Link Refinement
- **Files Modified**: `frontend/src/pages/Login.jsx`, `frontend/src/pages/Signup.jsx`, `frontend/src/pages/Settings.jsx`
- Replaced informal label **"Walk-in Devotee?"** with respectful **"Visiting Devotee?"**.
- Removed fixed price tag **`(Rs. 200)`** from the link, displaying clean link: **"Thuritha Kattalai Registration"**.
- Added corresponding visiting devotee link to `Signup.jsx` (Kattalaithaarar Registration page) for seamless navigation.
- Updated System Settings label from `Walk-in Archanai Fee` to `Thuritha Archanai Fee (Rs.)`.

### 7. Signup Page UI Alignment (Matching Image 2 Reference)
- **File Modified**: `frontend/src/pages/Signup.jsx`
- Replaced button text: changed from **"Pay"** to **"Register Nithiya Kattalai"**.
- Removed **"Visiting Devotee? Thuritha Kattalai Registration"** link from this page as instructed.
- Centered the single bottom link: **"Already registered as a devotee? Sign In here"**.
- Removed the fee calculation subtitle badge (`Within 6 months: Rs. 3,700...`).
- Compacted vertical padding and input dimensions to guarantee a clean, fixed laptop viewport height with zero scrolling.

### 8. System Settings UTF-8 Encoding Restoration
- **File Modified**: `frontend/src/pages/Settings.jsx`
- Restored original Tamil script text in Manage Dropdown Options:
  - **`தமிழ் Options`**
  - **`தலைப்புகள் (Titles)`**
  - **`நட்சத்திரங்கள் (Stars)`**
  - **`ஊர்கள் (Places)`**
  - Placeholder: **`புதிய விருப்பத்தை சேர்க்கவும்...`**
- Restored authentic Indian Rupee symbol **`₹`** in all Fee Configuration cards and input fields (`₹3500`, `₹200`).

### 9. Workspace-Wide UTF-8 Encoding Audit
- **Files Audited & Fixed**: `frontend/src/pages/Signup.jsx`, `END_TO_END_SYSTEM_MANUAL.md`
- Conducted an automated forensic scan across all source files in both project workspaces.
- Restored Tamil script and Rupee symbols in `Signup.jsx` (`உச்சிக்கால கட்டளை`, `அர்த்தஜாம கட்டளை`, `₹`) and `END_TO_END_SYSTEM_MANUAL.md` (`திரு`, `அனுஷம்`, `காரைக்குடி`, `உச்சிக்காலம்`, `அ`).
- Zero UI or business logic modifications made. Complete scan confirms **0 encoding anomalies** remaining.

---

## November 11, 2026 (Yesterday)

### 1. Thani Archanai / Thuritha Kattalai (Walk-in Daily Pooja)
- **Database Schema**:
  - Created table `thuritha_kattalais`:
    - `id` (UUID PRIMARY KEY)
    - `name` (VARCHAR)
    - `place` (VARCHAR)
    - `mobile` (VARCHAR)
    - `email` (VARCHAR)
    - `star` (VARCHAR)
    - `attendance_status` (VARCHAR: 'present' / 'absent', default 'absent')
    - `amount` (DECIMAL, default 200.00)
    - `created_at` (TIMESTAMP)
- **Backend**:
  - Created `backend/src/controllers/thurithaKattalaiController.js` and routes for devotee registration, listing, and attendance updates.
- **Frontend**:
  - Created dedicated registration page (`/thuritha-kattalai`).
  - Added link to navigation and sign-in view.
  - Added walk-in attendance tab for **Ulthurai** staff in the Dashboard to mark devotees Present/Absent.

### 2. 1-Time Account Transfer Mathematical Formula
- **Backend and Logic**:
  - Implemented exact calculation rule: `(Current Endowment Rate - Prior Historical Deposit) + Extra Transfer Fee`.
  - Stored `transfer_extra_fee` in `system_settings` table (default Rs. 200).
  - Validated formula: Rs. 3,500 - Rs. 1,200 + Rs. 200 = **Rs. 2,500** payable.
  - Removed breakdown card from Account Transfer modal UI as instructed.

### 3. Devotee Edit and Unlock Flow (No Payment)
- **Files Modified**: `frontend/src/components/BookingModal.jsx`, `backend/src/controllers/bookingsController.js`
- Removed paid difference unlock modal.
- Replaced with administrative change request flow:
  - Devotee clicks "Request Change" to submit pending edit request.
  - Temple Admin approves request to unlock booking for editing.
- **Audit Logging**:
  - Every update logs before-and-after field diffs into `history_logs` under `action = 'Updated Devotee'`.

---

## Testing and Verification
- `backend/test_pro_senior_qa.js`: **43 PASSED | 0 FAILED** (Covering registration, signup, authentication, isolation, account transfer, date boundary mathematics, and concurrency).
- `backend/test_whatsapp_automation_qa.js`: **ALL PASSED** (Covering 12h/24h time conversions, AM/PM boundaries, IST offsets, row selection filtering, and settings validation).
- Production build: `npm run build` passed with zero errors.
- Deployment package: [public_html.zip](file:///c:/Users/marlin/OneDrive/Desktop/workss/vairavan_koil_app/frontend/public_html.zip) updated and verified.
