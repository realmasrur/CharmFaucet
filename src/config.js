import { isAddress } from "ethers";

export const TOKEN = "0xc00583c4c8e8eed451cb827809dfe7f011477350";
const DEFAULT_FAUCET = "0x9636eE1d1f76A911F7129263C707C5AF426298e1";
const envFaucet = (import.meta.env.VITE_FAUCET_ADDRESS || "").trim();
export const FAUCET = isAddress(envFaucet.toLowerCase()) ? envFaucet.toLowerCase() : DEFAULT_FAUCET.toLowerCase();

export const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || "1x00000000000000000000AA"; // Cloudflare test key
export const RPC = import.meta.env.VITE_POLYGON_RPC || "https://polygon-rpc.com";

export const POLYGON = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  rpcUrls: [RPC],
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  blockExplorerUrls: ["https://polygonscan.com"],
};

export const FAUCET_ABI = [
  "function claim()",
  "function claimed(address) view returns (bool)",
  "function amount() view returns (uint256)",
];
export const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
export const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
