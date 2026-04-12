const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function CPCBIllustration({ className }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 400 180"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 >
 {/* Document / spreadsheet outline — center */}
 <g>
 {/* Main document body */}
 <rect
 x={140}
 y={15}
 width={120}
 height={110}
 rx={4}
 stroke={BLUE}
 strokeWidth={1.3}
 strokeLinecap="round"
 fill={`${BLUE}08`}
 />

 {/* Spreadsheet grid lines */}
 <g opacity={0.35}>
 {/* Horizontal grid */}
 {[35, 50, 65, 80, 95, 110].map((y, i) => (
 <line
 key={`sh-${i}`}
 x1={148}
 y1={y}
 x2={252}
 y2={y}
 stroke={BLUE}
 strokeWidth={0.4}
 />
 ))}
 {/* Vertical grid */}
 {[170, 195, 220].map((x, i) => (
 <line
 key={`sv-${i}`}
 x1={x}
 y1={25}
 x2={x}
 y2={118}
 stroke={BLUE}
 strokeWidth={0.4}
 />
 ))}
 </g>

 {/* Column header row */}
 <rect x={140} y={15} width={120} height={14} rx={4} stroke={BLUE} strokeWidth={0.5} fill={`${BLUE}08`} />
 <text x={155} y={26} fontSize={6} fontFamily="monospace" fill={BLUE} opacity={0.4}>A</text>
 <text x={180} y={26} fontSize={6} fontFamily="monospace" fill={BLUE} opacity={0.4}>B</text>
 <text x={205} y={26} fontSize={6} fontFamily="monospace" fill={BLUE} opacity={0.4}>C</text>
 <text x={230} y={26} fontSize={6} fontFamily="monospace" fill={BLUE} opacity={0.4}>D</text>

 {/* Cell content hints */}
 <g opacity={0.25}>
 <line x1={150} y1={42} x2={165} y2={42} stroke={CYAN} strokeWidth={0.5} />
 <line x1={175} y1={42} x2={192} y2={42} stroke={CYAN} strokeWidth={0.5} />
 <line x1={200} y1={42} x2={215} y2={42} stroke={CYAN} strokeWidth={0.5} />
 <line x1={150} y1={57} x2={163} y2={57} stroke={CYAN} strokeWidth={0.5} />
 <line x1={175} y1={57} x2={190} y2={57} stroke={CYAN} strokeWidth={0.5} />
 <line x1={200} y1={57} x2={218} y2={57} stroke={CYAN} strokeWidth={0.5} />
 <line x1={150} y1={72} x2={167} y2={72} stroke={CYAN} strokeWidth={0.5} />
 <line x1={175} y1={72} x2={188} y2={72} stroke={CYAN} strokeWidth={0.5} />
 <line x1={225} y1={42} x2={248} y2={42} stroke={TEAL} strokeWidth={0.5} />
 <line x1={225} y1={57} x2={245} y2={57} stroke={TEAL} strokeWidth={0.5} />
 <line x1={225} y1={72} x2={250} y2={72} stroke={TEAL} strokeWidth={0.5} />
 </g>
 </g>

 {/* Form document with signature — left */}
 <g opacity={0.5}>
 {/* Form body */}
 <rect
 x={25}
 y={25}
 width={80}
 height={100}
 rx={3}
 stroke={BLUE}
 strokeWidth={1}
 strokeLinecap="round"
 fill={`${BLUE}06`}
 />
 {/* Form header */}
 <line x1={35} y1={42} x2={95} y2={42} stroke={BLUE} strokeWidth={0.5} opacity={0.4} />
 {/* Form field lines */}
 <line x1={35} y1={55} x2={85} y2={55} stroke={LAVENDER} strokeWidth={0.4} opacity={0.3} />
 <line x1={35} y1={65} x2={90} y2={65} stroke={LAVENDER} strokeWidth={0.4} opacity={0.3} />
 <line x1={35} y1={75} x2={80} y2={75} stroke={LAVENDER} strokeWidth={0.4} opacity={0.3} />
 <line x1={35} y1={85} x2={88} y2={85} stroke={LAVENDER} strokeWidth={0.4} opacity={0.3} />

 {/* Checkbox areas */}
 <rect x={35} y={50} width={5} height={5} rx={0.5} stroke={LAVENDER} strokeWidth={0.4} />
 <rect x={35} y={60} width={5} height={5} rx={0.5} stroke={LAVENDER} strokeWidth={0.4} />
 <path d="M36 62 L37.5 64 L40 60.5" stroke={TEAL} strokeWidth={0.4} strokeLinecap="round" />
 <rect x={35} y={70} width={5} height={5} rx={0.5} stroke={LAVENDER} strokeWidth={0.4} />
 <path d="M36 72 L37.5 74 L40 70.5" stroke={TEAL} strokeWidth={0.4} strokeLinecap="round" />

 {/* Signature line */}
 <line x1={35} y1={110} x2={95} y2={110} stroke={BLUE} strokeWidth={0.5} />
 {/* Signature scribble */}
 <path
 d="M40 108 C48 100 52 108 58 104 C64 100 68 108 75 106 C80 104 85 108 90 105"
 stroke={LAVENDER}
 strokeWidth={0.6}
 strokeLinecap="round"
 />
 {/* "Sign" label */}
 <text x={55} y={120} fontSize={5} fontFamily="monospace" fill={BLUE} opacity={0.3}>sign</text>
 </g>

 {/* Cloud with upload arrow — top right */}
 <g opacity={0.5}>
 {/* Cloud shape */}
 <path
 d="M310 55 C310 40 325 30 340 35 C345 20 370 20 375 35 C390 30 400 40 395 55 C405 60 400 75 390 75 L315 75 C305 75 300 65 310 55 Z"
 stroke={CYAN}
 strokeWidth={1.1}
 strokeLinecap="round"
 fill={`${CYAN}06`}
 />
 {/* Upload arrow */}
 <line x1={352} y1={68} x2={352} y2={48} stroke={CYAN} strokeWidth={1} strokeLinecap="round" />
 <path d="M345 54 L352 46 L359 54" stroke={CYAN} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
 </g>

 {/* Horizontal flow: document → cloud → checkmark — bottom */}
 <g opacity={0.45}>
 {/* Flow line base */}
 <line x1={65} y1={150} x2={350} y2={150} stroke={BLUE} strokeWidth={0.4} opacity={0.2} />

 {/* Step 1: mini document icon */}
 <rect x={75} y={138} width={18} height={22} rx={2} stroke={BLUE} strokeWidth={0.8} />
 <line x1={79} y1={144} x2={89} y2={144} stroke={BLUE} strokeWidth={0.3} />
 <line x1={79} y1={148} x2={87} y2={148} stroke={BLUE} strokeWidth={0.3} />
 <line x1={79} y1={152} x2={90} y2={152} stroke={BLUE} strokeWidth={0.3} />

 {/* Arrow 1 */}
 <line x1={100} y1={150} x2={160} y2={150} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <polygon points="157,147 163,150 157,153" fill={CYAN} opacity={0.5} />

 {/* Step 2: mini cloud */}
 <path
 d="M175 148 C175 142 182 138 188 140 C190 135 200 135 202 140 C208 138 212 142 210 148 C214 150 212 155 208 155 L178 155 C174 155 172 152 175 148 Z"
 stroke={CYAN}
 strokeWidth={0.8}
 strokeLinecap="round"
 />

 {/* Arrow 2 */}
 <line x1={218} y1={150} x2={278} y2={150} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <polygon points="275,147 281,150 275,153" fill={CYAN} opacity={0.5} />

 {/* Step 3: checkmark circle */}
 <circle cx={300} cy={150} r={12} stroke={TEAL} strokeWidth={1} fill={`${TEAL}10`} />
 <path d="M294 150 L298 154 L307 145" stroke={TEAL} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
 </g>

 {/* Ambient floating data dots */}
 <g opacity={0.3}>
 {[
 { x: 15, y: 15 },
 { x: 120, y: 10 },
 { x: 270, y: 12 },
 { x: 385, y: 15 },
 { x: 10, y: 140 },
 { x: 130, y: 170 },
 { x: 260, y: 170 },
 { x: 350, y: 170 },
 { x: 320, y: 100 },
 { x: 390, y: 100 },
 { x: 15, y: 80 },
 ].map((d, i) => (
 <circle key={`dot-${i}`} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>

 {/* Connection lines */}
 <g opacity={0.15}>
 <path d="M105 75 C120 78 130 55 140 50" stroke={CYAN} strokeWidth={0.6} strokeLinecap="round" strokeDasharray="3 3" />
 <path d="M260 65 C280 60 300 55 310 55" stroke={CYAN} strokeWidth={0.6} strokeLinecap="round" strokeDasharray="3 3" />
 </g>
 </svg>
 );
}
