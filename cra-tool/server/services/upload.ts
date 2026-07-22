import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Case-attachment upload config. Files (PDFs + screenshots) are written to
// server/uploads/ with a random name; the original name and metadata are
// stored on the ticket. Kept intentionally simple (local disk) — for a cloud
// deployment with an ephemeral filesystem this would move to S3/GridFS.

export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

export const uploadAttachments = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },   // 10 MB each, up to 10 files
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and image files (PNG, JPG, GIF, WebP) are allowed'));
  },
}).array('files', 10);
