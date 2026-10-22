# CHARM Faucet

React + Vite + Tailwind + ethers v6. 50 $CHARM per wallet on Polygon.

## Structure
```
charm-faucet/
├─ contracts/CharmFaucet.sol     deploy this first (Remix / Hardhat / Foundry)
├─ public/favicon.svg
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx                    page + claim logic
│  ├─ config.js                  addresses, ABI, RPC, env
│  ├─ index.css                  tailwind entry
│  └─ components/ Hex, PixelAvatar, Logos
├─ index.html  vite.config.js  tailwind.config.js  postcss.config.js
├─ vercel.json  .env.example  package.json
```

## Run locally
```
npm install
cp .env.example .env     # fill in faucet address + Discord invite
npm run dev
```

## 1. Deploy the contract
Deploy `contracts/CharmFaucet.sol` on Polygon with
`token = 0xc00583c4c8e8eed451cb827809dfe7f011477350` and `amount = 50 * 10**decimals`.
Then transfer CHARM to the faucet contract address.

## 2. Deploy the site
Environment variables (both hosts): `VITE_FAUCET_ADDRESS`, `VITE_DISCORD_INVITE`, optional `VITE_POLYGON_RPC`.

**Vercel**: import the repo. Framework Vite is detected. `vercel.json` handles routing.

**Cloudflare Pages**: Build command `npm run build`, output directory `dist`.
Pages serves `index.html` for unknown routes automatically, so no extra config is needed.
Add the env variables under Settings > Variables (build-time).

Note: front-end only cannot verify Discord membership. See chat notes about adding a signed-claim backend.
