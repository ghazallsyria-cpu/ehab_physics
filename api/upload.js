import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileBase64, filename, owner_id } = req.body;

    if (!fileBase64 || !filename || !owner_id) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // تحويل Base64 إلى Uint8Array بدل Buffer
    const bytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

    const path = `uploads/${Date.now()}_${filename}`;

    const { data, error } = await supabase
      .storage
      .from('assets')
      .upload(path, bytes, {
        contentType: 'application/octet-stream',
        metadata: { owner_id }
      });

    if (error) return res.status(500).json({ error: error.message });

    const { publicURL } = supabase
      .storage
      .from('assets')
      .getPublicUrl(path);

    return res.status(200).json({ path, publicURL });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
