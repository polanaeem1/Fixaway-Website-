import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const BUCKET = 'fixaway-media';

export const uploadMedia = async (req: Request, res: Response) => {
  if (!req.file) {
    return sendError(res, 'No file provided', 400);
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${uuidv4()}${ext}`;
  const folder = req.file.mimetype.startsWith('video/') ? 'videos' : 'images';
  const storagePath = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error('[Upload Error]', error);
    return sendError(res, `Upload failed: ${error.message}`, 500);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return sendSuccess(res, { url: publicUrlData.publicUrl }, 'File uploaded successfully');
};
