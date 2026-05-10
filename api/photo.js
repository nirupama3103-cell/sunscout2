export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const { ref } = req.query;
  if (!ref || !key) return res.status(400).end();

  // New Places API photo format
  const url = `https://places.googleapis.com/v1/${ref}/media?maxHeightPx=600&maxWidthPx=800&skipHttpRedirect=true&key=${key}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(502).end();
    const data = await r.json();
    const photoUri = data.photoUri;
    if (!photoUri) return res.status(404).end();
    // Fetch the actual image
    const img = await fetch(photoUri);
    if (!img.ok) return res.status(502).end();
    const buf = await img.arrayBuffer();
    res.setHeader("Content-Type", img.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buf));
  } catch(e) {
    res.status(500).end();
  }
}
