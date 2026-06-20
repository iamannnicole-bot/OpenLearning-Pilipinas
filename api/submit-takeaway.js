// /api/submit-takeaway.js
// Receives a "One skill I'm taking home..." wall entry and forwards it to a
// Google Form's public submission endpoint (invisible to the visitor),
// which writes a row directly into the linked Google Sheet.

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

    const params = new URLSearchParams();
    params.append(ENTRY_MAP.name, (name || 'Guest').trim());
    params.append(ENTRY_MAP.takeaway, String(takeaway).trim());

    const upstream = await fetch(FORM_ACTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!upstream.ok && upstream.status !== 0) {
      console.error('Form submission returned status:', upstream.status);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('submit-takeaway error:', err);
    return res.status(500).json({ error: 'Failed to submit takeaway' });
  }
}