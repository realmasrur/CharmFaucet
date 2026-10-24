import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import { TOKEN, FAUCET, POLYGON, FAUCET_ABI, ERC20_ABI, API, SITE, short } from "./config";
import Logo from "./components/Logo";
import PixelAvatar from "./components/PixelAvatar";
import Gate from "./components/Gate";
import Legal from "./components/Legal";

const ago = (iso) => { const s = Math.max(1, (Date.now() - new Date(iso)) / 1000); return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`; };

function useHash() {
  const [h, setH] = useState(window.location.hash);
  useEffect(() => { const f = () => { setH(window.location.hash); window.scrollTo(0, 0); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  return h;
}

export default function App() {
  const route = useHash();
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-800">
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        {route === "#/terms" ? <Legal kind="terms" /> : route === "#/privacy" ? <Legal kind="privacy" /> : <Gate><Faucet /></Gate>}
      </main>
      <footer className="flex justify-center gap-5 pb-6 text-xs text-neutral-400">
        <a className="hover:text-neutral-700" href="#/terms">Terms</a>
        <a className="hover:text-neutral-700" href="#/privacy">Privacy</a>
        <a className="hover:text-neutral-700" href={`https://polygonscan.com/address/${FAUCET}`} target="_blank" rel="noreferrer">Contract</a>
      </footer>
    </div>
  );
}

