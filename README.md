# CHARM Faucet

React + Vite + Tailwind 3 + ethers v6. 50 $CHARM per wallet on Polygon.

## Structure
```
charm-faucet/
├─ contracts/CharmFaucet.sol
├─ api/verify.js                 Vercel function (Turnstile check)
├─ functions/api/verify.js       Cloudflare Pages function (Turnstile check)
├─ public/  logo.png (logo, favicon, wallet icon)  og.png or og.jpg (share preview 1200x630)
├─ src/
│  ├─ main.jsx  App.jsx  config.js  index.css
│  └─ components/  Gate  Hex  Legal  Logos  PixelAvatar
├─ index.html  vite.config.js  tailwind.config.js  postcss.config.js  vercel.json
```

## Run locally
```
npm install
cp .env.example .env
npm run dev
```
Locally the bot check uses Cloudflare's test key and skips the server check.

## Deploy
1. Deploy `contracts/CharmFaucet.sol` on Polygon, fund it with CHARM.
2. Create a Turnstile widget in the Cloudflare dashboard (Managed mode) and add your domain.
3. Set variables on the host:
   - Build-time: `VITE_FAUCET_ADDRESS`, `VITE_DISCORD_INVITE`, `VITE_SITE_URL`, `VITE_TURNSTILE_SITEKEY`, optional `VITE_POLYGON_RPC`
   - Server secret: `TURNSTILE_SECRET`
4. Vercel: import the repo (Vite is detected). Cloudflare Pages: build `npm run build`, output `dist`.
5. Test the share card at https://cards-dev.twitter.com/validator or by pasting your link in Discord.

## Notes
- The bot check gates the page, not the contract. Anyone can still call `claim()` on-chain directly.
- Discord membership can't be verified by a front-end alone. Add Discord OAuth + a signed claim for real enforcement.
- Review the Terms and Privacy text with a lawyer before launch.
