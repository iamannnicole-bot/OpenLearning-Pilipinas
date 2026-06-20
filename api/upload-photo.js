// /api/upload-photo.js
// Receives a raw image file from the gallery "Add your photo" button,
// uploads it to Vercel Blob storage (so every visitor sees the same shared
// gallery, not just the uploader's own browser), then logs the resulting
// URL to the "Photo Album Log" tab via the Apps Script Web App.

import { put } from '@vercel/blob';

// We need the raw file bytes, not Vercel's default JSON body parser.
export const config = {
  api: {
    bodyParser: false,
  },
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
      // BLOB_READ_WRITE_TOKEN is added automatically by Vercel once you
      // create the Blob store in the Storage tab — no need to set it yourself.
    });

    // Best-effort log to the spreadsheet; don't fail the upload if this fails
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (appsScriptUrl) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'photo',
            url: blob.url,
            uploadedBy: '',
            caption: 'Shared photo',
            platform: 'Gallery',
          }),
        });
      } catch (logErr) {
        console.error('Photo log to sheet failed (upload still succeeded):', logErr);
      }
    }

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('upload-photo error:', err);
    return res.status(500).json({ error: 'Failed to upload photo' });
  }
}