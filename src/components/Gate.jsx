import { useEffect, useRef, useState } from "react";
import { TURNSTILE_SITEKEY } from "../config";
import Logo from "./Logo";

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const loadScript = () =>
  new Promise((res, rej) => {
    if (window.turnstile) return res();
    let s = document.querySelector(`script[src="${SRC}"]`);
    if (!s) { s = document.createElement("script"); s.src = SRC; s.async = true; document.head.appendChild(s); }
    s.addEventListener("load", () => res());
    s.addEventListener("error", () => rej(new Error("blocked")));
  });

export default function Gate({ children }) {
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem("charm_human") === "1"; } catch { return false; } });
  const [err, setErr] = useState("");
  const box = useRef(null);

  useEffect(() => {
    if (ok) return;
    let id, dead = false;
    loadScript()
      .then(() => {
        if (dead || !box.current) return;
        id = window.turnstile.render(box.current, {
          sitekey: TURNSTILE_SITEKEY,
          theme: "light",
          callback: async (token) => {
            try {
              const r = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
              const d = await r.json().catch(() => ({}));
              if (d.success !== true && !import.meta.env.DEV) throw new Error("fail");
              try { sessionStorage.setItem("charm_human", "1"); } catch {}
              setOk(true);
            } catch {
              setErr("Verification failed. Please try again.");
              window.turnstile.reset(id);
            }
          },
          "error-callback": () => setErr("The check couldn't load. Turn off ad blockers or try another browser."),
        });
      })
      .catch(() => setErr("The check couldn't load. Turn off ad blockers or try another browser."));
    return () => { dead = true; if (id !== undefined) try { window.turnstile.remove(id); } catch {} };
  }, [ok]);

  if (ok) return children;
  return (
    <section className="w-full max-w-xs text-center">
      <Logo className="mx-auto h-14 w-14" />
      <h1 className="mt-5 text-xl font-bold text-neutral-900">Quick check</h1>
      <p className="mt-1 text-sm text-neutral-500">Confirm you're not a robot to continue.</p>
      <div ref={box} className="mt-6 flex min-h-[70px] justify-center" />
      {err && <p role="alert" className="mt-3 text-sm text-red-600">{err}</p>}
    </section>
  );
}
