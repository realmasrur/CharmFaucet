// Uses /public/logo.png everywhere. Replace that file with your own.
export default function Logo({ className = "" }) {
  return <img src="/logo.png" alt="CHARM" className={`object-contain ${className}`} />;
}
