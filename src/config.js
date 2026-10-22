import { JsonRpcProvider } from "ethers";

export const TOKEN = "0xc00583c4c8e8eed451cb827809dfe7f011477350";
export const FAUCET = import.meta.env.VITE_FAUCET_ADDRESS || "0x0000000000000000000000000000000000000000";
export const DISCORD_INVITE = import.meta.env.VITE_DISCORD_INVITE || "https://discord.gg/";
export const RPC = import.meta.env.VITE_POLYGON_RPC || "https://polygon-rpc.com";
export const API = "https://polygon.blockscout.com/api/v2";

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

export const read = new JsonRpcProvider(RPC);
export const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
