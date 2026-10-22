// Cloudflare Pages Function: POST /api/verify  -> checks the Turnstile token server-side.
// Set TURNSTILE_SECRET in Pages > Settings > Variables and Secrets.
export async function onRequestPost({ request, env }) {
  const { token } = await request.json().catch(() => ({}));
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET || "");
  body.append("response", token || "");
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) body.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const d = await r.json();
  return Response.json({ success: !!d.success }, { status: d.success ? 200 : 403 });
}
