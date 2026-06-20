// /api/submit-takeaway.js
// Receives a "One skill I'm taking home..." wall entry and forwards it to the
// Google Apps Script Web App, which appends a row to the
// "One Skill Takeaways" tab of the event tracker spreadsheet.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, takeaway } = req.body || {};

    if (!takeaway || !String(takeaway).trim()) {
      return res.status(400).json({ error: 'Missing takeaway text' });
    }

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      console.error('APPS_SCRIPT_URL env var is not set');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const upstream = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'takeaway',
        name: (name || 'Guest').trim(),
        takeaway: String(takeaway).trim(),
      }),
    });

    const result = await upstream.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error('submit-takeaway error:', err);
    return res.status(500).json({ error: 'Failed to submit takeaway' });
  }
}