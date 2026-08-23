/**
 * Email subscribe endpoint.
 *
 * The form posts here, and this function talks to the list provider using a
 * key held in a Vercel environment variable. The key never reaches the
 * browser, no third-party script runs on the page, and nothing about the
 * visitor is sent anywhere except the address they typed - which is what the
 * privacy policy promises.
 *
 * Provider is Brevo. Buttondown was the first choice and had to go: its API
 * is gated to the $29/mo Standard plan, so on the free plan a valid-looking
 * key answers 403 to every call. Brevo's contacts API is open on the free
 * tier (100k contacts stored, 300 sends/day), which is what this needs.
 *
 * Environment variables (Vercel > Settings > Environment Variables):
 *   BREVO_API_KEY   required. From Brevo > SMTP & API > API keys.
 *   BREVO_LIST_ID   optional. The numeric list id, visible in the URL when
 *                   you open the list. Without it contacts are still created,
 *                   they just are not filed into a list.
 */

const PROVIDER_URL = "https://api.brevo.com/v3/contacts";

// Vercel env names are case-sensitive and this one has been typed both ways.
// Accept either rather than fail silently on a capital letter.
function providerKey() {
  const raw = process.env.BREVO_API_KEY || process.env.Brevo_API_KEY || "";
  return raw.trim();
}

function listIds() {
  const raw = (process.env.BREVO_LIST_ID || "").trim();
  const n = Number(raw);
  return raw && Number.isFinite(n) ? [n] : null;
}

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
// people; the provider does the authoritative check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Marker so a self-test can prove which build is actually serving. Bump it
// whenever this file changes in a way you need to confirm reached production.
const BUILD = "2026-08-23-brevo";

/**
 * GET /api/subscribe?selftest=1
 *
 * Diagnostic only. Says which build is live, whether the key is readable and
 * roughly what shape it is, and what the provider answers to an authenticated
 * read. Never returns the key itself - only its length and last four
 * characters, which is enough to spot a truncated or quote-wrapped paste.
 */
async function selftest(res) {
  const key = providerKey();
  const out = {
    build: BUILD,
    provider: "brevo",
    providerUrl: PROVIDER_URL,
    keyPresent: Boolean(key),
    keyEnvName: process.env.BREVO_API_KEY ? "BREVO_API_KEY"
              : process.env.Brevo_API_KEY ? "Brevo_API_KEY" : null,
    keyLength: key.length,
    keyTail: key ? key.slice(-4) : null,
    keyLooksQuoted: /^["']|["']$/.test(key),
    listIds: listIds(),
  };

  if (!key) return res.status(200).json(out);

  try {
    // cheapest authenticated call: read one contact
    const r = await fetch(PROVIDER_URL + "?limit=1", {
      headers: { "api-key": key, accept: "application/json" },
    });
    out.providerStatus = r.status;
    out.providerBody = (await r.text()).slice(0, 200);
  } catch (e) {
    out.providerStatus = "fetch-failed";
    out.providerBody = String(e && e.message).slice(0, 200);
  }
  return res.status(200).json(out);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET" && /selftest=1/.test(req.url || "")) {
    return selftest(res);
  }

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

  const key = providerKey();
  if (!key) {
    console.error("BREVO_API_KEY is not set");
    return res.status(503).json({ ok: false, error: "Sign-up is not switched on yet." });
  }

  // No custom attributes: Brevo 400s on any attribute the account has not
  // defined, and a fresh account has none.
  const payload = { email, updateEnabled: true };
  const ids = listIds();
  if (ids) payload.listIds = ids;

  try {
    const r = await fetch(PROVIDER_URL, {
      method: "POST",
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    // 201 created, 204 updated (updateEnabled turns a repeat into a no-op)
    if (r.ok) return res.status(200).json({ ok: true });

    const text = await r.text();

    // a returning visitor is a success from their point of view
    if (r.status === 400 && /duplicate|already exist/i.test(text)) {
      return res.status(200).json({ ok: true, already: true });
    }

    console.error("provider error", r.status, PROVIDER_URL, text.slice(0, 300));
    return res.status(502).json({
      ok: false,
      error: "We could not sign you up just now.",
      providerStatus: r.status,   // shown nowhere in the UI; visible in devtools
    });
  } catch (e) {
    console.error("subscribe failed", e);
    return res.status(502).json({ ok: false, error: "We could not sign you up just now." });
  }
}
