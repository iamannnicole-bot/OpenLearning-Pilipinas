/**
 * OpenLearning Pilipinas 2026 — Event Data Tracker
 * Google Apps Script Web App (Code.gs)
 *
 * SETUP:
 * 1. Open your "OpenLearning Pilipinas 2026 - Event Data Tracker" Google Sheet.
 * 2. Extensions → Apps Script.
 * 3. Delete any starter code and paste this file in.
 * 4. Replace SHEET_ID below with your spreadsheet's ID (the long string in
 *    its URL between /d/ and /edit).
 * 5. Click Deploy → New deployment → type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 6. Copy the deployment URL (ends in /exec) — this is your APPS_SCRIPT_URL
 *    env var on Vercel.
 * 7. Re-deploy (Deploy → Manage deployments → Edit → New version) any time
 *    you change this script — the URL stays the same once deployed.
 */

const SHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';

const SHEETS = {
  lead: 'Your Next Step Form',
  takeaway: 'One Skill Takeaways',
  photo: 'Photo Album Log',
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const now = new Date();

    let sheetName, row;

    switch (data.type) {
      case 'lead':
        sheetName = SHEETS.lead;
        row = [
          now,
          data.name || '',
          data.email || '',
          data.mobile || '',
          data.title || '',
          data.org || '',
          data.orgType || '',
          data.learners || '',
          data.lms || '',
          data.timeline || '',
          data.intent || '',
          data.goals || '',
          'New',   // Follow-up Status
          '',      // Owner
        ];
        break;

      case 'takeaway':
        sheetName = SHEETS.takeaway;
        row = [now, data.name || 'Guest', data.takeaway || ''];
        break;

      case 'photo':
        sheetName = SHEETS.photo;
        row = [now, data.uploadedBy || '', data.url || '', data.caption || '', data.platform || ''];
        break;

      default:
        return jsonOutput({ status: 'error', message: 'Unknown submission type: ' + data.type });
    }

    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return jsonOutput({ status: 'error', message: 'Sheet tab not found: ' + sheetName });
    }

    sheet.appendRow(row);
    return jsonOutput({ status: 'ok' });
  } catch (err) {
    return jsonOutput({ status: 'error', message: err.message });
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}