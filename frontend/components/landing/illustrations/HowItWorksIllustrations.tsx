const COLORS = {
  darkGreen1: "#0d1f17",
  darkGreen2: "#142e22",
  midGreen: "#1a4d3a",
  brandGreen: "#006239",
  brightGreen: "#0ea371",
  neonGreen: "#3ecf8e",
  lightGreen: "#4ade80",
  teal: "#14b8a6",
  figureLight: "#c4d4ce",
  outline: "#2e5e48",
};

export function CreateBatchIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Floating hexagons */}
      <polygon
        points="290,10 296,13.5 296,20.5 290,24 284,20.5 284,13.5"
        fill={COLORS.midGreen}
        opacity={0.18}
      />
      <polygon
        points="25,18 30,21 30,27 25,30 20,27 20,21"
        fill={COLORS.brandGreen}
        opacity={0.15}
      />
      <polygon
        points="305,55 309,57.5 309,62.5 305,65 301,62.5 301,57.5"
        fill={COLORS.brightGreen}
        opacity={0.12}
      />

      {/* Scattered particles */}
      <circle cx={15} cy={40} r={1} fill={COLORS.neonGreen} opacity={0.3} />
      <circle
        cx={302}
        cy={35}
        r={1.2}
        fill={COLORS.brightGreen}
        opacity={0.25}
      />
      <circle cx={45} cy={8} r={0.8} fill={COLORS.teal} opacity={0.3} />
      <circle cx={270} cy={12} r={1} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={180} cy={5} r={0.8} fill={COLORS.lightGreen} opacity={0.25} />
      <circle cx={10} cy={130} r={1} fill={COLORS.teal} opacity={0.2} />
      <circle
        cx={310}
        cy={140}
        r={0.8}
        fill={COLORS.brightGreen}
        opacity={0.3}
      />
      <circle cx={95} cy={12} r={0.6} fill={COLORS.neonGreen} opacity={0.35} />

      {/* Thin connecting lines */}
      <line
        x1={20}
        y1={25}
        x2={50}
        y2={45}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />
      <line
        x1={280}
        y1={15}
        x2={260}
        y2={40}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />
      <line
        x1={305}
        y1={58}
        x2={275}
        y2={80}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />

      {/* Isometric ground platform */}
      <polygon
        points="40,120 160,95 280,120 160,145"
        fill={COLORS.darkGreen1}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      {/* Platform side left */}
      <polygon
        points="40,120 160,145 160,152 40,127"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      {/* Platform side right */}
      <polygon
        points="280,120 160,145 160,152 280,127"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.4}
        opacity={0.7}
      />

      {/* Grid lines on platform */}
      <line
        x1={80}
        y1={114}
        x2={200}
        y2={126}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={100}
        y1={108}
        x2={220}
        y2={126}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={120}
        y1={104}
        x2={240}
        y2={124}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={100}
        y1={130}
        x2={220}
        y2={110}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={80}
        y1={135}
        x2={200}
        y2={110}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />

      {/* Stepped platform left */}
      <polygon
        points="45,118 80,108 80,100 45,110"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <polygon
        points="45,110 80,100 80,92 45,102"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <polygon
        points="45,118 45,110 40,113 40,121"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.6}
      />
      <polygon
        points="45,110 45,102 40,105 40,113"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.6}
      />

      {/* Conveyor belt machine base */}
      <polygon
        points="120,105 175,92 230,105 175,118"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      {/* Machine body left face */}
      <polygon
        points="120,105 120,85 175,72 175,92"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      {/* Machine body right face */}
      <polygon
        points="175,72 230,85 230,105 175,92"
        fill={COLORS.brandGreen}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      {/* Machine top */}
      <polygon
        points="120,85 175,72 230,85 175,98"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />

      {/* Conveyor belt surface lines */}
      <line
        x1={130}
        y1={88}
        x2={220}
        y2={88}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
        opacity={0.4}
      />
      <line
        x1={128}
        y1={92}
        x2={222}
        y2={92}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
        opacity={0.4}
      />
      {/* Belt rollers */}
      <ellipse
        cx={132}
        cy={90}
        rx={3}
        ry={2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
        fill={COLORS.midGreen}
      />
      <ellipse
        cx={218}
        cy={90}
        rx={3}
        ry={2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
        fill={COLORS.midGreen}
      />
      {/* Belt segments */}
      <line
        x1={145}
        y1={87}
        x2={145}
        y2={93}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <line
        x1={160}
        y1={87}
        x2={160}
        y2={93}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <line
        x1={175}
        y1={87}
        x2={175}
        y2={93}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <line
        x1={190}
        y1={87}
        x2={190}
        y2={93}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <line
        x1={205}
        y1={87}
        x2={205}
        y2={93}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.3}
      />

      {/* Battery 1 on belt */}
      <rect
        x={140}
        y={80}
        width={12}
        height={8}
        rx={1.5}
        fill={COLORS.brandGreen}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
      />
      <rect
        x={144}
        y={78}
        width={4}
        height={2.5}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.6}
      />
      {/* Battery 2 on belt */}
      <rect
        x={162}
        y={80}
        width={12}
        height={8}
        rx={1.5}
        fill={COLORS.brandGreen}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
      />
      <rect
        x={166}
        y={78}
        width={4}
        height={2.5}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.6}
      />
      {/* Battery 3 on belt */}
      <rect
        x={184}
        y={80}
        width={12}
        height={8}
        rx={1.5}
        fill={COLORS.brandGreen}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
      />
      <rect
        x={188}
        y={78}
        width={4}
        height={2.5}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.6}
      />

      {/* Floating cube with + above machine */}
      <polygon
        points="175,35 190,28 205,35 190,42"
        fill={COLORS.darkGreen2}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
      />
      <polygon
        points="175,35 190,42 190,52 175,45"
        fill={COLORS.midGreen}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
      />
      <polygon
        points="205,35 190,42 190,52 205,45"
        fill={COLORS.brandGreen}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
      />
      {/* Plus symbol */}
      <line
        x1={190}
        y1={34}
        x2={190}
        y2={44}
        stroke={COLORS.neonGreen}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={185}
        y1={39}
        x2={195}
        y2={39}
        stroke={COLORS.neonGreen}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      {/* Glow under cube */}
      <ellipse
        cx={190}
        cy={55}
        rx={12}
        ry={3}
        fill={COLORS.neonGreen}
        opacity={0.08}
      />

      {/* Machine detail: vents on left face */}
      <line
        x1={130}
        y1={80}
        x2={140}
        y2={77}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={130}
        y1={83}
        x2={140}
        y2={80}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={130}
        y1={86}
        x2={140}
        y2={83}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />

      {/* Figure 1 - operating machine (right) */}
      <circle cx={245} cy={88} r={3} fill={COLORS.figureLight} />
      <rect x={242.5} y={91} width={5} height={9} rx={1} fill={COLORS.teal} />
      <line
        x1={243.5}
        y1={100}
        x2={242}
        y2={107}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={246.5}
        y1={100}
        x2={248}
        y2={107}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={242.5}
        y1={93}
        x2={232}
        y2={90}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Control panel */}
      <rect
        x={228}
        y={86}
        width={8}
        height={6}
        rx={1}
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <circle cx={230} cy={88} r={0.8} fill={COLORS.neonGreen} opacity={0.8} />
      <circle
        cx={233}
        cy={88}
        r={0.8}
        fill={COLORS.brightGreen}
        opacity={0.6}
      />

      {/* Figure 2 - carrying battery (left) */}
      <circle cx={75} cy={85} r={3} fill={COLORS.figureLight} />
      <rect
        x={72.5}
        y={88}
        width={5}
        height={9}
        rx={1}
        fill={COLORS.brandGreen}
      />
      <line
        x1={73.5}
        y1={97}
        x2={72}
        y2={104}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={76.5}
        y1={97}
        x2={78}
        y2={104}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={77.5}
        y1={90}
        x2={84}
        y2={88}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <line
        x1={72.5}
        y1={90}
        x2={66}
        y2={88}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />
      {/* Battery being carried */}
      <rect
        x={80}
        y={85}
        width={10}
        height={6}
        rx={1}
        fill={COLORS.brandGreen}
        stroke={COLORS.neonGreen}
        strokeWidth={0.4}
      />
      <rect
        x={83}
        y={83.5}
        width={3}
        height={2}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.5}
      />

      {/* Figure 3 - on stepped platform */}
      <circle cx={62} cy={78} r={3} fill={COLORS.figureLight} />
      <rect
        x={59.5}
        y={81}
        width={5}
        height={9}
        rx={1}
        fill={COLORS.brightGreen}
        opacity={0.7}
      />
      <line
        x1={60.5}
        y1={90}
        x2={59}
        y2={96}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={63.5}
        y1={90}
        x2={65}
        y2={96}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      {/* Plant 1 from platform edge */}
      <path
        d="M55,118 Q50,108 52,98"
        stroke={COLORS.lightGreen}
        strokeWidth={0.5}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={51}
        cy={97}
        rx={3}
        ry={1.5}
        fill={COLORS.lightGreen}
        opacity={0.6}
        transform="rotate(-20 51 97)"
      />
      <path
        d="M53,105 Q48,102 46,98"
        stroke={COLORS.lightGreen}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={45}
        cy={97.5}
        rx={2.5}
        ry={1.2}
        fill={COLORS.lightGreen}
        opacity={0.5}
        transform="rotate(-40 45 97.5)"
      />
      {/* Plant 2 */}
      <path
        d="M265,118 Q268,110 266,102"
        stroke={COLORS.lightGreen}
        strokeWidth={0.5}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={266}
        cy={101}
        rx={3}
        ry={1.5}
        fill={COLORS.lightGreen}
        opacity={0.5}
        transform="rotate(15 266 101)"
      />
      {/* Plant 3 small */}
      <path
        d="M100,130 Q98,125 99,120"
        stroke={COLORS.lightGreen}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={99}
        cy={119}
        rx={2}
        ry={1}
        fill={COLORS.lightGreen}
        opacity={0.4}
        transform="rotate(-10 99 119)"
      />

      {/* Additional connecting lines */}
      <line
        x1={90}
        y1={88}
        x2={120}
        y2={88}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="2 2"
        opacity={0.15}
      />
      <line
        x1={190}
        y1={55}
        x2={190}
        y2={72}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        strokeDasharray="2 2"
        opacity={0.2}
      />
    </svg>
  );
}

