export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE || !AIRTABLE_TABLE) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const body = req.body;

    // Extract photo URLs from team members and format as Airtable attachments
    // The form sends teamPhotos as an array of { url, filename } objects
    const fields = { ...body };

    if (Array.isArray(body.teamPhotos) && body.teamPhotos.length > 0) {
      fields['Team Photos'] = body.teamPhotos.map(p => ({
        url: p.url,
        filename: p.filename || 'photo.jpg',
      }));
    }
    delete fields.teamPhotos;

    if (Array.isArray(body.clinicLogo) && body.clinicLogo.length > 0) {
      fields['Clinic Logo'] = body.clinicLogo.map(p => ({
        url: p.url,
        filename: p.filename || 'logo.jpg',
      }));
    }
    delete fields.clinicLogo;

    // Split clinicMedia by resource_type into two attachment fields
    if (Array.isArray(body.clinicMedia) && body.clinicMedia.length > 0) {
      const photos = body.clinicMedia
        .filter(m => m.resource_type === 'image')
        .map(m => ({ url: m.url, filename: m.filename || 'photo.jpg' }));
      const videos = body.clinicMedia
        .filter(m => m.resource_type === 'video')
        .map(m => ({ url: m.url, filename: m.filename || 'video.mp4' }));
      if (photos.length) fields['Clinic Photos'] = photos;
      if (videos.length) fields['Clinic Videos'] = videos;
    }
    delete fields.clinicMedia;

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      return res.status(airtableRes.status).json({ error: data });
    }

    return res.status(200).json({ id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
