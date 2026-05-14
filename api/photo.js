export default async function handler(req, res) {
  const { ref, streetview } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // --- Street View fallback ---
  if (streetview) {
    const svUrl = "https://maps.googleapis.com/maps/api/streetview?" + new URLSearchParams({
      size: "600x400",
      location: streetview,
      key: apiKey,
      return_error_code: "true"
    });
    const svRes = await fetch(svUrl);
    if (!svRes.ok) return res.status(404).end();
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return svRes.body.pipeTo
      ? svRes.body.pipeTo(res)
      : (await svRes.arrayBuffer().then(b => res.end(Buffer.from(b))));
  }

  // --- Google Places photo ---
  if (!ref) return res.status(400).end();
  const photoUrl = "https://places.googleapis.com/v1/" + ref + "/media?maxHeightPx=600&maxWidthPx=800&skipHttpRedirect=true";
  const photoRes = await fetch(photoUrl, {
    headers: {
      "X-Goog-Api-Key": apiKey,
    }
  });
  if (!photoRes.ok) return res.status(404).end();
  const data = await photoRes.json();
  const imageUri = data.photoUri;
  if (!imageUri) return res.status(404).end();

  // Fetch the actual image and proxy it
  const imgRes = await fetch(imageUri);
  if (!imgRes.ok) return res.status(404).end();
  res.setHeader("Content-Type", imgRes.headers.get("content-type") || "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  const buf = await imgRes.arrayBuffer();
  return res.end(Buffer.from(buf));
}