export function GeneratePassportsIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Floating geometric diamonds */}
      <polygon
        points="285,15 291,22 285,29 279,22"
        fill={COLORS.midGreen}
        opacity={0.18}
        stroke={COLORS.outline}
        strokeWidth={0.3}
      />
      <polygon
        points="20,25 25,30 20,35 15,30"
        fill={COLORS.brandGreen}
        opacity={0.15}
      />
      <polygon
        points="300,60 304,65 300,70 296,65"
        fill={COLORS.brightGreen}
        opacity={0.12}
      />
      <polygon
        points="40,50 43,54 40,58 37,54"
        fill={COLORS.neonGreen}
        opacity={0.1}
      />

      {/* Scattered particles */}
      <circle cx={12} cy={45} r={1} fill={COLORS.neonGreen} opacity={0.3} />
      <circle
        cx={308}
        cy={30}
        r={1.2}
        fill={COLORS.brightGreen}
        opacity={0.25}
      />
      <circle cx={50} cy={10} r={0.8} fill={COLORS.teal} opacity={0.3} />
      <circle cx={265} cy={8} r={1} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={155} cy={3} r={0.8} fill={COLORS.lightGreen} opacity={0.25} />
      <circle cx={8} cy={135} r={1} fill={COLORS.teal} opacity={0.2} />
      <circle
        cx={312}
        cy={145}
        r={0.8}
        fill={COLORS.brightGreen}
        opacity={0.3}
      />
      <circle cx={180} cy={155} r={0.7} fill={COLORS.neonGreen} opacity={0.2} />

      {/* Thin connecting lines */}
      <line
        x1={18}
        y1={30}
        x2={45}
        y2={55}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />
      <line
        x1={285}
        y1={22}
        x2={270}
        y2={45}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />
      <line
        x1={298}
        y1={65}
        x2={280}
        y2={80}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />

      {/* Isometric ground platform */}
      <polygon
        points="35,125 160,100 285,125 160,150"
        fill={COLORS.darkGreen1}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      <polygon
        points="35,125 160,150 160,157 35,132"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <polygon
        points="285,125 160,150 160,157 285,132"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.4}
        opacity={0.7}
      />

      {/* Grid lines on platform */}
      <line
        x1={75}
        y1={119}
        x2={195}
        y2={131}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={95}
        y1={113}
        x2={215}
        y2={131}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={115}
        y1={108}
        x2={245}
        y2={128}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={95}
        y1={135}
        x2={225}
        y2={113}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />

      {/* Elevated platform with stairs (right) */}
      <polygon
        points="230,120 270,110 285,118 245,128"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <polygon
        points="230,120 230,112 270,102 270,110"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <polygon
        points="270,102 285,110 285,118 270,110"
        fill={COLORS.brandGreen}
        stroke={COLORS.outline}
        strokeWidth={0.5}
        opacity={0.8}
      />
      {/* Stair lines */}
      <line
        x1={235}
        y1={118}
        x2={235}
        y2={114}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <line
        x1={235}
        y1={114}
        x2={242}
        y2={111}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <line
        x1={242}
        y1={111}
        x2={242}
        y2={107}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <line
        x1={242}
        y1={107}
        x2={250}
        y2={104}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />

      {/* Holographic display table */}
      <polygon
        points="130,118 170,108 210,118 170,128"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <rect
        x={167}
        y={90}
        width={6}
        height={18}
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <ellipse
        cx={170}
        cy={90}
        rx={10}
        ry={3}
        fill={COLORS.brandGreen}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
      />

      {/* Holographic passport card */}
      <rect
        x={135}
        y={35}
        width={70}
        height={45}
        rx={4}
        fill="#0d1f17"
        stroke={COLORS.neonGreen}
        strokeWidth={0.8}
      />
      <rect
        x={139}
        y={39}
        width={62}
        height={37}
        rx={2.5}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.4}
        fill="none"
      />

      {/* QR code grid */}
      <rect
        x={143}
        y={43}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.6}
      />
      <rect
        x={149}
        y={43}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.5}
      />
      <rect
        x={155}
        y={43}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.4}
      />
      <rect
        x={143}
        y={49}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.4}
      />
      <rect
        x={149}
        y={49}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.brightGreen}
        opacity={0.3}
      />
      <rect
        x={155}
        y={49}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.5}
      />
      <rect
        x={143}
        y={55}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.5}
      />
      <rect
        x={149}
        y={55}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.brightGreen}
        opacity={0.4}
      />
      <rect
        x={155}
        y={55}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.3}
      />
      <rect
        x={143}
        y={61}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.4}
      />
      <rect
        x={149}
        y={61}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.6}
      />
      <rect
        x={155}
        y={61}
        width={4}
        height={4}
        rx={0.5}
        fill={COLORS.brightGreen}
        opacity={0.3}
      />

      {/* Passport text lines */}
      <line
        x1={165}
        y1={47}
        x2={195}
        y2={47}
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
        opacity={0.5}
      />
      <line
        x1={165}
        y1={53}
        x2={190}
        y2={53}
        stroke={COLORS.neonGreen}
        strokeWidth={0.4}
        opacity={0.35}
      />
      <line
        x1={165}
        y1={59}
        x2={193}
        y2={59}
        stroke={COLORS.neonGreen}
        strokeWidth={0.4}
        opacity={0.35}
      />
      <line
        x1={165}
        y1={65}
        x2={185}
        y2={65}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <line
        x1={165}
        y1={71}
        x2={192}
        y2={71}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.3}
      />

      {/* Data particles emanating upward */}
      <circle cx={150} cy={28} r={1} fill={COLORS.neonGreen} opacity={0.5} />
      <circle cx={165} cy={22} r={0.8} fill={COLORS.neonGreen} opacity={0.4} />
      <circle
        cx={175}
        cy={25}
        r={1.2}
        fill={COLORS.brightGreen}
        opacity={0.35}
      />
      <circle cx={185} cy={18} r={0.7} fill={COLORS.neonGreen} opacity={0.45} />
      <circle cx={155} cy={15} r={0.6} fill={COLORS.lightGreen} opacity={0.3} />
      <circle cx={190} cy={30} r={0.9} fill={COLORS.teal} opacity={0.3} />
      <line
        x1={152}
        y1={35}
        x2={150}
        y2={28}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <line
        x1={170}
        y1={35}
        x2={165}
        y2={22}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.25}
      />
      <line
        x1={180}
        y1={35}
        x2={185}
        y2={18}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.2}
      />

      {/* Hologram glow */}
      <ellipse
        cx={170}
        cy={82}
        rx={25}
        ry={5}
        fill={COLORS.neonGreen}
        opacity={0.06}
      />

      {/* Console (left side) */}
      <rect
        x={60}
        y={105}
        width={25}
        height={15}
        rx={2}
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <rect
        x={63}
        y={102}
        width={19}
        height={5}
        rx={1}
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <rect
        x={65}
        y={103}
        width={15}
        height={3}
        rx={0.5}
        fill={COLORS.brandGreen}
        opacity={0.5}
      />
      <circle
        cx={68}
        cy={104.5}
        r={0.5}
        fill={COLORS.neonGreen}
        opacity={0.8}
      />
      <circle
        cx={71}
        cy={104.5}
        r={0.5}
        fill={COLORS.brightGreen}
        opacity={0.6}
      />
      <circle cx={74} cy={104.5} r={0.5} fill={COLORS.teal} opacity={0.5} />

      {/* Figure 1 - standing, pointing */}
      <circle cx={115} cy={90} r={3} fill={COLORS.figureLight} />
      <rect x={112.5} y={93} width={5} height={9} rx={1} fill={COLORS.teal} />
      <line
        x1={113.5}
        y1={102}
        x2={112}
        y2={110}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={116.5}
        y1={102}
        x2={118}
        y2={110}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={117.5}
        y1={95}
        x2={133}
        y2={60}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Figure 2 - sitting at console */}
      <circle cx={72} cy={92} r={3} fill={COLORS.figureLight} />
      <rect
        x={69.5}
        y={95}
        width={5}
        height={8}
        rx={1}
        fill={COLORS.brandGreen}
      />
      <line
        x1={70.5}
        y1={103}
        x2={68}
        y2={108}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={73.5}
        y1={103}
        x2={76}
        y2={108}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={69.5}
        y1={97}
        x2={63}
        y2={103}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <line
        x1={74.5}
        y1={97}
        x2={80}
        y2={103}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Plant near stairs */}
      <path
        d="M255,115 Q252,108 254,100"
        stroke={COLORS.lightGreen}
        strokeWidth={0.5}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={253.5}
        cy={99}
        rx={3}
        ry={1.5}
        fill={COLORS.lightGreen}
        opacity={0.6}
        transform="rotate(-15 253.5 99)"
      />
      <path
        d="M256,107 Q259,104 258,99"
        stroke={COLORS.lightGreen}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={258}
        cy={98.5}
        rx={2.5}
        ry={1.2}
        fill={COLORS.lightGreen}
        opacity={0.45}
        transform="rotate(20 258 98.5)"
      />

      {/* Connecting lines */}
      <line
        x1={85}
        y1={105}
        x2={130}
        y2={105}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="2 2"
        opacity={0.12}
      />
      <line
        x1={170}
        y1={83}
        x2={170}
        y2={35}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        strokeDasharray="1 2"
        opacity={0.15}
      />
    </svg>
  );
}

