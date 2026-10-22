import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { TOKEN, FAUCET, DISCORD_INVITE, API, POLYGON, FAUCET_ABI, ERC20_ABI, SITE, read, short } from "./config";
import { PolygonLogo, CharmLogo, DiscordLogo } from "./components/Logos";
import PixelAvatar from "./components/PixelAvatar";
import Hex from "./components/Hex";
import Gate from "./components/Gate";
import Legal from "./components/Legal";

const chip = "inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 shadow-[0_3px_8px_rgba(20,20,40,0.08)] ring-1 ring-black/5 transition hover:bg-neutral-50 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500";
const ago = (iso) => { const s = Math.max(1, (Date.now() - new Date(iso)) / 1000); return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`; };
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function useHash() {
  const [h, setH] = useState(window.location.hash);
  useEffect(() => { const f = () => { setH(window.location.hash); window.scrollTo(0, 0); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  return h;
}

export default function App() {
  const route = useHash();
  const [holders, setHolders] = useState(null);

  const loadHolders = useCallback(async () => {
    try { const r = await (await fetch(`${API}/tokens/${TOKEN}`)).json(); const n = Number(r.holders_count ?? r.holders); if (!Number.isNaN(n)) setHolders(n); } catch {}
  }, []);
  useEffect(() => { loadHolders(); const id = setInterval(loadHolders, 60000); return () => clearInterval(id); }, [loadHolders]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#e9eaef] font-sans text-neutral-700">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#1fdcc0]/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#8247E5]/20 blur-3xl" />

      <header className="relative mx-auto flex max-w-3xl items-center justify-between px-4 pt-4 sm:px-6">
        <a href="#/" className="flex items-center gap-2 font-bold text-neutral-900">
          <CharmLogo className="h-8 w-8" /> <span className="text-lg tracking-tight">CHARM</span>
        </a>
        <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs shadow-[0_4px_12px_rgba(20,20,40,0.10)] ring-1 ring-black/5" title="Total $CHARM holders">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>
          <span className="font-mono font-semibold text-neutral-900">{holders == null ? "—" : holders.toLocaleString()}</span>
          <span className="text-neutral-400">holders</span>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        {route === "#/terms" ? <Legal kind="terms" /> : route === "#/privacy" ? <Legal kind="privacy" /> : (
          <Gate><Faucet onClaimed={loadHolders} /></Gate>
        )}
      </main>

      <footer className="relative mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 pb-8 text-xs text-neutral-500">
        <a className="hover:text-neutral-900 hover:underline" href="#/terms">Terms of Use</a>
        <a className="hover:text-neutral-900 hover:underline" href="#/privacy">Privacy</a>
        <a className="hover:text-neutral-900 hover:underline" href={`https://polygonscan.com/token/${TOKEN}`} target="_blank" rel="noreferrer">Polygonscan</a>
        <a className="hover:text-neutral-900 hover:underline" href={DISCORD_INVITE} target="_blank" rel="noreferrer">Discord</a>
        <span className="text-neutral-400">Not financial advice</span>
      </footer>
    </div>
  );
}

