import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, err } from '../_shared/db.ts';
import { requireAuth } from '../_shared/auth.ts';

const BUCKET = 'fixaway-media';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return err('Method not allowed', 405);

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return err('Expected multipart/form-data', 400);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return err('Failed to parse form data', 400);
  }

  const file = (formData.get('media') ?? formData.get('file')) as File | null;
  if (!file) return err('No file provided', 400);

  const allowedTypes = /^(image\/|audio\/|video\/)/;
  if (!allowedTypes.test(file.type)) {
    return err('File type not allowed. Only image, audio, and video files are accepted.', 400);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const folder = file.type.startsWith('video/')
    ? 'videos'
    : file.type.startsWith('audio/')
    ? 'audio'
    : 'images';

  const filename = `${folder}/${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadErr } = await adminDb.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    console.error('[Upload Error]', uploadErr);
    return err(`Upload failed: ${uploadErr.message}`, 500);
  }

  const { data: urlData } = adminDb.storage.from(BUCKET).getPublicUrl(filename);

  return ok({ url: urlData.publicUrl }, 'File uploaded successfully');
});
