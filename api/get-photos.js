// /api/get-photos.js
// Lists all photos already uploaded to the "gallery/" folder in Vercel Blob,
// so the page can repopulate the gallery on load instead of starting empty.

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobs } = await list({ prefix: 'gallery/' });

    // Oldest first, so re-inserting them on load reproduces the same
    // left-to-right order they were originally added in.
    const sorted = blobs
      .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
      .map((b) => ({ url: b.url, uploadedAt: b.uploadedAt }));

    return res.status(200).json({ photos: sorted });
  } catch (err) {
    console.error('get-photos error:', err);
    return res.status(500).json({ error: 'Failed to list photos' });
  }
}