export function TrackLifecycleIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Floating circular particles */}
      <circle
        cx={290}
        cy={15}
        r={5}
        stroke={COLORS.midGreen}
        strokeWidth={0.5}
        fill="none"
        opacity={0.18}
      />
      <circle
        cx={20}
        cy={20}
        r={4}
        stroke={COLORS.brandGreen}
        strokeWidth={0.4}
        fill="none"
        opacity={0.15}
      />
      <circle
        cx={305}
        cy={45}
        r={3}
        stroke={COLORS.brightGreen}
        strokeWidth={0.4}
        fill="none"
        opacity={0.12}
      />
      <circle
        cx={15}
        cy={60}
        r={3.5}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        fill="none"
        opacity={0.1}
      />

      {/* Scattered particles */}
      <circle cx={10} cy={35} r={1} fill={COLORS.neonGreen} opacity={0.3} />
      <circle
        cx={300}
        cy={28}
        r={1.2}
        fill={COLORS.brightGreen}
        opacity={0.25}
      />
      <circle cx={55} cy={8} r={0.8} fill={COLORS.teal} opacity={0.3} />
      <circle cx={260} cy={10} r={1} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={170} cy={5} r={0.8} fill={COLORS.lightGreen} opacity={0.25} />
      <circle cx={5} cy={140} r={1} fill={COLORS.teal} opacity={0.2} />
      <circle
        cx={315}
        cy={150}
        r={0.8}
        fill={COLORS.brightGreen}
        opacity={0.3}
      />

      {/* Thin connecting lines */}
      <line
        x1={22}
        y1={22}
        x2={50}
        y2={40}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />
      <line
        x1={288}
        y1={18}
        x2={270}
        y2={40}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />

      {/* Isometric ground platform */}
      <polygon
        points="25,125 160,98 295,125 160,152"
        fill={COLORS.darkGreen1}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      <polygon
        points="25,125 160,152 160,158 25,131"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <polygon
        points="295,125 160,152 160,158 295,131"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.4}
        opacity={0.7}
      />

      {/* Grid lines on platform */}
      <line
        x1={65}
        y1={119}
        x2={195}
        y2={133}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={95}
        y1={112}
        x2={225}
        y2={130}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={125}
        y1={106}
        x2={255}
        y2={127}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={85}
        y1={138}
        x2={235}
        y2={114}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />

      {/* Winding isometric pathway */}
      <path
        d="M45,120 Q80,105 110,112 Q140,120 170,108 Q200,96 230,108 Q260,118 280,112"
        stroke={COLORS.neonGreen}
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M45,126 Q80,111 110,118 Q140,126 170,114 Q200,102 230,114 Q260,124 280,118"
        stroke={COLORS.neonGreen}
        strokeWidth={0.5}
        fill="none"
        strokeLinecap="round"
        opacity={0.3}
      />
      <path
        d="M45,120 Q80,105 110,112 Q140,120 170,108 Q200,96 230,108 Q260,118 280,112 L280,118 Q260,124 230,114 Q200,102 170,114 Q140,126 110,118 Q80,111 45,126 Z"
        fill={COLORS.brandGreen}
        opacity={0.15}
      />

      {/* Waypoint 1 */}
      <circle
        cx={80}
        cy={110}
        r={6}
        stroke={COLORS.neonGreen}
        strokeWidth={0.6}
        fill={COLORS.darkGreen2}
      />
      <circle cx={80} cy={110} r={2} fill={COLORS.neonGreen} opacity={0.7} />
      {/* Waypoint 2 */}
      <circle
        cx={170}
        cy={108}
        r={6}
        stroke={COLORS.neonGreen}
        strokeWidth={0.6}
        fill={COLORS.darkGreen2}
      />
      <circle cx={170} cy={108} r={2} fill={COLORS.brightGreen} opacity={0.7} />
      {/* Waypoint 3 */}
      <circle
        cx={255}
        cy={112}
        r={6}
        stroke={COLORS.neonGreen}
        strokeWidth={0.6}
        fill={COLORS.darkGreen2}
      />
      <circle cx={255} cy={112} r={2} fill={COLORS.teal} opacity={0.7} />

      {/* Battery icon on path */}
      <rect
        x={118}
        y={108}
        width={14}
        height={9}
        rx={2}
        fill={COLORS.brandGreen}
        stroke={COLORS.neonGreen}
        strokeWidth={0.6}
      />
      <rect
        x={123}
        y={106}
        width={4}
        height={2.5}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.7}
      />
      <rect
        x={120}
        y={112}
        width={8}
        height={2.5}
        rx={0.5}
        fill={COLORS.neonGreen}
        opacity={0.4}
      />

      {/* Dashboard/monitor on stand */}
      <rect
        x={268}
        y={75}
        width={3}
        height={22}
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <ellipse
        cx={269.5}
        cy={97}
        rx={8}
        ry={2}
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.3}
      />
      <rect
        x={255}
        y={50}
        width={30}
        height={26}
        rx={2}
        fill={COLORS.darkGreen1}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      <rect
        x={258}
        y={53}
        width={24}
        height={20}
        rx={1}
        fill={COLORS.darkGreen2}
        opacity={0.8}
      />
      {/* Timeline graph on screen */}
      <line
        x1={260}
        y1={68}
        x2={280}
        y2={68}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.5}
      />
      <line
        x1={260}
        y1={56}
        x2={260}
        y2={70}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.5}
      />
      <path
        d="M262,66 L267,60 L272,63 L277,57"
        stroke={COLORS.neonGreen}
        strokeWidth={0.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={262} cy={66} r={1} fill={COLORS.neonGreen} opacity={0.7} />
      <circle cx={267} cy={60} r={1} fill={COLORS.brightGreen} opacity={0.6} />
      <circle cx={272} cy={63} r={1} fill={COLORS.neonGreen} opacity={0.7} />
      <circle cx={277} cy={57} r={1} fill={COLORS.teal} opacity={0.6} />

      {/* Figure 1 - walking the path */}
      <circle cx={150} cy={88} r={3} fill={COLORS.figureLight} />
      <rect x={147.5} y={91} width={5} height={9} rx={1} fill={COLORS.teal} />
      <line
        x1={148.5}
        y1={100}
        x2={146}
        y2={107}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={151.5}
        y1={100}
        x2={154}
        y2={107}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={147.5}
        y1={93}
        x2={143}
        y2={97}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <line
        x1={152.5}
        y1={93}
        x2={157}
        y2={97}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Figure 2 - at dashboard */}
      <circle cx={285} cy={65} r={3} fill={COLORS.figureLight} />
      <rect
        x={282.5}
        y={68}
        width={5}
        height={9}
        rx={1}
        fill={COLORS.brandGreen}
      />
      <line
        x1={283.5}
        y1={77}
        x2={282}
        y2={84}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={286.5}
        y1={77}
        x2={288}
        y2={84}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={282.5}
        y1={70}
        x2={278}
        y2={65}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Organic vine 1 - left */}
      <path
        d="M50,122 Q55,115 52,108 Q49,102 53,95"
        stroke={COLORS.lightGreen}
        strokeWidth={0.5}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={53}
        cy={94}
        rx={3}
        ry={1.5}
        fill={COLORS.lightGreen}
        opacity={0.6}
        transform="rotate(-25 53 94)"
      />
      <path
        d="M55,118 Q58,112 56,107"
        stroke={COLORS.lightGreen}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={55.5}
        cy={106}
        rx={2.5}
        ry={1.2}
        fill={COLORS.lightGreen}
        opacity={0.5}
        transform="rotate(30 55.5 106)"
      />
      {/* Vine 2 - middle */}
      <path
        d="M195,108 Q192,102 195,95"
        stroke={COLORS.lightGreen}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={195}
        cy={94}
        rx={2.5}
        ry={1.2}
        fill={COLORS.lightGreen}
        opacity={0.5}
        transform="rotate(-10 195 94)"
      />
      {/* Vine 3 - right */}
      <path
        d="M240,118 Q243,112 240,105"
        stroke={COLORS.lightGreen}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={240}
        cy={104}
        rx={2}
        ry={1}
        fill={COLORS.lightGreen}
        opacity={0.45}
        transform="rotate(15 240 104)"
      />

      {/* Connecting lines from waypoints */}
      <line
        x1={80}
        y1={104}
        x2={80}
        y2={95}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        strokeDasharray="1 2"
        opacity={0.2}
      />
      <line
        x1={170}
        y1={102}
        x2={170}
        y2={93}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        strokeDasharray="1 2"
        opacity={0.2}
      />
      <line
        x1={255}
        y1={106}
        x2={260}
        y2={76}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        strokeDasharray="1 2"
        opacity={0.15}
      />
    </svg>
  );
}

