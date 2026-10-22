const CLIP = "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]";

// Width comes from the --hx CSS variable set by the grid, so tiles scale with the screen.
export default function Hex({ children, onClick, label, tint = "#d9dbe3" }) {
  const Tag = onClick ? "button" : "div";
  const filled = Boolean(children);
  return (
    <div className="drop-shadow-[0_8px_10px_rgba(20,20,40,0.12)] drop-shadow-[0_-3px_5px_rgba(255,255,255,0.95)]" style={{ width: "var(--hx)" }}>
      <Tag
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`${CLIP} relative block aspect-[0.866] w-full outline-none ${filled ? "" : "bg-[#eeeff3]"} ${onClick ? "cursor-pointer transition duration-200 hover:scale-105 hover:brightness-105 focus-visible:scale-110 active:scale-95" : ""}`}
        style={filled ? { background: tint } : undefined}
      >
        {filled && <span className={`${CLIP} absolute inset-[3px] grid place-items-center bg-white`}>{children}</span>}
      </Tag>
    </div>
  );
}
