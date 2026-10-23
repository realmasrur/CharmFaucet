const DATE = "October 22, 2026";
const Sec = ({ t, children }) => (<><h2 className="mt-6 font-sans text-base font-bold text-neutral-900">{t}</h2><p className="mt-1">{children}</p></>);

export default function Legal({ kind }) {
  const terms = kind === "terms";
  return (
    <article className="mx-auto w-full max-w-2xl p-2 text-sm leading-relaxed text-neutral-600 sm:p-6">
      <a href="#/" className="text-xs font-medium text-blue-600 hover:underline">← Back to faucet</a>
      <h1 className="mt-3 font-sans text-2xl font-bold text-neutral-900">{terms ? "Terms of Use" : "Privacy Policy"}</h1>
      <p className="text-xs text-neutral-400">Last updated {DATE}</p>
      {terms ? (<>
        <Sec t="Using the faucet">The CHARM Faucet gives out a fixed amount of $CHARM on the Polygon network, once per wallet address. By using it you agree to these terms.</Sec>
        <Sec t="No value or advice">$CHARM may have no market value. Nothing on this site is financial, investment, tax or legal advice. You are responsible for your own decisions.</Sec>
        <Sec t="Fair use">Don't try to claim more than once, use bots or scripts. We may refuse, pause or end the faucet at any time without notice.</Sec>
        <Sec t="Blockchain risk">Transactions are final and public. You pay the network gas fee in POL. Smart contracts and wallets can have bugs, and you use them at your own risk.</Sec>
        <Sec t="No warranty">The site and contract are provided as is, without warranties. To the fullest extent allowed by law, we aren't liable for losses arising from their use.</Sec>
        <Sec t="Changes and contact">We may update these terms; continued use means you accept the update. Questions? Contact the CHARM team through its official channels.</Sec>
      </>) : (<>
        <Sec t="What we collect">We don't run accounts and we don't ask for your name or email. When you connect, your wallet address is read in your browser to check if it already claimed.</Sec>
        <Sec t="On-chain data">Claims are recorded on the Polygon blockchain. That data is public and permanent, and we can't delete it.</Sec>
        <Sec t="Bot check">We use Cloudflare Turnstile to tell humans from bots. It processes browser and network signals under Cloudflare's own privacy policy (cloudflare.com/privacypolicy).</Sec>
        <Sec t="Third-party services">The page calls a Polygon RPC node and the Blockscout API to read balances, holder counts and recent claims. Our hosting provider may log standard request data such as IP address.</Sec>
        <Sec t="Local storage">Your browser keeps one small flag for this session: that you passed the bot check. Clear your browser data to remove them.</Sec>
        <Sec t="Contact">Questions about privacy? Contact the CHARM team through its official channels.</Sec>
      </>)}
    </article>
  );
}
