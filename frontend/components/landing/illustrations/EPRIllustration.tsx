const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function EPRIllustration({ className }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 400 220"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 >
 {/* Large circular recycling arrows — center */}
 <g>
 {/* Outer ring glow */}
 <circle cx={200} cy={100} r={65} stroke={TEAL} strokeWidth={0.4} opacity={0.15} />

 {/* Arrow 1 — top, curving right */}
 <path
 d="M200 45 C240 45 265 70 265 100"
 stroke={TEAL}
 strokeWidth={1.5}
 strokeLinecap="round"
 fill="none"
 />
 <polygon points="265,92 272,102 258,102" fill={TEAL} opacity={0.6} />

 {/* Arrow 2 — bottom-right, curving to bottom-left */}
 <path
 d="M260 110 C255 145 230 165 200 160"
 stroke={TEAL}
 strokeWidth={1.5}
 strokeLinecap="round"
 fill="none"
 />
 <polygon points="207,160 200,168 198,155" fill={TEAL} opacity={0.6} />

 {/* Arrow 3 — bottom-left, curving to top */}
 <path
 d="M192 155 C160 150 138 125 140 95"
 stroke={TEAL}
 strokeWidth={1.5}
 strokeLinecap="round"
 fill="none"
 />
 <polygon points="140,103 133,93 147,93" fill={TEAL} opacity={0.6} />

 {/* Inner cycle detail */}
 <circle cx={200} cy={100} r={30} stroke={TEAL} strokeWidth={0.5} opacity={0.2} strokeDasharray="3 4" />

 {/* Center battery mini icon */}
 <rect x={190} y={88} width={20} height={26} rx={3} stroke={BLUE} strokeWidth={0.8} />
 <rect x={196} y={85} width={8} height={4} rx={1} stroke={BLUE} strokeWidth={0.7} />
 <rect x={194} y={100} width={12} height={4} rx={0.5} fill={TEAL} opacity={0.3} />
 <rect x={194} y={105} width={12} height={4} rx={0.5} fill={TEAL} opacity={0.4} />
 </g>

 {/* Stack of documents / filing cabinet — left */}
 <g opacity={0.5}>
 {/* Cabinet body */}
 <rect x={30} y={60} width={60} height={100} rx={3} stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
 {/* Drawer divisions */}
 <line x1={30} y1={93} x2={90} y2={93} stroke={BLUE} strokeWidth={0.6} />
 <line x1={30} y1={126} x2={90} y2={126} stroke={BLUE} strokeWidth={0.6} />
 {/* Drawer handles */}
 <line x1={55} y1={76} x2={65} y2={76} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <line x1={55} y1={109} x2={65} y2={109} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <line x1={55} y1={142} x2={65} y2={142} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />

 {/* Document sticking out of top drawer */}
 <rect x={40} y={48} width={35} height={15} rx={1} stroke={LAVENDER} strokeWidth={0.7} fill={`${LAVENDER}08`} />
 <line x1={45} y1={53} x2={68} y2={53} stroke={LAVENDER} strokeWidth={0.3} />
 <line x1={45} y1={57} x2={62} y2={57} stroke={LAVENDER} strokeWidth={0.3} />

 {/* Second protruding document */}
 <rect x={48} y={42} width={30} height={10} rx={1} stroke={LAVENDER} strokeWidth={0.5} opacity={0.5} />
 </g>

 {/* Calendar icon with checkmark — right */}
 <g opacity={0.5}>
 {/* Calendar body */}
 <rect x={310} y={55} width={65} height={60} rx={4} stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
 {/* Calendar header */}
 <rect x={310} y={55} width={65} height={16} rx={4} stroke={BLUE} strokeWidth={1} fill={`${BLUE}10`} />
 {/* Calendar hooks */}
 <line x1={325} y1={50} x2={325} y2={58} stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 <line x1={360} y1={50} x2={360} y2={58} stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 {/* Grid dots for days */}
 {[0, 1, 2, 3, 4].map((col) =>
 [0, 1, 2].map((row) => (
 <circle
 key={`cal-${col}-${row}`}
 cx={320 + col * 11}
 cy={80 + row * 10}
 r={1.5}
 fill={col === 3 && row === 1 ? TEAL : BLUE}
 opacity={col === 3 && row === 1 ? 0.7 : 0.25}
 />
 ))
 )}
 {/* Checkmark on calendar */}
 <circle cx={353} cy={90} r={6} stroke={TEAL} strokeWidth={0.8} />
 <path d="M350 90 L352 93 L357 87" stroke={TEAL} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />

 {/* Clock hint */}
 <circle cx={345} cy={135} r={12} stroke={CYAN} strokeWidth={0.7} opacity={0.3} className="illus-pulse-d1" />
 <line x1={345} y1={135} x2={345} y2={127} stroke={CYAN} strokeWidth={0.5} strokeLinecap="round" opacity={0.3} />
 <line x1={345} y1={135} x2={351} y2={138} stroke={CYAN} strokeWidth={0.5} strokeLinecap="round" opacity={0.3} />
 </g>

 {/* Collection bin / container — bottom center */}
 <g opacity={0.45}>
 <path
 d="M170 185 L165 210 L235 210 L230 185"
 stroke={BLUE}
 strokeWidth={1}
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 {/* Bin lid */}
 <line x1={165} y1={185} x2={235} y2={185} stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 {/* Recycling symbol on bin */}
 <path d="M195 195 L200 192 L205 195" stroke={TEAL} strokeWidth={0.7} strokeLinecap="round" />
 <path d="M205 195 L207 200 L202 203" stroke={TEAL} strokeWidth={0.7} strokeLinecap="round" />
 <path d="M202 203 L197 200 L195 195" stroke={TEAL} strokeWidth={0.7} strokeLinecap="round" />
 {/* Items inside bin */}
 <rect x={177} y={192} width={8} height={10} rx={1} stroke={CYAN} strokeWidth={0.5} opacity={0.3} />
 <circle cx={218} cy={198} r={4} stroke={CYAN} strokeWidth={0.5} opacity={0.3} />
 </g>

 {/* Floating leaf shapes */}
 <g opacity={0.35} className="illus-float">
 <path d="M115 35 Q125 25 130 40 Q120 45 115 35 Z" stroke={TEAL} strokeWidth={0.7} fill={`${TEAL}10`} />
 <line x1={122} y1={33} x2={122} y2={42} stroke={TEAL} strokeWidth={0.4} />

 <path d="M295 30 Q305 22 308 35 Q300 40 295 30 Z" stroke={TEAL} strokeWidth={0.7} fill={`${TEAL}10`} />
 <line x1={301} y1={27} x2={301} y2={37} stroke={TEAL} strokeWidth={0.4} />

 <path d="M380 110 Q388 102 392 115 Q384 120 380 110 Z" stroke={TEAL} strokeWidth={0.7} fill={`${TEAL}10`} />
 <line x1={386} y1={107} x2={386} y2={117} stroke={TEAL} strokeWidth={0.4} />

 <path d="M20 175 Q28 167 32 180 Q24 185 20 175 Z" stroke={TEAL} strokeWidth={0.7} fill={`${TEAL}08`} />
 <line x1={26} y1={172} x2={26} y2={182} stroke={TEAL} strokeWidth={0.4} />
 </g>

 {/* Connection flow lines */}
 <g opacity={0.15} className="illus-dash">
 <path d="M90 100 C120 95 130 95 140 96" stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" strokeDasharray="4 3" />
 <path d="M265 100 C280 100 295 85 310 80" stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" strokeDasharray="4 3" />
 <path d="M200 160 C200 170 200 175 200 185" stroke={LAVENDER} strokeWidth={0.6} strokeLinecap="round" strokeDasharray="3 3" />
 </g>

 {/* Ambient dots */}
 <g opacity={0.3} className="illus-glow">
 {[
 { x: 10, y: 25 },
 { x: 105, y: 150 },
 { x: 280, y: 180 },
 { x: 390, y: 35 },
 { x: 160, y: 15 },
 { x: 250, y: 12 },
 { x: 340, y: 170 },
 { x: 55, y: 200 },
 ].map((d, i) => (
 <circle key={`dot-${i}`} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}
