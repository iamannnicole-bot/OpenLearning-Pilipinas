// /api/get-takeaways.js

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