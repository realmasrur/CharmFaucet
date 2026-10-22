import { useMemo } from "react";

/* ---------- pixel avatar (5x5 mirrored, wallet-provider style) ---------- */
export default function PixelAvatar({ address, size = 30 }) {
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

