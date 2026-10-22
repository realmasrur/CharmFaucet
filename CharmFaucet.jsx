// npm i ethers   (React + Tailwind already set up in your project)
import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider, formatUnits } from "ethers";

/* ---------- CONFIG ---------- */
const TOKEN = "0xc00583c4c8e8eed451cb827809dfe7f011477350";
const FAUCET = "0xYOUR_DEPLOYED_FAUCET_ADDRESS"; // CharmFaucet.sol address
const DISCORD_INVITE = "https://discord.gg/YOUR_INVITE";
const RPC = "https://polygon-rpc.com";
const API = "https://polygon.blockscout.com/api/v2"; // free, no key
const POLYGON = { chainId: "0x89", chainName: "Polygon Mainnet", rpcUrls: [RPC],
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 }, blockExplorerUrls: ["https://polygonscan.com"] };

const FAUCET_ABI = [
  "function claim()",
  "function claimed(address) view returns (bool)",
  "function amount() view returns (uint256)",
];
const read = new JsonRpcProvider(RPC);
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/* ---------- logos (swap in official SVGs if you like) ---------- */
const PolygonLogo = () => (
  <svg viewBox="0 0 38 33" className="h-9 w-9" fill="#8247E5">
    <path d="M28.8 10.1a2.4 2.4 0 0 0-2.4 0l-5.6 3.3-3.8 2.1-5.6 3.3a2.4 2.4 0 0 1-2.4 0l-4.4-2.6a2.4 2.4 0 0 1-1.2-2.1V9.9c0-.9.4-1.7 1.2-2.1l4.4-2.5a2.4 2.4 0 0 1 2.4 0l4.4 2.5c.8.4 1.2 1.2 1.2 2.1v3.300l3.800-2.200V7.700c0-.9-.4-1.700-1.200-2.100L13.400.4a2.400 2.400 0 0 0-2.400 0L2.200 5.600C1.400 6 1 6.800 1 7.700v10.300c0 .9.4 1.700 1.200 2.100l8.800 5.100a2.400 2.400 0 0 0 2.400 0l5.600-3.200 3.800-2.200 5.600-3.200a2.400 2.400 0 0 1 2.400 0l4.400 2.500c.8.4 1.200 1.200 1.200 2.100v5c0 .9-.4 1.700-1.200 2.100l-4.400 2.600a2.400 2.400 0 0 1-2.400 0l-4.400-2.500a2.400 2.400 0 0 1-1.200-2.100v-3.200l-3.800 2.200v3.200c0 .9.4 1.700 1.200 2.100l8.800 5.100a2.400 2.400 0 0 0 2.400 0l8.800-5.100c.8-.4 1.200-1.200 1.200-2.100V20c0-.9-.4-1.700-1.200-2.100z" transform="scale(.9) translate(1 1)" />
  </svg>
);
const CharmLogo = () => (
  <svg viewBox="0 0 100 100" className="h-9 w-9" fill="#1fdcc0">
    <path d="M10 28 L48 8 Q56 5 56 14 V40 L26 57 L56 74 L28 90 Q18 94 10 86 Z" transform="scale(.8) translate(12 12)" />
    <path d="M90 72 L52 92 Q44 95 44 86 V60 L74 43 L44 26 L72 10 Q82 6 90 14 Z" transform="scale(.8) translate(12 12)" />
  </svg>
);
const DiscordLogo = () => (
  <svg viewBox="0 0 24 24" className="h-9 w-9" fill="#5865F2">
    <path d="M20.3 4.4A19 19 0 0 0 15.6 3l-.2.5a17 17 0 0 0-4.8 0L10.4 3a19 19 0 0 0-4.7 1.4C2.7 8.800 1.900 13.100 2.300 17.300a19 19 0 0 0 5.800 2.900l1.200-2c-.7-.2-1.300-.6-1.900-1l.5-.4a13.600 13.600 0 0 0 11.600 0l.5.4c-.6.400-1.200.8-1.900 1l1.200 2a19 19 0 0 0 5.800-2.900c.5-4.900-.8-9.200-3.100-12.900ZM9.500 14.700c-1 0-1.800-.9-1.800-2s.8-2 1.800-2 1.800.9 1.800 2-.8 2-1.800 2Zm5 0c-1 0-1.800-.9-1.800-2s.8-2 1.800-2 1.800.9 1.800 2-.8 2-1.800 2Z" />
  </svg>
);

/* ---------- pixel avatar (5x5 mirrored, wallet-provider style) ---------- */
function PixelAvatar({ address, size = 30 }) {
  const { cells, hue } = useMemo(() => {
    const h = address.toLowerCase().slice(2);
    const hue = (parseInt(h.slice(0, 2), 16) / 255) * 360;
    const cells = [];
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 3; x++)
        if (parseInt(h[2 + y * 3 + x], 16) % 2) {
          cells.push([x, y]);
          if (x < 2) cells.push([4 - x, y]);
        }
    return { cells, hue };
  }, [address]);
  return (
    <svg viewBox="0 0 5 5" width={size} height={size} shapeRendering="crispEdges"
      className="rounded-md shrink-0" style={{ background: `hsl(${hue} 60% 92%)` }}>
      {cells.map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="1" height="1" fill={`hsl(${hue} 65% 42%)`} />)}
    </svg>
  );
}

/* ---------- hexagon ---------- */
const HEX = "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]";
function Hex({ children, onClick, label, active }) {
  const Tag = onClick ? "button" : "div";
  return (
    <div className="drop-shadow-[0_6px_8px_rgba(0,0,0,0.10)] drop-shadow-[0_-3px_6px_rgba(255,255,255,0.9)]">
      <Tag onClick={onClick} aria-label={label}
        className={`${HEX} grid h-[92px] w-[92px] place-items-center ${children ? "bg-white" : "bg-[#f1f1f1]"} ${onClick ? "cursor-pointer transition active:scale-95 focus-visible:outline-none focus-visible:bg-blue-50" : ""} ${active ? "ring-0" : ""}`}>
        {children}
      </Tag>
    </div>
  );
}

/* ---------- page ---------- */
export default function CharmFaucet() {
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
