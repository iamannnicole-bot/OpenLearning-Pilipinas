// /api/submit-lead.js
// Receives the "Your Next Step" qualifier form and forwards it to the
// Google Apps Script Web App, which appends a row to the
// "Your Next Step Form" tab of the event tracker spreadsheet.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    const required = ['name', 'email', 'mobile', 'title', 'org', 'orgType', 'learners', 'intent', 'goals'];
    for (const key of required) {
      if (!data[key]) {
        return res.status(400).json({ error: `Missing required field: ${key}` });
      }
    }

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      console.error('APPS_SCRIPT_URL env var is not set');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const upstream = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'lead', ...data }),
    });

    const result = await upstream.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error('submit-lead error:', err);
    return res.status(500).json({ error: 'Failed to submit lead' });
  }
}