const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function EUIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Digital passport card — center */}
      <g>
        {/* Card outer */}
        <rect
          x={120}
          y={25}
          width={160}
          height={100}
          rx={8}
          stroke={BLUE}
          strokeWidth={1.3}
          strokeLinecap="round"
          fill={`${BLUE}08`}
        />
        {/* Card inner border */}
        <rect
          x={128}
          y={33}
          width={144}
          height={84}
          rx={5}
          stroke={BLUE}
          strokeWidth={0.5}
          opacity={0.3}
        />

        {/* QR code pattern inside card */}
        <g opacity={0.45}>
          {[0, 1, 2, 3, 4, 5, 6].map((row) =>
            [0, 1, 2, 3, 4, 5, 6].map((col) => {
              const filled =
                (row < 3 && col < 3) ||
                (row < 3 && col > 3) ||
                (row > 3 && col < 3) ||
                (row === 3 && col === 3) ||
                ((row + col) % 3 === 0);
              return filled ? (
                <rect
                  key={`qr-${row}-${col}`}
                  x={160 + col * 8}
                  y={42 + row * 8}
                  width={6}
                  height={6}
                  rx={0.5}
                  fill={CYAN}
                  opacity={0.5}
                />
              ) : null;
            })
          )}
        </g>

        {/* Card header text lines */}
        <line x1={135} y1={110} x2={195} y2={110} stroke={BLUE} strokeWidth={0.5} opacity={0.3} />
        <line x1={135} y1={117} x2={180} y2={117} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />

        {/* Card chip */}
        <rect x={247} y={95} width={18} height={14} rx={2} stroke={CYAN} strokeWidth={0.7} fill={`${CYAN}10`} />
        <line x1={251} y1={95} x2={251} y2={109} stroke={CYAN} strokeWidth={0.3} />
        <line x1={257} y1={95} x2={257} y2={109} stroke={CYAN} strokeWidth={0.3} />
        <line x1={247} y1={102} x2={265} y2={102} stroke={CYAN} strokeWidth={0.3} />
      </g>

      {/* EU-inspired star arrangement — left */}
      <g opacity={0.45}>
        <circle cx={55} cy={80} r={35} stroke={LAVENDER} strokeWidth={0.7} strokeDasharray="2 3" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (Math.PI / 6) * i - Math.PI / 2;
          const cx = 55 + 28 * Math.cos(angle);
          const cy = 80 + 28 * Math.sin(angle);
          return (
            <circle
              key={`star-${i}`}
              cx={cx}
              cy={cy}
              r={2.5}
              fill={LAVENDER}
              opacity={0.6}
            />
          );
        })}
        {/* Central accent */}
        <circle cx={55} cy={80} r={8} stroke={LAVENDER} strokeWidth={0.5} opacity={0.3} />
      </g>

      {/* Globe outline — right */}
      <g opacity={0.45}>
        <circle cx={350} cy={75} r={35} stroke={BLUE} strokeWidth={1} />
        {/* Equator */}
        <ellipse cx={350} cy={75} rx={35} ry={12} stroke={BLUE} strokeWidth={0.5} strokeDasharray="3 3" />
        {/* Meridian */}
        <ellipse cx={350} cy={75} rx={12} ry={35} stroke={BLUE} strokeWidth={0.5} strokeDasharray="3 3" />
        {/* Latitude lines */}
        <ellipse cx={350} cy={58} rx={28} ry={5} stroke={BLUE} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.5} />
        <ellipse cx={350} cy={92} rx={28} ry={5} stroke={BLUE} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.5} />
        {/* Longitude accent */}
        <ellipse cx={350} cy={75} rx={24} ry={35} stroke={BLUE} strokeWidth={0.3} strokeDasharray="2 4" opacity={0.3} />
        {/* Dot on globe */}
        <circle cx={365} cy={68} r={2} fill={CYAN} opacity={0.5} />
        <circle cx={338} cy={82} r={1.5} fill={TEAL} opacity={0.5} />
      </g>

      {/* Carbon footprint — bottom center */}
      <g opacity={0.4}>
        {/* Leaf */}
        <path
          d="M175 150 Q185 138 195 150 Q185 158 175 150 Z"
          stroke={TEAL}
          strokeWidth={0.8}
          fill={`${TEAL}10`}
        />
        <line x1={185} y1={142} x2={185} y2={155} stroke={TEAL} strokeWidth={0.4} />

        {/* CO₂ text */}
        <text x={200} y={154} fontSize={8} fontFamily="monospace" fill={BLUE} opacity={0.35}>
          CO₂
        </text>

        {/* Downward arrow (reducing) */}
        <line x1={230} y1={145} x2={230} y2={158} stroke={TEAL} strokeWidth={0.7} strokeLinecap="round" />
        <path d="M226 155 L230 160 L234 155" stroke={TEAL} strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Floating connection lines between elements */}
      <g opacity={0.15}>
        <path
          d="M90 80 C105 75 110 65 120 60"
          stroke={CYAN}
          strokeWidth={0.7}
          strokeLinecap="round"
          strokeDasharray="4 3"
        />
        <path
          d="M280 70 C295 68 305 65 315 68"
          stroke={CYAN}
          strokeWidth={0.7}
          strokeLinecap="round"
          strokeDasharray="4 3"
        />
        <path
          d="M200 125 C200 133 195 140 190 145"
          stroke={LAVENDER}
          strokeWidth={0.5}
          strokeLinecap="round"
          strokeDasharray="3 3"
        />
        {/* Cross-element arcs */}
        <path
          d="M55 115 C100 140 150 145 175 148"
          stroke={TEAL}
          strokeWidth={0.4}
          strokeLinecap="round"
          strokeDasharray="3 4"
          opacity={0.6}
        />
        <path
          d="M350 110 C330 135 280 150 235 155"
          stroke={BLUE}
          strokeWidth={0.4}
          strokeLinecap="round"
          strokeDasharray="3 4"
          opacity={0.6}
        />
      </g>

      {/* Ambient floating dots */}
      <g opacity={0.3}>
        {[
          { x: 15, y: 25 },
          { x: 100, y: 15 },
          { x: 200, y: 8 },
          { x: 300, y: 15 },
          { x: 390, y: 30 },
          { x: 25, y: 150 },
          { x: 110, y: 165 },
          { x: 300, y: 170 },
          { x: 380, y: 145 },
          { x: 260, y: 140 },
          { x: 50, y: 130 },
        ].map((d, i) => (
          <circle key={`pd-${i}`} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
        ))}
      </g>
    </svg>
  );
}
