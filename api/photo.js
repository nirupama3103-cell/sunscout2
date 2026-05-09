export default async function handler(req, res) {
  const { ref } = req.query;
  if (!ref) return res.status(400).end();
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${key}`;
  const r = await fetch(url);
  if (!r.ok) return res.status(502).end();
  const buf = await r.arrayBuffer();
  res.setHeader("Content-Type", r.headers.get("content-type") || "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(Buffer.from(buf));
}
