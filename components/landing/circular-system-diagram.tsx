const NODES = [
  { label: "Rules", color: "#FF8FA3" },
  { label: "Requests", color: "#C9A7F0" },
  { label: "Signatures", color: "#B8B3FF" },
  { label: "Execution", color: "#9FB6FF" },
  { label: "Audit", color: "#31B36B" },
];

export function CircularSystemDiagram() {
  const radius = 43; // % from center
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      {/* dotted orbit + radial ticks */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgba(0,0,0,0.16)"
          strokeWidth="0.4"
          strokeDasharray="1 2.4"
        />
        {NODES.map((_, i) => {
          const a = (-90 + i * (360 / NODES.length)) * (Math.PI / 180);
          const x = 50 + Math.cos(a) * 24;
          const y = 50 + Math.sin(a) * 24;
          const x2 = 50 + Math.cos(a) * 40;
          const y2 = 50 + Math.sin(a) * 40;
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x2}
              y2={y2}
              stroke="rgba(0,0,0,0.14)"
              strokeWidth="0.4"
              strokeDasharray="0.8 1.6"
            />
          );
        })}
      </svg>

      {/* center */}
      <div className="absolute left-1/2 top-1/2 flex size-[38%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full p-[3px]">
        <div
          className="flex h-full w-full items-center justify-center rounded-full"
          style={{
            background:
              "conic-gradient(from 180deg,#FF8FA3,#C9A7F0,#B8B3FF,#9FB6FF,#FF8FA3)",
          }}
        >
          <div className="flex h-[86%] w-[86%] flex-col items-center justify-center rounded-full bg-[#F5F2EA] text-center">
            <span className="text-base font-semibold tracking-tight">Bylaw</span>
            <span className="text-[11px] text-[#66625C]">Payout control</span>
          </div>
        </div>
      </div>

      {/* nodes */}
      {NODES.map((n, i) => {
        const a = (-90 + i * (360 / NODES.length)) * (Math.PI / 180);
        const left = 50 + Math.cos(a) * radius;
        const top = 50 + Math.sin(a) * radius;
        return (
          <div
            key={n.label}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 shadow-sm"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: n.color }}
            />
            <span className="text-xs font-medium text-[#242424]">{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}