function Faucet({ onClaimed }) {
  const [account, setAccount] = useState(null);
  const [joined, setJoined] = useState(() => { try { return localStorage.getItem("charm_discord") === "1"; } catch { return false; } });
  const [claimed, setClaimed] = useState(false);
  const [status, setStatus] = useState(null);
  const [recent, setRecent] = useState([]);
  const [copied, setCopied] = useState(false);
  const [noWallet, setNoWallet] = useState(false);
  const faucetRead = useMemo(() => new Contract(FAUCET, FAUCET_ABI, read), []);

  const loadRecent = useCallback(async () => {
    try {
      const r = await (await fetch(`${API}/tokens/${TOKEN}/transfers`)).json();
      setRecent((r.items || []).filter((t) => t.from?.hash?.toLowerCase() === FAUCET.toLowerCase()).slice(0, 5)
        .map((t) => ({ to: t.to.hash, tx: t.transaction_hash ?? t.tx_hash, time: t.timestamp })));
    } catch {}
  }, []);
  useEffect(() => { loadRecent(); const id = setInterval(loadRecent, 60000); return () => clearInterval(id); }, [loadRecent]);

  useEffect(() => {
    const eth = window.ethereum; if (!eth?.on) return;
    const f = () => { setAccount(null); setClaimed(false); setStatus(null); };
    eth.on("accountsChanged", f); return () => eth.removeListener?.("accountsChanged", f);
  }, []);

  async function ensureWallet() {
    if (!window.ethereum) { setNoWallet(true); throw new Error("no-wallet"); }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON.chainId }] }); }
    catch (e) { if (e.code === 4902 || e?.data?.originalError?.code === 4902) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [POLYGON] }); else throw e; }
    return new BrowserProvider(window.ethereum);
  }
  const fail = (e) => { if (e.message !== "no-wallet") setStatus({ text: e.reason || e.shortMessage || e.message || "Something went wrong", state: "error" }); };

  async function connect() {
    try {
      const addr = await (await (await ensureWallet()).getSigner()).getAddress();
      setAccount(addr);
      const c = await faucetRead.claimed(addr); setClaimed(c);
      setStatus(c ? { text: "This wallet already claimed", state: "done" } : null);
    } catch (e) { fail(e); }
  }

  function openDiscord() {
    window.open(DISCORD_INVITE, "_blank", "noopener,noreferrer");
    try { localStorage.setItem("charm_discord", "1"); } catch {}
    setJoined(true);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(TOKEN); }
    catch { const t = document.createElement("textarea"); t.value = TOKEN; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  }

  async function addToWallet() {
    try {
      await ensureWallet();
      const decimals = Number(await new Contract(TOKEN, ERC20_ABI, read).decimals());
      await window.ethereum.request({ method: "wallet_watchAsset", params: { type: "ERC20", options: { address: TOKEN, symbol: "CHARM", decimals, image: `${SITE}/charm-logo.png` } } });
    } catch (e) { fail(e); }
  }

  async function claim() {
    if (!account) return connect();
    if (!joined) return openDiscord();
    try {
      setStatus({ text: "Checking if you already claimed…", state: "working" });
      const provider = await ensureWallet();
      if (await faucetRead.claimed(account)) { setClaimed(true); return setStatus({ text: "Already claimed", state: "done" }); }
      const faucet = new Contract(FAUCET, FAUCET_ABI, await provider.getSigner());
      const [fee, gas] = await Promise.all([provider.getFeeData(), faucet.claim.estimateGas()]);
      setStatus({ text: "Confirm in your wallet…", state: "working" });
      const tx = await faucet.claim({ gasLimit: (gas * 110n) / 100n, maxPriorityFeePerGas: fee.maxPriorityFeePerGas, maxFeePerGas: fee.maxFeePerGas });
      setStatus({ text: "Sending 50 CHARM…", state: "working" });
      await tx.wait();
      setClaimed(true); setStatus({ text: "50 CHARM sent to your wallet", state: "done" });
      loadRecent(); onClaimed?.();
    } catch (e) {
      const m = e.reason || e.shortMessage || e.message || "Transaction failed";
      setStatus({ text: m.includes("AlreadyClaimed") ? "Already claimed" : m, state: "error" });
    }
  }

  const busy = status?.state === "working";
  const ready = account && joined && !claimed && !busy;
  const label = !account ? "Connect wallet" : !joined ? "Join Discord to continue" : claimed ? "Claimed" : "Claim 50 CHARM";
  const steps = [["Connect", !!account], ["Join Discord", joined], ["Claim", claimed]];
  const dot = { working: "bg-orange-500", done: "bg-emerald-400", error: "bg-red-500" };
  const word = { working: "Working...", done: "Done", error: "Failed" };

  return (
    <section className="mx-auto mt-6 w-full max-w-md rounded-[36px] bg-white/70 p-5 pb-7 shadow-[0_30px_60px_-20px_rgba(30,30,60,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white backdrop-blur sm:p-7">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Claim 50 CHARM</h1>
        <p className="mt-1 text-sm text-neutral-500">Free on Polygon. One claim per wallet.</p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-[6px]" style={{ "--hx": "clamp(56px,17.5vw,92px)" }}>
        <div className="flex gap-[6px]"><Hex /><Hex label="Polygon network" tint="#8247E5"><PolygonLogo className="w-[52%]" /></Hex><Hex /></div>
        <div className="flex gap-[6px]" style={{ marginTop: "calc(var(--hx) * -0.27)" }}>
          <Hex /><Hex label="CHARM token" tint="#1fdcc0"><CharmLogo className="w-[56%]" /></Hex>
          <Hex onClick={openDiscord} label="Join our Discord" tint="#5865F2"><DiscordLogo className="w-[54%]" /></Hex><Hex />
        </div>
        <div className="flex gap-[6px]" style={{ marginTop: "calc(var(--hx) * -0.27)" }}>
          <Hex /><Hex label="50 CHARM per wallet" tint="#c9ccd6"><span className="text-[clamp(14px,4.2vw,20px)] font-bold text-neutral-700">×50</span></Hex><Hex />
        </div>
      </div>

      <ol className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-neutral-500">
        {steps.map(([t, done], i) => (
          <li key={t} className="flex flex-col items-center gap-1.5">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${done ? "bg-emerald-400 text-white" : "bg-white text-neutral-400 ring-1 ring-black/10"}`}>{done ? "✓" : i + 1}</span>
            <span className={done ? "text-neutral-800" : ""}>{t}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid place-items-center">
        <span className="relative rounded-full p-1.5 ring-1 ring-blue-200">
          {ready && <span aria-hidden className="absolute inset-0 animate-ping rounded-full ring-2 ring-blue-300/60 motion-reduce:animate-none" />}
          <span className="block rounded-full p-1.5 ring-1 ring-blue-300">
            <button onClick={claim} disabled={claimed || busy}
              className="rounded-full bg-gradient-to-b from-blue-400 to-blue-600 px-9 py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(59,130,246,0.5)] transition active:scale-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
              {label}
            </button>
          </span>
        </span>
        {account && <p className="mt-3 flex items-center gap-2 text-xs text-neutral-500"><PixelAvatar address={account} size={20} /> <span className="font-mono">{short(account)}</span></p>}
      </div>

      {noWallet && (
        <div role="alert" className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">No wallet found in this browser</p>
          <p className="mt-1 text-amber-800">Use any wallet provider that works in your browser, such as MetaMask, Rabby, Trust Wallet or Coinbase Wallet. Install its extension, or open this page inside the wallet's built-in browser.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a className={chip} href="https://metamask.io/download" target="_blank" rel="noreferrer">Get MetaMask</a>
            <a className={chip} href="https://rabby.io" target="_blank" rel="noreferrer">Get Rabby</a>
            {isMobile() && <a className={chip} href={`https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`}>Open in MetaMask app</a>}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button onClick={copy} className={`${chip} font-mono`} aria-label="Copy token contract address">{copied ? "Copied ✓" : <>{short(TOKEN)} <span className="font-sans text-blue-600">Copy</span></>}</button>
        <button onClick={addToWallet} className={chip}>Add to wallet</button>
      </div>

      <ul className="mt-6 space-y-2.5" aria-live="polite">
        {status && (
          <li className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs shadow-[0_6px_14px_rgba(20,20,40,0.07)]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neutral-200 ring-4 ring-neutral-100"><span className="h-2 w-2 rounded-full bg-white" /></span>
            <span className="min-w-0 flex-1 break-words">{status.text}</span>
            <span className="text-neutral-400">{word[status.state]}</span>
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot[status.state]}`} />
          </li>
        )}
        {recent.length === 0 && !status && <li className="rounded-2xl bg-white/60 px-4 py-3 text-center text-xs text-neutral-400">No claims yet. Be the first.</li>}
        {recent.map((r) => (
          <li key={r.tx}>
            <a href={`https://polygonscan.com/tx/${r.tx}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs shadow-[0_6px_14px_rgba(20,20,40,0.07)] transition hover:bg-neutral-50">
              <PixelAvatar address={r.to} />
              <span className="min-w-0 flex-1"><span className="font-mono">{short(r.to)}</span> <span className="text-neutral-400">got 50 CHARM</span></span>
              <span className="text-neutral-400">{r.time ? ago(r.time) : "Done"}</span>
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
