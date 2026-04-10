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
    delete fields.teamPhotos; // remove raw array before sending

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
