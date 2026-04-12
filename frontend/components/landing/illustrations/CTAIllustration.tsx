const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function CTAIllustration({ className }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 700 160"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 >
 {/* Perspective path/road converging to horizon */}
 <g opacity={0.35}>
 {/* Road edges */}
 <path
 d="M50 155 C150 145 250 110 350 55"
 stroke={BLUE}
 strokeWidth={1}
 strokeLinecap="round"
 />
 <path
 d="M650 155 C550 145 450 110 350 55"
 stroke={BLUE}
 strokeWidth={1}
 strokeLinecap="round"
 />
 {/* Road center dashes */}
 <path
 d="M350 155 C350 140 350 100 350 55"
 stroke={BLUE}
 strokeWidth={0.6}
 strokeLinecap="round"
 strokeDasharray="6 8"
 />
 {/* Perspective cross-lines */}
 {[140, 125, 112, 100, 90, 82].map((y, i) => {
 const spread = (155 - y) * 2.5;
 return (
 <line
 key={`pl-${i}`}
 x1={350 - spread}
 y1={y}
 x2={350 + spread}
 y2={y}
 stroke={BLUE}
 strokeWidth={0.3}
 opacity={0.4 - i * 0.05}
 />
 );
 })}
 </g>

 {/* Rising sun / arc at horizon */}
 <g>
 {/* Sun arc */}
 <path
 d="M280 55 C280 20 350 0 420 20 C420 20 350 0 280 55"
 stroke={CYAN}
 strokeWidth={0}
 />
 <path
 d="M270 55 Q350 -10 430 55"
 stroke={CYAN}
 strokeWidth={1.2}
 strokeLinecap="round"
 fill={`${CYAN}08`}
 />
 {/* Inner arc */}
 <path
 d="M295 55 Q350 12 405 55"
 stroke={CYAN}
 strokeWidth={0.6}
 strokeLinecap="round"
 opacity={0.4}
 />

 {/* Radiating lines from horizon point */}
 <g opacity={0.25}>
 {Array.from({ length: 9 }).map((_, i) => {
 const angle = Math.PI + (Math.PI / 10) * (i - 4);
 const x2 = 350 + Math.cos(angle) * 110;
 const y2 = 55 + Math.sin(angle) * 65;
 return (
 <line
 key={`ray-${i}`}
 x1={350}
 y1={55}
 x2={x2}
 y2={y2}
 stroke={CYAN}
 strokeWidth={0.5}
 strokeLinecap="round"
 />
 );
 })}
 </g>

 {/* Horizon glow */}
 <circle cx={350} cy={55} r={6} fill={CYAN} opacity={0.15} className="illus-pulse" />
 <circle cx={350} cy={55} r={3} fill={CYAN} opacity={0.25} />
 </g>

 {/* Mountain / building silhouettes — left */}
 <g opacity={0.2}>
 {/* Mountain 1 */}
 <path
 d="M30 155 L80 70 L120 110 L150 65 L200 155"
 stroke={BLUE}
 strokeWidth={0.8}
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 {/* Building cluster */}
 <rect x={60} y={105} width={25} height={50} stroke={BLUE} strokeWidth={0.5} />
 <rect x={85} y={95} width={18} height={60} stroke={BLUE} strokeWidth={0.5} />
 <rect x={103} y={110} width={22} height={45} stroke={BLUE} strokeWidth={0.5} />
 {/* Windows */}
 <circle cx={72} cy={115} r={1.5} fill={CYAN} opacity={0.3} />
 <circle cx={72} cy={125} r={1.5} fill={CYAN} opacity={0.3} />
 <circle cx={94} cy={108} r={1.5} fill={CYAN} opacity={0.3} />
 <circle cx={94} cy={118} r={1.5} fill={CYAN} opacity={0.3} />
 </g>

 {/* Mountain / building silhouettes — right */}
 <g opacity={0.2}>
 {/* Mountain 2 */}
 <path
 d="M500 155 L550 75 L590 110 L620 60 L680 155"
 stroke={BLUE}
 strokeWidth={0.8}
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 {/* Building cluster */}
 <rect x={560} y={100} width={20} height={55} stroke={BLUE} strokeWidth={0.5} />
 <rect x={580} y={90} width={22} height={65} stroke={BLUE} strokeWidth={0.5} />
 <rect x={602} y={105} width={18} height={50} stroke={BLUE} strokeWidth={0.5} />
 {/* Windows */}
 <circle cx={570} cy={112} r={1.5} fill={CYAN} opacity={0.3} />
 <circle cx={570} cy={122} r={1.5} fill={CYAN} opacity={0.3} />
 <circle cx={591} cy={102} r={1.5} fill={CYAN} opacity={0.3} />
 <circle cx={611} cy={115} r={1.5} fill={CYAN} opacity={0.3} />
 </g>

 {/* Person silhouette stepping forward — left of center */}
 <g opacity={0.5} className="illus-float-d1">
 {/* Head */}
 <circle cx={250} cy={100} r={9} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 {/* Body */}
 <line x1={250} y1={109} x2={250} y2={138} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 {/* Legs — walking pose */}
 <line x1={250} y1={138} x2={240} y2={158} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 <line x1={250} y1={138} x2={262} y2={155} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 {/* Arms — forward motion */}
 <line x1={250} y1={118} x2={260} y2={130} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 <line x1={250} y1={118} x2={238} y2={128} stroke={LAVENDER} strokeWidth={1.2} strokeLinecap="round" />
 </g>

 {/* Floating particles increasing toward horizon */}
 <g className="illus-glow">
 {/* Sparse particles on edges */}
 {[
 { x: 30, y: 40, r: 1, o: 0.15 },
 { x: 670, y: 35, r: 1, o: 0.15 },
 { x: 80, y: 55, r: 1.5, o: 0.2 },
 { x: 620, y: 48, r: 1.5, o: 0.2 },
 { x: 140, y: 42, r: 1, o: 0.2 },
 { x: 560, y: 38, r: 1, o: 0.2 },
 { x: 15, y: 100, r: 1, o: 0.12 },
 { x: 685, y: 95, r: 1, o: 0.12 },
 ].map((p, i) => (
 <circle key={`sp-${i}`} cx={p.x} cy={p.y} r={p.r} fill={PURPLE} opacity={p.o} />
 ))}

 {/* Denser particles near horizon */}
 {[
 { x: 310, y: 38, r: 1.5, o: 0.35 },
 { x: 330, y: 28, r: 1, o: 0.3 },
 { x: 350, y: 22, r: 2, o: 0.4 },
 { x: 370, y: 30, r: 1.2, o: 0.35 },
 { x: 390, y: 40, r: 1.5, o: 0.3 },
 { x: 340, y: 45, r: 1, o: 0.3 },
 { x: 360, y: 42, r: 1, o: 0.3 },
 { x: 325, y: 15, r: 1, o: 0.25 },
 { x: 345, y: 10, r: 1.5, o: 0.25 },
 { x: 365, y: 18, r: 1, o: 0.25 },
 { x: 355, y: 35, r: 0.8, o: 0.35 },
 { x: 338, y: 20, r: 0.8, o: 0.3 },
 { x: 362, y: 8, r: 1.2, o: 0.2 },
 { x: 348, y: 3, r: 1, o: 0.18 },
 ].map((p, i) => (
 <circle key={`hp-${i}`} cx={p.x} cy={p.y} r={p.r} fill={PURPLE} opacity={p.o} />
 ))}
 </g>

 {/* Subtle horizon line */}
 <line x1={0} y1={55} x2={700} y2={55} stroke={BLUE} strokeWidth={0.3} opacity={0.1} />
 </svg>
 );
}
