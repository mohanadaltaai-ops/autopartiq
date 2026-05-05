import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTEXTS = ['request', 'offer', 'profile'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function extensionFromMimeType(fileType) {
  if (fileType === 'image/png') return 'png';
  if (fileType === 'image/webp') return 'webp';
  if (fileType === 'image/gif') return 'gif';
  return 'jpg';
}

function decodeBase64Image(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return { fileType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

function safeName(value) {
  return String(value || 'upload').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

export async function createUploadPlaceholder(req, res) {
  const { fileName, fileType, context } = req.body;

  res.status(501).json({
    message: 'Upload provider is not connected yet',
    providerStatus: 'PENDING_CONFIGURATION',
    recommendedProvider: 'Supabase Storage',
    received: { fileName, fileType, context },
    nextStep: 'Connect Supabase Storage, Cloudinary, or S3 and return a stored file URL.'
  });
}

export async function uploadImage(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ message: 'Supabase Storage is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'autopartiq-uploads';
  const context = ALLOWED_CONTEXTS.includes(req.body.context) ? req.body.context : 'general';
  const decoded = decodeBase64Image(req.body.fileData);
  if (!decoded) return res.status(400).json({ message: 'Valid image file data is required' });
  if (!ALLOWED_TYPES.includes(decoded.fileType)) return res.status(400).json({ message: 'Only JPG, PNG, WEBP, and GIF images are allowed' });
  if (decoded.buffer.length > MAX_FILE_SIZE_BYTES) return res.status(400).json({ message: 'Image must be 5MB or smaller' });

  const ext = extensionFromMimeType(decoded.fileType);
  const originalName = safeName(req.body.fileName || `image.${ext}`);
  const path = `${context}/${req.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${originalName}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, decoded.buffer, {
    contentType: decoded.fileType,
    upsert: false
  });

  if (error) return res.status(500).json({ message: error.message || 'Image upload failed' });

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  res.status(201).json({ url: data.publicUrl, path, bucket });
}
