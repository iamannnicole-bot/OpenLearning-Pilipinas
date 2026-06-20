// /api/get-takeaways.js
// Reads existing takeaway-wall entries back from Vercel Blob (where
// submit-takeaway.js saves each one as a small JSON file), so the wall
// repopulates on page load instead of starting empty.
//
// This replaced an earlier version that read from a published Google
// Sheets CSV -- that approach was blocked by an organization policy that
// requires Google sign-in even for "Publish to web" links, which Vercel's
// server can never provide. Blob has no such restriction.

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobs } = await list({ prefix: 'takeaways/' });

    const sorted = blobs.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

    const takeaways = await Promise.all(
      sorted.map(async (b) => {
        try {
          const r = await fetch(b.url);
          const data = await r.json();
          return { name: data.name || 'Guest', takeaway: data.takeaway || '' };
        } catch (e) {
          return null;
        }
      })
    );

    return res.status(200).json({ takeaways: takeaways.filter(Boolean) });
  } catch (err) {
    console.error('get-takeaways error:', err);
    return res.status(200).json({ takeaways: [] });
  }
}