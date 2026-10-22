import { useCallback, useMemo, useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { TOKEN, FAUCET, DISCORD_INVITE, API, POLYGON, FAUCET_ABI, read, short } from "./config";
import { PolygonLogo, CharmLogo, DiscordLogo } from "./components/Logos";
import PixelAvatar from "./components/PixelAvatar";
import Hex from "./components/Hex";

/* ---------- page ---------- */
export default function App() {
  const [account, setAccount] = useState(null);
  const [joined, setJoined] = useState(() => { try { return localStorage.getItem("charm_discord") === "1"; } catch { return false; } });
  const [claimed, setClaimed] = useState(false);
  const [status, setStatus] = useState(null); // {text, state:'working'|'done'|'error'}
  const [holders, setHolders] = useState(null);
  const [recent, setRecent] = useState([]);
  const [decimals, setDecimals] = useState(18);

  const faucetRead = useMemo(() => new Contract(FAUCET, FAUCET_ABI, read), []);

  const loadHolders = useCallback(async () => {
    try {
      const r = await (await fetch(`${API}/tokens/${TOKEN}`)).json();
      setHolders(Number(r.holders_count ?? r.holders));
    } catch {}
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      const r = await (await fetch(`${API}/tokens/${TOKEN}/transfers`)).json();
      setRecent((r.items || [])
        .filter((t) => t.from?.hash?.toLowerCase() === FAUCET.toLowerCase())
        .slice(0, 5)
        .map((t) => ({ to: t.to.hash, tx: t.transaction_hash ?? t.tx_hash, time: t.timestamp })));
    } catch {}
  }, []);

  useEffect(() => {
    loadHolders(); loadRecent();
    const id = setInterval(() => { loadHolders(); loadRecent(); }, 60000);
    return () => clearInterval(id);
  }, [loadHolders, loadRecent]);

  const checkClaimed = useCallback(async (addr) => {
    const c = await faucetRead.claimed(addr);
    setClaimed(c);
    return c;
  }, [faucetRead]);

  async function connect() {
    if (!window.ethereum) return setStatus({ text: "No wallet found. Install MetaMask.", state: "error" });
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON.chainId }] }); }
      catch (e) { if (e.code === 4902) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [POLYGON] }); else throw e; }
      const signer = await new BrowserProvider(window.ethereum).getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);
      if (await checkClaimed(addr)) setStatus({ text: "This wallet already claimed", state: "done" });
      else setStatus(null);
    } catch (e) { setStatus({ text: e.shortMessage || e.message, state: "error" }); }
  }

  function openDiscord() {
    window.open(DISCORD_INVITE, "_blank", "noopener");
    // NOTE: front-end only can't verify membership (see README note). This unlocks the claim button.
    try { localStorage.setItem("charm_discord", "1"); } catch {}
    setJoined(true);
  }

  async function claim() {
    if (!account) return connect();
    if (!joined) return openDiscord();
    try {
      setStatus({ text: "Checking claim status…", state: "working" });
      if (await checkClaimed(account)) return setStatus({ text: "Already claimed", state: "done" });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const faucet = new Contract(FAUCET, FAUCET_ABI, signer);

      // Lowest viable fee: use the network's own suggested EIP-1559 values, no tip padding,
      // and a gas limit just above the estimate.
      const [fee, gas] = await Promise.all([provider.getFeeData(), faucet.claim.estimateGas()]);
      setStatus({ text: "Confirm in your wallet…", state: "working" });
      const tx = await faucet.claim({
        gasLimit: (gas * 110n) / 100n,
        maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
        maxFeePerGas: fee.maxFeePerGas,
      });
      setStatus({ text: "Sending 50 CHARM…", state: "working" });
      await tx.wait();
      setClaimed(true);
      setStatus({ text: "50 CHARM sent", state: "done" });
      loadRecent(); loadHolders();
    } catch (e) {
      const msg = e.reason || e.shortMessage || e.message || "Transaction failed";
      setStatus({ text: msg.includes("AlreadyClaimed") ? "Already claimed" : msg, state: "error" });
    }
  }

  const label = !account ? "Connect wallet" : !joined ? "Join Discord first" : claimed ? "Claimed" : "Claim 50 CHARM";
  const dot = { working: "bg-orange-500", done: "bg-emerald-400", error: "bg-red-500" };

  return (
    <div className="min-h-screen bg-[#e4e4e4] px-4 py-6 font-mono text-neutral-700">
      {/* holders indicator */}
      <div className="fixed right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-semibold">{holders == null ? "—" : holders.toLocaleString()}</span>
        <span className="text-neutral-400">holders</span>
      </div>

      <main className="mx-auto mt-10 max-w-md rounded-[40px] bg-[#ebebeb] p-6 pb-8 shadow-[inset_0_2px_6px_rgba(255,255,255,0.9),0_20px_40px_rgba(0,0,0,0.08)]">
        {/* hex grid */}
        <div className="flex flex-col items-center gap-0 [&>div]:-mt-[18px] first:[&>div]:mt-0">
          <div className="flex gap-2"><Hex /><Hex label="Polygon network"><PolygonLogo /></Hex><Hex /></div>
          <div className="flex gap-2">
            <Hex /><Hex label="CHARM token"><CharmLogo /></Hex>
            <Hex onClick={openDiscord} label="Join Discord"><DiscordLogo /></Hex><Hex />
          </div>
          <div className="flex gap-2"><Hex /><Hex><span className="text-lg font-bold text-neutral-700">×50</span></Hex><Hex /></div>
        </div>

        {/* button */}
        <div className="mt-8 grid place-items-center">
          <span className="rounded-full p-1.5 ring-1 ring-blue-200"><span className="block rounded-full p-1.5 ring-1 ring-blue-300">
            <button onClick={claim} disabled={claimed || status?.state === "working"}
              className="rounded-full bg-gradient-to-b from-blue-400 to-blue-600 px-10 py-3 text-sm font-medium text-white shadow-[0_6px_14px_rgba(59,130,246,0.45)] transition active:scale-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              {label}
            </button>
          </span></span>
          {account && <p className="mt-3 text-[11px] text-neutral-400">{short(account)}</p>}
        </div>

        {/* status + recent */}
        <ul className="mt-6 space-y-3">
          {status && (
            <li className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs shadow-[0_6px_12px_rgba(0,0,0,0.07)]">
              <span className="h-6 w-6 rounded-full bg-neutral-200 ring-4 ring-neutral-100 grid place-items-center"><span className="h-2 w-2 rounded-full bg-white" /></span>
              <span className="flex-1 break-words">{status.text}</span>
              <span className="text-neutral-400">{status.state === "working" ? "Working..." : status.state === "done" ? "Done" : "Failed"}</span>
              <span className={`h-2 w-2 rounded-full ${dot[status.state]}`} />
            </li>
          )}
          {recent.length === 0 && !status && <li className="rounded-2xl bg-white/60 px-4 py-3 text-center text-xs text-neutral-400">No claims yet. Be the first.</li>}
          {recent.map((r) => (
            <li key={r.tx}>
              <a href={`https://polygonscan.com/tx/${r.tx}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs shadow-[0_6px_12px_rgba(0,0,0,0.07)] hover:bg-neutral-50">
                <PixelAvatar address={r.to} />
                <span className="flex-1">{short(r.to)} <span className="text-neutral-400">got 50 CHARM</span></span>
                <span className="text-neutral-400">Done</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
