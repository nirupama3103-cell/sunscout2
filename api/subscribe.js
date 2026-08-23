/**
 * Email subscribe endpoint.
 *
 * Option B of the three we discussed: the form posts here, and this function
 * talks to the list provider using a key held in a Vercel environment
 * variable. The key never reaches the browser, no third-party script runs on
 * the page, and nothing about the visitor is sent anywhere except the address
 * they typed - which is what the privacy policy promises.
 *
 * Required environment variables (Vercel > Settings > Environment Variables):
 *   BUTTONDOWN_API_KEY   the key from buttondown.com/settings/api
 *
 * Swapping provider means changing PROVIDER_URL and the request body only;
 * everything around it stays.
 */

const PROVIDER_URL = "https://api.buttondown.email/v1/subscribers";

// crude per-instance throttle. Serverless instances are short-lived, so this
// blunts bursts rather than replacing a real rate limiter.
const seen = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  const now = Date.now();
  const hits = (seen.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  seen.set(ip, hits);
  if (seen.size > 500) seen.clear();     // bound the map
  return hits.length > MAX_PER_WINDOW;
}

// Deliberately permissive. Rejecting odd-but-valid addresses annoys real
// people; the provider does the authoritative check and sends the opt-in.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Use POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = String((body && body.email) || "").trim().toLowerCase();
  const trap  = String((body && body.website) || "");

  // honeypot: a hidden field no person fills in
  if (trap) return res.status(200).json({ ok: true });

  if (!EMAIL.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, error: "That email address does not look right." });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Too many tries. Give it a minute." });
  }

  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) {
    console.error("BUTTONDOWN_API_KEY is not set");
    return res.status(503).json({ ok: false, error: "Sign-up is not switched on yet." });
  }

  try {
    const r = await fetch(PROVIDER_URL, {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email, tags: ["sunscout-web"] }),
    });

    if (r.ok) return res.status(200).json({ ok: true });

    // already subscribed is a success from the visitor's point of view
    const text = await r.text();
    if (r.status === 400 && /already/i.test(text)) {
      return res.status(200).json({ ok: true, already: true });
    }
    console.error("provider error", r.status, text.slice(0, 300));
    return res.status(502).json({ ok: false, error: "We could not sign you up just now." });
  } catch (e) {
    console.error("subscribe failed", e);
    return res.status(502).json({ ok: false, error: "We could not sign you up just now." });
  }
}
