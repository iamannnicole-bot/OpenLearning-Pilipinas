// /api/get-photos.js

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobs } = await list({ prefix: 'gallery/' });

    const sorted = blobs
      .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
      .map((b) => ({ url: b.url, uploadedAt: b.uploadedAt }));

    return res.status(200).json({ photos: sorted });
  } catch (err) {
    console.error('get-photos error:', err);
    return res.status(500).json({ error: 'Failed to list photos' });
  }
}