const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function PassportIllustration({ className }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 400 180"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 >
 {/* Large abstract QR code pattern — center */}
 <g>
 {/* QR outer frame */}
 <rect
 x={140}
 y={20}
 width={120}
 height={120}
 rx={4}
 stroke={BLUE}
 strokeWidth={1.2}
 strokeLinecap="round"
 fill={`${BLUE}06`}
 />

 {/* QR finder patterns (3 corners) */}
 {/* Top-left finder */}
 <rect x={150} y={30} width={24} height={24} rx={2} stroke={CYAN} strokeWidth={1} />
 <rect x={155} y={35} width={14} height={14} rx={1} fill={CYAN} opacity={0.25} />

 {/* Top-right finder */}
 <rect x={226} y={30} width={24} height={24} rx={2} stroke={CYAN} strokeWidth={1} />
 <rect x={231} y={35} width={14} height={14} rx={1} fill={CYAN} opacity={0.25} />

 {/* Bottom-left finder */}
 <rect x={150} y={106} width={24} height={24} rx={2} stroke={CYAN} strokeWidth={1} />
 <rect x={155} y={111} width={14} height={14} rx={1} fill={CYAN} opacity={0.25} />

 {/* Abstract data modules */}
 <g opacity={0.4}>
 {[
 [0, 0, 1, 0, 1, 1, 0],
 [1, 0, 0, 1, 0, 0, 1],
 [0, 1, 1, 0, 1, 0, 0],
 [1, 0, 1, 1, 0, 1, 0],
 [0, 1, 0, 0, 1, 1, 1],
 [1, 1, 0, 1, 0, 0, 0],
 [0, 0, 1, 0, 1, 0, 1],
 ].map((row, ri) =>
 row.map((cell, ci) =>
 cell && !(ri < 3 && ci < 3) && !(ri < 3 && ci > 3) && !(ri > 3 && ci < 3) ? (
 <rect
 key={`qm-${ri}-${ci}`}
 x={150 + ci * 14.5}
 y={30 + ri * 14.5}
 width={10}
 height={10}
 rx={1}
 fill={CYAN}
 opacity={0.35}
 />
 ) : null
 )
 )}
 </g>
 </g>

 {/* Battery shape with data stream lines — left */}
 <g opacity={0.55}>
 {/* Battery body */}
 <rect x={30} y={55} width={55} height={70} rx={5} stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
 {/* Battery terminal */}
 <rect x={45} y={48} width={24} height={8} rx={3} stroke={BLUE} strokeWidth={1} />
 {/* Charge bars */}
 <rect x={38} y={95} width={40} height={8} rx={1.5} fill={TEAL} opacity={0.3} />
 <rect x={38} y={83} width={40} height={8} rx={1.5} fill={TEAL} opacity={0.25} />
 <rect x={38} y={71} width={40} height={8} rx={1.5} fill={CYAN} opacity={0.15} />

 {/* Data stream lines flowing out from battery to QR */}
 <path
 d="M85 70 C100 68 115 55 140 50"
 stroke={CYAN}
 strokeWidth={0.7}
 strokeLinecap="round"
 strokeDasharray="4 3"
 />
 <path
 d="M85 85 C105 83 120 80 140 78"
 stroke={CYAN}
 strokeWidth={0.7}
 strokeLinecap="round"
 strokeDasharray="4 3"
 />
 <path
 d="M85 100 C100 100 120 105 140 108"
 stroke={CYAN}
 strokeWidth={0.7}
 strokeLinecap="round"
 strokeDasharray="4 3"
 />

 {/* Data dots along streams */}
 <circle cx={100} cy={67} r={1.5} fill={CYAN} opacity={0.6} />
 <circle cx={115} cy={82} r={1.5} fill={CYAN} opacity={0.5} />
 <circle cx={108} cy={102} r={1.5} fill={CYAN} opacity={0.5} />
 </g>

 {/* Mobile phone outline with scan lines — right */}
 <g opacity={0.55}>
 {/* Phone body */}
 <rect
 x={305}
 y={30}
 width={55}
 height={100}
 rx={8}
 stroke={BLUE}
 strokeWidth={1.2}
 strokeLinecap="round"
 />
 {/* Screen area */}
 <rect x={311} y={42} width={43} height={72} rx={2} stroke={BLUE} strokeWidth={0.5} opacity={0.3} />
 {/* Home button / notch */}
 <line x1={325} y1={35} x2={340} y2={35} stroke={BLUE} strokeWidth={0.7} strokeLinecap="round" opacity={0.4} />
 <circle cx={332} cy={124} r={3} stroke={BLUE} strokeWidth={0.5} opacity={0.3} />

 {/* Mini QR on phone screen */}
 <g opacity={0.35}>
 <rect x={318} y={55} width={28} height={28} rx={2} stroke={CYAN} strokeWidth={0.6} />
 <rect x={321} y={58} width={8} height={8} rx={1} fill={CYAN} opacity={0.3} />
 <rect x={335} y={58} width={8} height={8} rx={1} fill={CYAN} opacity={0.3} />
 <rect x={321} y={72} width={8} height={8} rx={1} fill={CYAN} opacity={0.3} />
 <rect x={331} y={68} width={4} height={4} fill={CYAN} opacity={0.2} />
 </g>

 {/* Scan status text lines */}
 <line x1={318} y1={92} x2={348} y2={92} stroke={TEAL} strokeWidth={0.4} opacity={0.4} />
 <line x1={318} y1={98} x2={340} y2={98} stroke={TEAL} strokeWidth={0.4} opacity={0.35} />
 <line x1={318} y1={104} x2={345} y2={104} stroke={TEAL} strokeWidth={0.4} opacity={0.3} />

 {/* Scan lines crossing from phone to QR code */}
 <path
 d="M305 60 C290 55 275 50 260 48"
 stroke={LAVENDER}
 strokeWidth={0.6}
 strokeLinecap="round"
 strokeDasharray="5 4"
 />
 <path
 d="M305 78 C290 78 275 78 260 78"
 stroke={LAVENDER}
 strokeWidth={0.6}
 strokeLinecap="round"
 strokeDasharray="5 4"
 />
 <path
 d="M305 95 C290 100 275 105 260 110"
 stroke={LAVENDER}
 strokeWidth={0.6}
 strokeLinecap="round"
 strokeDasharray="5 4"
 />
 </g>

 {/* Data flow arrows connecting battery → QR → phone */}
 <g opacity={0.2}>
 {/* Arrow from battery area */}
 <path d="M88 90 L130 80" stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <polygon points="128,77 135,79 129,83" fill={CYAN} opacity={0.5} />

 {/* Arrow from QR to phone */}
 <path d="M262 78 L298 78" stroke={LAVENDER} strokeWidth={0.8} strokeLinecap="round" />
 <polygon points="296,75 303,78 296,81" fill={LAVENDER} opacity={0.5} />
 </g>

 {/* Ambient floating binary-style dots */}
 <g opacity={0.3}>
 {[
 { x: 15, y: 30 },
 { x: 25, y: 145 },
 { x: 100, y: 20 },
 { x: 120, y: 160 },
 { x: 200, y: 155 },
 { x: 280, y: 20 },
 { x: 295, y: 150 },
 { x: 375, y: 15 },
 { x: 385, y: 155 },
 { x: 50, y: 25 },
 { x: 190, y: 10 },
 { x: 340, y: 160 },
 { x: 10, y: 90 },
 { x: 390, y: 85 },
 ].map((d, i) => (
 <circle key={`bd-${i}`} cx={d.x} cy={d.y} r={i % 3 === 0 ? 2 : 1.2} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}
