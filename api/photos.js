export default async function handler(req, res) {
  const query = req.query.query || "kids activities";
  const r = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`, {
    headers: { Authorization: process.env.PEXELS_API_KEY }
  });
  const data = await r.json();
  res.json(data);
}
