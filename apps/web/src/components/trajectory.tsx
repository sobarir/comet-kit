/**
 * Signature element: the Comet trajectory.
 * A thin gradient arc (ultramarine head -> amber tail) with five ticks,
 * one per workflow phase. The pipeline is a real sequence, so the
 * sequential markers encode information, not decoration.
 */
const PHASES = ["open", "design", "build", "verify", "archive"] as const;

export function Trajectory({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div aria-hidden className="flex items-center gap-1.5">
        {PHASES.map((phase, i) => (
          <span
            key={phase}
            className="h-1 w-6 rounded-full"
            style={{
              background: `color-mix(in oklab, var(--primary) ${100 - i * 18}%, var(--accent))`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <figure aria-label="Comet workflow: open, design, build, verify, archive">
      <svg
        viewBox="0 0 720 96"
        className="w-full"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="comet-tail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        {/* trajectory arc */}
        <path
          d="M 8 72 Q 360 8 712 40"
          fill="none"
          stroke="url(#comet-tail)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* phase ticks along the arc */}
        {[
          { x: 8, y: 72 },
          { x: 182, y: 47 },
          { x: 360, y: 36 },
          { x: 538, y: 34 },
          { x: 712, y: 40 },
        ].map((p, i) => (
          <g key={PHASES[i]}>
            <circle
              cx={p.x}
              cy={p.y}
              r={i === 0 ? 5 : 3.5}
              fill={i === 0 ? "var(--primary)" : "var(--background)"}
              stroke="var(--primary)"
              strokeWidth="1.5"
            />
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {PHASES.map((phase) => (
          <span key={phase}>{phase}</span>
        ))}
      </figcaption>
    </figure>
  );
}
