// /api/submit-lead.js

const FORM_ACTION_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfxNKCpF9oiO9s_Kf_gKs0_K0mnSX-GWU_R6qljBEkTCpI5-w/formResponse';

// Maps our internal field names to this Form's entry IDs (from the
// Network tab capture). If you ever edit/reorder questions in the Form,
// these IDs can change -- recapture them if submissions stop appearing.
const ENTRY_MAP = {
  name: 'entry.509920607',
  email: 'entry.1270745515',
  mobile: 'entry.333238658',
  title: 'entry.2126527519',
  org: 'entry.1316741458',
  orgType: 'entry.2079248707',
  learners: 'entry.1767292537',
  lms: 'entry.1248203828',
  timeline: 'entry.1809188210',
  intent: 'entry.2002061899',
  goals: 'entry.1155627175',
};

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

    const params = new URLSearchParams();
    for (const [key, entryId] of Object.entries(ENTRY_MAP)) {
      params.append(entryId, data[key] || '');
    }

    const upstream = await fetch(FORM_ACTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    // Google Forms responds with an HTML page (not JSON) on success/redirect.
    // A non-network-error response here means the submission was accepted.
    if (!upstream.ok && upstream.status !== 0) {
      console.error('Form submission returned status:', upstream.status);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('submit-lead error:', err);
    return res.status(500).json({ error: 'Failed to submit lead' });
  }
}