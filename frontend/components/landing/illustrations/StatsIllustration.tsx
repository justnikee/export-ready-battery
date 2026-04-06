const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function StatsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1320 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Faint vertical reference lines */}
      <g opacity={0.06}>
        {Array.from({ length: 27 }).map((_, i) => (
          <line
            key={`vrl-${i}`}
            x1={50 + i * 48}
            y1={0}
            x2={50 + i * 48}
            y2={400}
            stroke={BLUE}
            strokeWidth={0.5}
          />
        ))}
      </g>

      {/* Faint horizontal reference lines */}
      <g opacity={0.06}>
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`hrl-${i}`}
            x1={0}
            y1={45 + i * 42}
            x2={1320}
            y2={45 + i * 42}
            stroke={BLUE}
            strokeWidth={0.5}
          />
        ))}
      </g>

      {/* Flowing data curve 1 — primary */}
      <g opacity={0.12}>
        <path
          d="M0 250 C80 230 160 200 240 210 C320 220 400 260 480 240 C560 220 640 160 720 180 C800 200 880 250 960 230 C1040 210 1120 170 1200 190 C1260 200 1300 210 1320 205"
          stroke={BLUE}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        {/* Area fill below curve */}
        <path
          d="M0 250 C80 230 160 200 240 210 C320 220 400 260 480 240 C560 220 640 160 720 180 C800 200 880 250 960 230 C1040 210 1120 170 1200 190 C1260 200 1300 210 1320 205 L1320 400 L0 400 Z"
          fill={BLUE}
          opacity={0.04}
        />

        {/* Data points on curve 1 */}
        {[
          { x: 0, y: 250 },
          { x: 240, y: 210 },
          { x: 480, y: 240 },
          { x: 720, y: 180 },
          { x: 960, y: 230 },
          { x: 1200, y: 190 },
        ].map((p, i) => (
          <circle key={`dp1-${i}`} cx={p.x} cy={p.y} r={3} fill={BLUE} opacity={0.5} />
        ))}
      </g>

      {/* Flowing data curve 2 — secondary */}
      <g opacity={0.1}>
        <path
          d="M0 300 C100 280 200 270 300 290 C400 310 500 330 600 310 C700 290 800 260 900 280 C1000 300 1100 320 1200 300 C1260 290 1300 285 1320 290"
          stroke={CYAN}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        {/* Area fill */}
        <path
          d="M0 300 C100 280 200 270 300 290 C400 310 500 330 600 310 C700 290 800 260 900 280 C1000 300 1100 320 1200 300 C1260 290 1300 285 1320 290 L1320 400 L0 400 Z"
          fill={CYAN}
          opacity={0.03}
        />

        {/* Data points on curve 2 */}
        {[
          { x: 150, y: 275 },
          { x: 450, y: 320 },
          { x: 750, y: 275 },
          { x: 1050, y: 310 },
        ].map((p, i) => (
          <circle key={`dp2-${i}`} cx={p.x} cy={p.y} r={2.5} fill={CYAN} opacity={0.4} />
        ))}
      </g>

      {/* Flowing data curve 3 — tertiary */}
      <g opacity={0.08}>
        <path
          d="M0 150 C110 140 220 120 330 140 C440 160 550 190 660 170 C770 150 880 110 990 130 C1100 150 1210 170 1320 155"
          stroke={TEAL}
          strokeWidth={1}
          strokeLinecap="round"
        />
        {/* Data points on curve 3 */}
        {[
          { x: 330, y: 140 },
          { x: 660, y: 170 },
          { x: 990, y: 130 },
        ].map((p, i) => (
          <circle key={`dp3-${i}`} cx={p.x} cy={p.y} r={2} fill={TEAL} opacity={0.4} />
        ))}
      </g>

      {/* Flowing data curve 4 — subtle top wave */}
      <g opacity={0.06}>
        <path
          d="M0 80 C120 70 240 50 360 65 C480 80 600 100 720 85 C840 70 960 45 1080 60 C1200 75 1280 85 1320 80"
          stroke={LAVENDER}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      </g>

      {/* Floating stat numbers — very low opacity */}
      <g fontFamily="monospace" fontWeight="bold">
        <text x={120} y={120} fontSize={40} fill={BLUE} opacity={0.04}>
          10K
        </text>
        <text x={500} y={100} fontSize={36} fill={CYAN} opacity={0.04}>
          99%
        </text>
        <text x={850} y={130} fontSize={44} fill={TEAL} opacity={0.035}>
          3
        </text>
        <text x={1080} y={110} fontSize={32} fill={LAVENDER} opacity={0.04}>
          40ms
        </text>
      </g>

      {/* Additional scattered subtle numbers */}
      <g fontFamily="monospace" opacity={0.03}>
        <text x={300} y={350} fontSize={28} fill={BLUE}>24/7</text>
        <text x={700} y={360} fontSize={24} fill={PURPLE}>100+</text>
        <text x={1000} y={340} fontSize={26} fill={CYAN}>5★</text>
      </g>

      {/* Scattered ambient dots along curves */}
      <g opacity={0.1}>
        {[
          { x: 60, y: 245 },
          { x: 180, y: 205 },
          { x: 360, y: 225 },
          { x: 540, y: 235 },
          { x: 660, y: 185 },
          { x: 840, y: 225 },
          { x: 1020, y: 220 },
          { x: 1140, y: 180 },
          { x: 100, y: 290 },
          { x: 350, y: 295 },
          { x: 550, y: 320 },
          { x: 800, y: 270 },
          { x: 1000, y: 305 },
          { x: 1200, y: 295 },
          { x: 200, y: 130 },
          { x: 500, y: 155 },
          { x: 770, y: 155 },
          { x: 1100, y: 145 },
        ].map((d, i) => (
          <circle key={`sd-${i}`} cx={d.x} cy={d.y} r={2} fill={PURPLE} />
        ))}
      </g>

      {/* Cross-hatch accent areas */}
      <g opacity={0.04}>
        <rect x={100} y={160} width={80} height={60} rx={4} stroke={BLUE} strokeWidth={0.5} strokeDasharray="3 5" />
        <rect x={600} y={200} width={90} height={50} rx={4} stroke={CYAN} strokeWidth={0.5} strokeDasharray="3 5" />
        <rect x={1050} y={180} width={70} height={55} rx={4} stroke={TEAL} strokeWidth={0.5} strokeDasharray="3 5" />
      </g>

      {/* Connecting dashed lines between data points */}
      <g opacity={0.06}>
        <line x1={240} y1={210} x2={330} y2={140} stroke={LAVENDER} strokeWidth={0.5} strokeDasharray="4 6" />
        <line x1={720} y1={180} x2={660} y2={170} stroke={LAVENDER} strokeWidth={0.5} strokeDasharray="4 6" />
        <line x1={960} y1={230} x2={990} y2={130} stroke={LAVENDER} strokeWidth={0.5} strokeDasharray="4 6" />
      </g>
    </svg>
  );
}
