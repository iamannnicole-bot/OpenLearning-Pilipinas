// /api/submit-takeaway.js
// Receives a "One skill I'm taking home..." wall entry. Saves it two places:
// 1. Vercel Blob (as a small JSON file) -- this is what get-takeaways.js reads
//    back on page load, since it's reliable and has no Google auth issues.
// 2. The Google Form's submission endpoint -- purely for your own reporting
//    record in the Sheet; not used to repopulate the live wall.

import { put } from '@vercel/blob';

const FORM_ACTION_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf39A1IK39imvnU6IePo4dw0Lakx-g0W_z3EfUSDMujP_fE2A/formResponse';

const ENTRY_MAP = {
  name: 'entry.2138199957',
  takeaway: 'entry.408517643',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, takeaway } = req.body || {};

    if (!takeaway || !String(takeaway).trim()) {
      return res.status(400).json({ error: 'Missing takeaway text' });
    }

    const cleanName = (name || 'Guest').trim();
    const cleanTakeaway = String(takeaway).trim();

    // 1. Save to Blob so it can be read back on page load
    try {
      const payload = JSON.stringify({ name: cleanName, takeaway: cleanTakeaway });
      const filename = `takeaways/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
      await put(filename, payload, {
        access: 'public',
        contentType: 'application/json',
      });
    } catch (blobErr) {
      console.error('Saving takeaway to Blob failed:', blobErr);
      // continue -- still try the Form log below
    }

    // 2. Best-effort log to the Form/Sheet for reporting purposes
    try {
      const params = new URLSearchParams();
      params.append(ENTRY_MAP.name, cleanName);
      params.append(ENTRY_MAP.takeaway, cleanTakeaway);

      await fetch(FORM_ACTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } catch (formErr) {
      console.error('Logging takeaway to Form failed (Blob save still succeeded):', formErr);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('submit-takeaway error:', err);
    return res.status(500).json({ error: 'Failed to submit takeaway' });
  }
}