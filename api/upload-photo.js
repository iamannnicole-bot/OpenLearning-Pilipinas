// /api/upload-photo.js

import { put } from '@vercel/blob';

// We need the raw file bytes, not Vercel's default JSON body parser.
export const config = {
  api: {
    bodyParser: false,
  },
};

const FORM_ACTION_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScC8uaYhHB5m7wIggoA4Va6qUMoaNcRVUdUMS3FwHCkMaKR-g/formResponse';

const ENTRY_MAP = {
  uploadedBy: 'entry.1842092294',
  url: 'entry.1970281814',
  caption: 'entry.1784723861',
  platform: 'entry.405985498',
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const fileBuffer = await readRawBody(req);
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No file received' });
    }

    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const rawName = req.headers['x-filename']
      ? decodeURIComponent(req.headers['x-filename'])
      : `photo-${Date.now()}.jpg`;

    // Prefix with a timestamp so simultaneous uploads at the event never collide
    const filename = `gallery/${Date.now()}-${rawName}`;

    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType,
    });

    // Best-effort log to the Google Form; don't fail the upload if this fails
    try {
      const params = new URLSearchParams();
      params.append(ENTRY_MAP.uploadedBy, '');
      params.append(ENTRY_MAP.url, blob.url);
      params.append(ENTRY_MAP.caption, 'Shared photo');
      params.append(ENTRY_MAP.platform, 'Gallery');

      await fetch(FORM_ACTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } catch (logErr) {
      console.error('Photo log to Form failed (upload still succeeded):', logErr);
    }

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('upload-photo error:', err);
    return res.status(500).json({ error: 'Failed to upload photo' });
  }
}