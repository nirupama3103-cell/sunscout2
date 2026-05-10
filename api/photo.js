export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const { ref } = req.query;
  if (!ref || !key) return res.status(400).end();
  try {
    const url = `https://places.googleapis.com/v1/${ref}/media?maxHeightPx=600&maxWidthPx=800&key=${key}`;
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) return res.status(502).end();
    const buf = await r.arrayBuffer();
    res.setHeader("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    res.send(Buffer.from(buf));
  } catch(e) {
    console.error("photo proxy error:", e.message);
    res.status(500).end();
  }
}
