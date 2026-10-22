/* ---------- hexagon ---------- */
const HEX = "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]";
export default function Hex({ children, onClick, label, active }) {
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

