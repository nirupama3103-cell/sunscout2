export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://sunscout2.vercel.app");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { query } = req.query;
  if (!query || query.length > 100) return res.status(400).json({ error: "Invalid query" });
  const key = process.env.PEXELS_API_KEY;
  if (!key) return res.status(500).json({ error: "No API key" });
  try {
    const r = await fetch(
      "https://api.pexels.com/v1/search?query=" + encodeURIComponent(query) + "&per_page=1&orientation=landscape",
      { headers: { Authorization: key } }
    );
    if (!r.ok) return res.status(502).json({ error: "Pexels error" });
    const d = await r.json();
    const url = d.photos?.[0]?.src?.large || null;
    res.setHeader("Cache-Control", "s-maxage=86400");
    return res.status(200).json({ url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
