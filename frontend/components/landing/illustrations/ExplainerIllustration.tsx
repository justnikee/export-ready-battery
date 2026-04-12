const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function ExplainerIllustration({ className }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 500 350"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 >
 {/* Subtle floor grid */}
 <g opacity={0.1}>
 {[290, 310, 330, 350].map((y, i) => (
 <line
 key={`fg-${i}`}
 x1={40}
 y1={y}
 x2={460}
 y2={y}
 stroke={BLUE}
 strokeWidth={0.5}
 />
 ))}
 {Array.from({ length: 12 }).map((_, i) => (
 <line
 key={`fv-${i}`}
 x1={80 + i * 35}
 y1={280}
 x2={60 + i * 35}
 y2={350}
 stroke={BLUE}
 strokeWidth={0.4}
 />
 ))}
 </g>

 {/* Person silhouette — left side, pointing */}
 <g opacity={0.6}>
 {/* Head */}
 <circle cx={120} cy={155} r={14} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 {/* Body */}
 <line x1={120} y1={169} x2={120} y2={230} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 {/* Legs */}
 <line x1={120} y1={230} x2={108} y2={275} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 <line x1={120} y1={230} x2={132} y2={275} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 {/* Left arm (down) */}
 <line x1={120} y1={190} x2={105} y2={215} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 {/* Right arm (pointing at screen) */}
 <line x1={120} y1={190} x2={160} y2={175} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 {/* Pointing hand dot */}
 <circle cx={162} cy={174} r={2} fill={LAVENDER} opacity={0.6} />
 </g>

 {/* Large monitor / dashboard screen */}
 <g>
 {/* Monitor frame */}
 <rect
 x={190}
 y={70}
 width={270}
 height={190}
 rx={8}
 stroke={BLUE}
 strokeWidth={1.5}
 strokeLinecap="round"
 fill={`${BLUE}08`}
 />
 {/* Monitor stand */}
 <line x1={325} y1={260} x2={325} y2={285} stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
 <path d="M295 285 Q325 280 355 285" stroke={BLUE} strokeWidth={1} strokeLinecap="round" />

 {/* Screen header bar */}
 <line x1={200} y1={95} x2={450} y2={95} stroke={BLUE} strokeWidth={0.5} opacity={0.4} />
 <circle cx={210} cy={83} r={3.5} stroke={CYAN} strokeWidth={0.7} />
 <circle cx={222} cy={83} r={3.5} stroke={TEAL} strokeWidth={0.7} />
 <circle cx={234} cy={83} r={3.5} stroke={LAVENDER} strokeWidth={0.7} />

 {/* Dashboard: bar chart */}
 <g>
 <rect x={210} y={190} width={20} height={52} rx={2} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}12`} />
 <rect x={238} y={165} width={20} height={77} rx={2} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}10`} />
 <rect x={266} y={180} width={20} height={62} rx={2} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}12`} />
 <rect x={294} y={150} width={20} height={92} rx={2} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}08`} />
 {/* Chart baseline */}
 <line x1={205} y1={242} x2={320} y2={242} stroke={BLUE} strokeWidth={0.5} opacity={0.3} />
 </g>

 {/* Dashboard: compliance checkmarks */}
 <g>
 <circle cx={355} cy={120} r={10} stroke={TEAL} strokeWidth={0.8} />
 <path d="M350 120 L354 124 L361 116" stroke={TEAL} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
 <circle cx={395} cy={120} r={10} stroke={TEAL} strokeWidth={0.8} />
 <path d="M390 120 L394 124 L401 116" stroke={TEAL} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
 <circle cx={435} cy={120} r={10} stroke={LAVENDER} strokeWidth={0.8} />
 <line x1={430} y1={120} x2={440} y2={120} stroke={LAVENDER} strokeWidth={0.8} strokeLinecap="round" />
 </g>

 {/* Dashboard: battery with percentage */}
 <g>
 <rect x={345} y={150} width={45} height={28} rx={4} stroke={BLUE} strokeWidth={0.8} />
 <rect x={390} y={158} width={5} height={12} rx={1.5} stroke={BLUE} strokeWidth={0.7} />
 {/* Fill inside battery */}
 <rect x={349} y={154} width={30} height={20} rx={2} fill={TEAL} opacity={0.2} />
 {/* Percentage text */}
 <text x={415} y={170} fontSize={10} fill={BLUE} opacity={0.5} fontFamily="monospace">87%</text>
 </g>

 {/* Dashboard: mini line chart */}
 <path
 d="M345 200 Q360 190 375 195 Q390 200 405 188 L425 192 Q440 185 450 190"
 stroke={TEAL}
 strokeWidth={0.8}
 strokeLinecap="round"
 />
 {/* Data points on line chart */}
 <circle cx={345} cy={200} r={1.5} fill={TEAL} />
 <circle cx={375} cy={195} r={1.5} fill={TEAL} />
 <circle cx={405} cy={188} r={1.5} fill={TEAL} />
 <circle cx={440} cy={186} r={1.5} fill={TEAL} />

 {/* Dashboard: status lines */}
 <line x1={345} y1={218} x2={440} y2={218} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={345} y1={228} x2={420} y2={228} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={345} y1={238} x2={435} y2={238} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 </g>

 {/* Floating data cards orbiting the screen */}
 <g opacity={0.4}>
 {/* Card top-left */}
 <rect x={165} y={45} width={50} height={35} rx={4} stroke={LAVENDER} strokeWidth={0.8} />
 <line x1={172} y1={56} x2={202} y2={56} stroke={LAVENDER} strokeWidth={0.5} />
 <line x1={172} y1={63} x2={195} y2={63} stroke={LAVENDER} strokeWidth={0.5} />
 <line x1={172} y1={70} x2={198} y2={70} stroke={LAVENDER} strokeWidth={0.5} />

 {/* Card top-right */}
 <rect x={440} y={35} width={45} height={40} rx={4} stroke={PURPLE} strokeWidth={0.8} />
 <circle cx={462} cy={50} r={6} stroke={CYAN} strokeWidth={0.6} />
 <line x1={449} y1={64} x2={476} y2={64} stroke={PURPLE} strokeWidth={0.5} />

 {/* Card bottom-right */}
 <rect x={470} y={200} width={28} height={38} rx={3} stroke={CYAN} strokeWidth={0.7} />
 <line x1={475} y1={212} x2={493} y2={212} stroke={CYAN} strokeWidth={0.4} />
 <line x1={475} y1={220} x2={490} y2={220} stroke={CYAN} strokeWidth={0.4} />
 <line x1={475} y1={228} x2={492} y2={228} stroke={CYAN} strokeWidth={0.4} />
 </g>

 {/* Connection lines from person to screen */}
 <g opacity={0.2}>
 <path
 d="M162 174 C180 170 185 160 195 155"
 stroke={CYAN}
 strokeWidth={0.7}
 strokeLinecap="round"
 strokeDasharray="3 3"
 />
 </g>

 {/* Ambient floating dots */}
 <g opacity={0.3}>
 {[
 { x: 50, y: 60, r: 1.5 },
 { x: 80, y: 120, r: 1 },
 { x: 30, y: 200, r: 2 },
 { x: 470, y: 140, r: 1.5 },
 { x: 490, y: 260, r: 1 },
 { x: 150, y: 310, r: 1.5 },
 { x: 400, y: 300, r: 1 },
 { x: 250, y: 30, r: 1.5 },
 { x: 350, y: 20, r: 1 },
 { x: 60, y: 290, r: 1 },
 ].map((p, i) => (
 <circle key={`d-${i}`} cx={p.x} cy={p.y} r={p.r} fill={PURPLE} />
 ))}
 </g>

 {/* Thin connecting lines */}
 <g opacity={0.15}>
 <line x1={165} y1={62} x2={190} y2={83} stroke={LAVENDER} strokeWidth={0.5} strokeLinecap="round" />
 <line x1={462} y1={75} x2={455} y2={95} stroke={PURPLE} strokeWidth={0.5} strokeLinecap="round" />
 <line x1={484} y1={238} x2={460} y2={255} stroke={CYAN} strokeWidth={0.5} strokeLinecap="round" />
 </g>
 </svg>
 );
}
