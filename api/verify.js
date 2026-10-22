// Vercel Serverless Function: POST /api/verify  -> checks the Turnstile token server-side.
// Set TURNSTILE_SECRET in Vercel > Settings > Environment Variables.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false });
  const token = req.body?.token || "";
  const params = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET || "", response: token });
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: params });
  const d = await r.json();
  res.status(d.success ? 200 : 403).json({ success: !!d.success });
}
