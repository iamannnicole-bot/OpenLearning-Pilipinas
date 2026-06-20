// /api/get-takeaways.js
// Reads existing takeaway-wall entries back from the Google Sheet via a
// published, read-only CSV export of that tab, so the wall repopulates
// on page load instead of starting empty.
//
// SETUP REQUIRED (one-time, in Google Sheets):
// 1. Open the tab that receives Takeaway Form responses (likely named
//    something like "Form Responses 2" -- whichever tab has columns
//    Timestamp / First Name / Takeaway).
// 2. File -> Share -> Publish to web.
// 3. In the dialog: choose that specific SHEET/TAB from the first dropdown
//    (not "Entire Document"), choose "Comma-separated values (.csv)" from
//    the second dropdown, click Publish.
// 4. Copy the resulting URL (looks like:
//    https://docs.google.com/spreadsheets/d/e/SOME_ID/pub?gid=123&single=true&output=csv)
// 5. Set it as the TAKEAWAYS_CSV_URL environment variable on Vercel.

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cells.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const csvUrl = process.env.TAKEAWAYS_CSV_URL;
    if (!csvUrl) {
      console.error('TAKEAWAYS_CSV_URL env var is not set');
      return res.status(200).json({ takeaways: [] }); // fail soft, wall just stays empty
    }

    const upstream = await fetch(csvUrl);
    const text = await upstream.text();
    const lines = text.split('\n').filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      return res.status(200).json({ takeaways: [] });
    }

    // Expect columns: Timestamp, First Name, Takeaway (in that order)
    const rows = lines.slice(1).map(parseCsvLine);
    const takeaways = rows
      .map((cols) => ({
        timestamp: cols[0] || '',
        name: (cols[1] || 'Guest').trim(),
        takeaway: (cols[2] || '').trim(),
      }))
      .filter((t) => t.takeaway.length > 0);

    return res.status(200).json({ takeaways });
  } catch (err) {
    console.error('get-takeaways error:', err);
    return res.status(200).json({ takeaways: [] }); // fail soft
  }
}