export function ExportCompliantIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Floating hexagonal nodes with connecting lines */}
      <polygon
        points="280,12 286,15.5 286,22.5 280,26 274,22.5 274,15.5"
        fill={COLORS.midGreen}
        opacity={0.18}
      />
      <polygon
        points="305,40 310,43 310,49 305,52 300,49 300,43"
        fill={COLORS.brandGreen}
        opacity={0.15}
      />
      <line
        x1={283}
        y1={22}
        x2={302}
        y2={42}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />
      <polygon
        points="18,20 23,23 23,29 18,32 13,29 13,23"
        fill={COLORS.brightGreen}
        opacity={0.12}
      />
      <polygon
        points="35,50 39,52.5 39,57.5 35,60 31,57.5 31,52.5"
        fill={COLORS.neonGreen}
        opacity={0.1}
      />
      <line
        x1={20}
        y1={30}
        x2={33}
        y2={50}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />

      {/* Scattered particles */}
      <circle cx={8} cy={50} r={1} fill={COLORS.neonGreen} opacity={0.3} />
      <circle
        cx={312}
        cy={60}
        r={1.2}
        fill={COLORS.brightGreen}
        opacity={0.25}
      />
      <circle cx={60} cy={6} r={0.8} fill={COLORS.teal} opacity={0.3} />
      <circle cx={240} cy={5} r={1} fill={COLORS.neonGreen} opacity={0.2} />
      <circle cx={160} cy={3} r={0.8} fill={COLORS.lightGreen} opacity={0.25} />
      <circle cx={5} cy={145} r={1} fill={COLORS.teal} opacity={0.2} />
      <circle
        cx={315}
        cy={148}
        r={0.8}
        fill={COLORS.brightGreen}
        opacity={0.3}
      />

      {/* Thin connecting lines */}
      <line
        x1={35}
        y1={55}
        x2={65}
        y2={70}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.1}
      />

      {/* Isometric dock platform */}
      <polygon
        points="30,128 160,102 290,128 160,154"
        fill={COLORS.darkGreen1}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      <polygon
        points="30,128 160,154 160,160 30,134"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <polygon
        points="290,128 160,154 160,160 290,134"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.4}
        opacity={0.7}
      />

      {/* Grid lines on platform */}
      <line
        x1={70}
        y1={122}
        x2={200}
        y2={136}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={100}
        y1={115}
        x2={230}
        y2={133}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={130}
        y1={108}
        x2={260}
        y2={130}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />
      <line
        x1={80}
        y1={140}
        x2={240}
        y2={116}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="3 3"
        opacity={0.1}
      />

      {/* Stepped dock platform */}
      <polygon
        points="200,124 240,114 265,124 225,134"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <polygon
        points="200,124 200,118 240,108 240,114"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.5}
      />
      <polygon
        points="240,108 265,118 265,124 240,114"
        fill={COLORS.brandGreen}
        stroke={COLORS.outline}
        strokeWidth={0.5}
        opacity={0.8}
      />

      {/* Shipping container (isometric box) */}
      <polygon
        points="185,75 220,62 255,75 220,88"
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      <polygon
        points="185,75 220,88 220,108 185,95"
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      <polygon
        points="255,75 220,88 220,108 255,95"
        fill={COLORS.brandGreen}
        stroke={COLORS.outline}
        strokeWidth={0.6}
      />
      {/* Container ridges left */}
      <line
        x1={192}
        y1={78}
        x2={192}
        y2={98}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={199}
        y1={81}
        x2={199}
        y2={101}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={206}
        y1={84}
        x2={206}
        y2={104}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={213}
        y1={87}
        x2={213}
        y2={107}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      {/* Container ridges right */}
      <line
        x1={227}
        y1={87}
        x2={227}
        y2={107}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={234}
        y1={84}
        x2={234}
        y2={104}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={241}
        y1={81}
        x2={241}
        y2={101}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={248}
        y1={78}
        x2={248}
        y2={98}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        opacity={0.4}
      />

      {/* Checkmark shield above container */}
      <path
        d="M220,28 L232,32 L232,45 Q232,55 220,60 Q208,55 208,45 L208,32 Z"
        fill={COLORS.darkGreen2}
        stroke={COLORS.neonGreen}
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      <path
        d="M213,43 L218,48 L228,38"
        stroke={COLORS.neonGreen}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse
        cx={220}
        cy={65}
        rx={15}
        ry={3}
        fill={COLORS.neonGreen}
        opacity={0.06}
      />

      {/* Globe wireframe */}
      <circle
        cx={70}
        cy={75}
        r={22}
        stroke={COLORS.outline}
        strokeWidth={0.6}
        fill={COLORS.darkGreen1}
      />
      <ellipse
        cx={70}
        cy={65}
        rx={18}
        ry={4}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        fill="none"
        opacity={0.4}
      />
      <ellipse
        cx={70}
        cy={75}
        rx={22}
        ry={6}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        fill="none"
        opacity={0.4}
      />
      <ellipse
        cx={70}
        cy={85}
        rx={18}
        ry={4}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        fill="none"
        opacity={0.4}
      />
      <ellipse
        cx={70}
        cy={75}
        rx={8}
        ry={22}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        fill="none"
        opacity={0.4}
      />
      <ellipse
        cx={70}
        cy={75}
        rx={16}
        ry={22}
        stroke={COLORS.outline}
        strokeWidth={0.3}
        fill="none"
        opacity={0.4}
      />
      <circle
        cx={70}
        cy={75}
        r={22}
        stroke={COLORS.neonGreen}
        strokeWidth={0.4}
        fill="none"
        opacity={0.3}
      />
      {/* Continent hints */}
      <path
        d="M58,68 Q62,65 66,67 Q70,70 65,72"
        stroke={COLORS.brightGreen}
        strokeWidth={0.5}
        fill={COLORS.brightGreen}
        opacity={0.2}
      />
      <path
        d="M75,70 Q80,68 82,72 Q78,76 75,74"
        stroke={COLORS.brightGreen}
        strokeWidth={0.5}
        fill={COLORS.brightGreen}
        opacity={0.2}
      />

      {/* Floating documents */}
      <rect
        x={115}
        y={55}
        width={18}
        height={24}
        rx={1.5}
        fill={COLORS.darkGreen1}
        stroke={COLORS.neonGreen}
        strokeWidth={0.4}
        transform="rotate(-8 124 67)"
      />
      <line
        x1={119}
        y1={62}
        x2={129}
        y2={60}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={119}
        y1={66}
        x2={128}
        y2={64}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <line
        x1={119}
        y1={70}
        x2={127}
        y2={68}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <rect
        x={138}
        y={48}
        width={16}
        height={22}
        rx={1.5}
        fill={COLORS.darkGreen1}
        stroke={COLORS.brightGreen}
        strokeWidth={0.4}
        transform="rotate(5 146 59)"
      />
      <line
        x1={141}
        y1={55}
        x2={151}
        y2={55.5}
        stroke={COLORS.brightGreen}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={141}
        y1={59}
        x2={150}
        y2={59.5}
        stroke={COLORS.brightGreen}
        strokeWidth={0.3}
        opacity={0.3}
      />
      <rect
        x={155}
        y={60}
        width={14}
        height={18}
        rx={1}
        fill={COLORS.darkGreen1}
        stroke={COLORS.teal}
        strokeWidth={0.3}
        transform="rotate(-3 162 69)"
      />
      <line
        x1={158}
        y1={66}
        x2={166}
        y2={65.5}
        stroke={COLORS.teal}
        strokeWidth={0.3}
        opacity={0.3}
      />

      {/* Figure 1 - loading container */}
      <circle cx={195} cy={92} r={3} fill={COLORS.figureLight} />
      <rect x={192.5} y={95} width={5} height={9} rx={1} fill={COLORS.teal} />
      <line
        x1={193.5}
        y1={104}
        x2={192}
        y2={112}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={196.5}
        y1={104}
        x2={198}
        y2={112}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={197.5}
        y1={97}
        x2={205}
        y2={94}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <line
        x1={192.5}
        y1={97}
        x2={188}
        y2={100}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* Figure 2 - with clipboard */}
      <circle cx={105} cy={88} r={3} fill={COLORS.figureLight} />
      <rect
        x={102.5}
        y={91}
        width={5}
        height={9}
        rx={1}
        fill={COLORS.brandGreen}
      />
      <line
        x1={103.5}
        y1={100}
        x2={102}
        y2={108}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={106.5}
        y1={100}
        x2={108}
        y2={108}
        stroke={COLORS.figureLight}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={107.5}
        y1={93}
        x2={114}
        y2={90}
        stroke={COLORS.figureLight}
        strokeWidth={1}
        strokeLinecap="round"
      />
      {/* Clipboard */}
      <rect
        x={112}
        y={86}
        width={8}
        height={10}
        rx={1}
        fill={COLORS.darkGreen2}
        stroke={COLORS.outline}
        strokeWidth={0.4}
      />
      <rect
        x={114}
        y={84}
        width={4}
        height={3}
        rx={0.5}
        fill={COLORS.midGreen}
        stroke={COLORS.outline}
        strokeWidth={0.3}
      />
      <line
        x1={114}
        y1={89}
        x2={118}
        y2={89}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.5}
      />
      <line
        x1={114}
        y1={91.5}
        x2={117}
        y2={91.5}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.4}
      />
      <line
        x1={114}
        y1={94}
        x2={118}
        y2={94}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        opacity={0.4}
      />

      {/* Plants near dock edge */}
      <path
        d="M275,125 Q278,118 276,110"
        stroke={COLORS.lightGreen}
        strokeWidth={0.5}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={275.5}
        cy={109}
        rx={3}
        ry={1.5}
        fill={COLORS.lightGreen}
        opacity={0.6}
        transform="rotate(-20 275.5 109)"
      />
      <path
        d="M278,120 Q281,115 279,108"
        stroke={COLORS.lightGreen}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={279}
        cy={107.5}
        rx={2.5}
        ry={1.2}
        fill={COLORS.lightGreen}
        opacity={0.45}
        transform="rotate(25 279 107.5)"
      />
      <path
        d="M45,130 Q42,125 44,120"
        stroke={COLORS.lightGreen}
        strokeWidth={0.4}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse
        cx={44}
        cy={119}
        rx={2}
        ry={1}
        fill={COLORS.lightGreen}
        opacity={0.4}
        transform="rotate(-10 44 119)"
      />

      {/* Flow lines */}
      <path
        d="M92,72 Q105,65 115,62"
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="2 2"
        opacity={0.15}
      />
      <path
        d="M170,65 Q180,68 185,75"
        stroke={COLORS.outline}
        strokeWidth={0.3}
        strokeDasharray="2 2"
        opacity={0.15}
      />
      <line
        x1={220}
        y1={60}
        x2={220}
        y2={62}
        stroke={COLORS.neonGreen}
        strokeWidth={0.3}
        strokeDasharray="1 2"
        opacity={0.2}
      />
    </svg>
  );
}