function Faucet() {
  const [account, setAccount] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [status, setStatus] = useState(null); // {text, state, hash}
  const [noWallet, setNoWallet] = useState(false);
  const busy = status?.state === "working";
  const [recent, setRecent] = useState(null);

  const loadRecent = useCallback(async () => {
    try {
      const r = await (await fetch(`${API}/addresses/${FAUCET}/token-transfers?type=ERC-20&filter=from`)).json();
      const fetched = (r.items || [])
        .filter((x) => (x.token?.address_hash || x.token?.address || TOKEN).toLowerCase() === TOKEN && x.to?.hash)
        .map((x) => ({
          to: x.to.hash, tx: x.transaction_hash ?? x.tx_hash, time: x.timestamp,
          amt: Number(formatUnits(x.total?.value ?? "0", x.total?.decimals ?? x.token?.decimals ?? 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        }));
      setRecent((prev) => [...(prev || []).filter((p) => p.local && !fetched.some((f) => f.tx === p.tx)), ...fetched].slice(0, 6));
    } catch { setRecent((prev) => prev ?? []); }
  }, []);
  useEffect(() => { loadRecent(); const id = setInterval(loadRecent, 30000); return () => clearInterval(id); }, [loadRecent]);

  useEffect(() => {
    const eth = window.ethereum; if (!eth?.on) return;
    const f = () => { setAccount(null); setClaimed(false); setStatus(null); };
    eth.on("accountsChanged", f); return () => eth.removeListener?.("accountsChanged", f);
  }, []);

  async function getProvider() {
    if (!window.ethereum) { setNoWallet(true); throw new Error("no-wallet"); }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON.chainId }] }); }
    catch (e) { if (e.code === 4902 || e?.data?.originalError?.code === 4902) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [POLYGON] }); else throw e; }
    return new BrowserProvider(window.ethereum); // all reads go through the user's wallet, no public RPC needed
  }

  function explain(e) {
    if (e.message === "no-wallet") return null;
    const m = String(e.reason || e.shortMessage || e.message || "");
    if (e.code === 4001 || e.code === "ACTION_REJECTED") return "Cancelled in wallet.";
    if (m.includes("AlreadyClaimed")) return "This wallet already claimed.";
    if (/insufficient funds/i.test(m)) return "Not enough POL to pay the network fee.";
    if (/estimateGas|execution reverted|CALL_EXCEPTION/i.test(m)) return "Claim would fail. The faucet may be empty or this wallet already claimed.";
    return m.slice(0, 140) || "Something went wrong. Try again.";
  }

  async function connect() {
    try {
      setStatus(null);
      const provider = await getProvider();
      const addr = await (await provider.getSigner()).getAddress();
      setAccount(addr);
      try {
        const c = await new Contract(FAUCET, FAUCET_ABI, provider).claimed(addr);
        setClaimed(c);
        if (c) setStatus({ text: "This wallet already claimed.", state: "done" });
      } catch {}
    } catch (e) { const t = explain(e); if (t) setStatus({ text: t, state: "error" }); }
  }

  async function addToWallet() {
    try {
      const provider = await getProvider();
      const decimals = Number(await new Contract(TOKEN, ERC20_ABI, provider).decimals());
      await window.ethereum.request({ method: "wallet_watchAsset", params: { type: "ERC20", options: { address: TOKEN, symbol: "CHARM", decimals, image: `${SITE}/logo.png` } } });
    } catch (e) { const t = explain(e); if (t) setStatus({ text: t, state: "error" }); }
  }

  async function claim() {
    try {
      setStatus({ text: "Checking…", state: "working" });
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const faucet = new Contract(FAUCET, FAUCET_ABI, signer);
      const [done, amount, bal] = await Promise.all([
        faucet.claimed(addr), faucet.amount(), new Contract(TOKEN, ERC20_ABI, provider).balanceOf(FAUCET),
      ]);
      if (done) { setClaimed(true); return setStatus({ text: "This wallet already claimed.", state: "done" }); }
      if (bal < amount) return setStatus({ text: "The faucet is out of CHARM. Try again later.", state: "error" });

      const [fee, gas] = await Promise.all([provider.getFeeData(), faucet.claim.estimateGas()]);
      const opts = { gasLimit: (gas * 110n) / 100n };
      if (fee.maxFeePerGas && fee.maxPriorityFeePerGas) { opts.maxFeePerGas = fee.maxFeePerGas; opts.maxPriorityFeePerGas = fee.maxPriorityFeePerGas; }
      setStatus({ text: "Confirm in your wallet…", state: "working" });
      const tx = await faucet.claim(opts);
      setStatus({ text: "Sending 50 CHARM…", state: "working", hash: tx.hash });
      await tx.wait();
      setClaimed(true);
      setStatus({ text: "50 CHARM sent to your wallet.", state: "done", hash: tx.hash });
      setRecent((r) => [{ to: addr, tx: tx.hash, time: new Date().toISOString(), amt: "50", local: true }, ...(r || [])].slice(0, 6));
      setTimeout(loadRecent, 8000);
    } catch (e) { const t = explain(e); if (t) setStatus({ text: t, state: "error" }); else setStatus(null); }
  }

  return (
    <section className="w-full max-w-xs text-center">
      <Logo className="mx-auto h-14 w-14" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">CHARM</h1>
      <p className="mt-1 text-sm text-neutral-500">Claim 50 CHARM on Polygon. Once per wallet.</p>

      <button onClick={account ? claim : connect} disabled={busy || claimed}
        className="mt-8 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.98] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900">
        {busy ? "Working…" : claimed ? "Claimed" : account ? "Claim 50 CHARM" : "Connect wallet"}
      </button>
      {account && <p className="mt-3 font-mono text-xs text-neutral-400">{short(account)}</p>}

      <p role="status" aria-live="polite" className={`mt-5 min-h-[1.25rem] break-words text-sm ${status?.state === "error" ? "text-red-600" : status?.state === "done" ? "text-emerald-600" : "text-neutral-500"}`}>
        {status?.text}{" "}
        {status?.hash && <a className="underline" href={`https://polygonscan.com/tx/${status.hash}`} target="_blank" rel="noreferrer">View</a>}
      </p>

      <button onClick={addToWallet} className="mt-1 rounded-full px-4 py-2 text-xs font-medium text-neutral-500 ring-1 ring-neutral-200 transition hover:bg-neutral-50 hover:text-neutral-800 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900">
        Add CHARM to wallet
      </button>

      {noWallet && (
        <p role="alert" className="mt-4 rounded-2xl bg-neutral-50 p-4 text-left text-sm text-neutral-600 ring-1 ring-neutral-200">
          No wallet found in this browser. Use any wallet provider such as MetaMask, Rabby, Trust or Coinbase Wallet: install its extension, or open this page inside the wallet's built-in browser.
        </p>
      )}

      <div className="mt-10 text-left">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Recent claims</h2>
        <ul className="mt-3 divide-y divide-neutral-100" aria-live="polite">
          {recent === null && <li className="py-3 text-sm text-neutral-400">Loading…</li>}
          {recent?.length === 0 && <li className="py-3 text-sm text-neutral-400">No claims yet.</li>}
          {recent?.map((r) => (
            <li key={r.tx}>
              <a href={`https://polygonscan.com/tx/${r.tx}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2.5 text-sm transition hover:opacity-70">
                <PixelAvatar address={r.to} size={28} />
                <span className="flex-1 font-mono text-xs text-neutral-700">{short(r.to)}</span>
                <span className="text-xs text-neutral-500">{r.amt} CHARM</span>
                <span className="w-16 text-right text-xs text-neutral-400">{r.time ? ago(r.time) : ""}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
