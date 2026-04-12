const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function BISIllustration({ className }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 400 180"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 >
 {/* Background hexagonal grid */}
 <g opacity={0.08}>
 {[
 { x: 50, y: 30 },
 { x: 90, y: 30 },
 { x: 70, y: 60 },
 { x: 110, y: 60 },
 { x: 310, y: 25 },
 { x: 350, y: 25 },
 { x: 330, y: 55 },
 { x: 370, y: 55 },
 { x: 150, y: 15 },
 { x: 250, y: 20 },
 { x: 200, y: 155 },
 { x: 240, y: 160 },
 ].map((h, i) => {
 const s = 14;
 const pts = Array.from({ length: 6 })
 .map((_, j) => {
 const angle = (Math.PI / 3) * j - Math.PI / 6;
 return `${h.x + s * Math.cos(angle)},${h.y + s * Math.sin(angle)}`;
 })
 .join(" ");
 return (
 <polygon
 key={`hex-${i}`}
 points={pts}
 stroke={BLUE}
 strokeWidth={0.5}
 />
 );
 })}
 </g>

 {/* Certificate / document — center */}
 <g>
 {/* Main document shape */}
 <rect
 x={135}
 y={18}
 width={130}
 height={145}
 rx={5}
 stroke={BLUE}
 strokeWidth={1.3}
 strokeLinecap="round"
 fill={`${BLUE}08`}
 />
 {/* Folded corner */}
 <path d="M240 18 L265 18 L265 43" stroke={BLUE} strokeWidth={0.8} fill={`${BLUE}06`} />
 <line x1={240} y1={18} x2={265} y2={43} stroke={BLUE} strokeWidth={0.8} strokeLinecap="round" />

 {/* Header lines */}
 <line x1={160} y1={45} x2={240} y2={45} stroke={BLUE} strokeWidth={0.5} opacity={0.4} />
 <line x1={170} y1={55} x2={230} y2={55} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />

 {/* Official seal — circle with star */}
 <circle cx={200} cy={90} r={22} stroke={CYAN} strokeWidth={1} fill={`${CYAN}08`} className="illus-pulse" />
 <circle cx={200} cy={90} r={17} stroke={CYAN} strokeWidth={0.6} opacity={0.5} />
 {/* Star inside seal */}
 <path
 d={(() => {
 const cx = 200, cy = 90, r1 = 12, r2 = 6;
 const pts = Array.from({ length: 10 })
 .map((_, i) => {
 const angle = (Math.PI / 5) * i - Math.PI / 2;
 const r = i % 2 === 0 ? r1 : r2;
 return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
 })
 .join(" ");
 return `M${pts.split(" ")[0]} L${pts.split(" ").slice(1).join(" L")} Z`;
 })()}
 stroke={CYAN}
 strokeWidth={0.8}
 strokeLinejoin="round"
 fill={`${CYAN}10`}
 />

 {/* Document body lines */}
 <line x1={155} y1={125} x2={245} y2={125} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={155} y1={133} x2={230} y2={133} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={155} y1={141} x2={238} y2={141} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={155} y1={149} x2={220} y2={149} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />
 </g>

 {/* Test tube / beaker and circuit pattern — left */}
 <g opacity={0.55}>
 {/* Test tube */}
 <path
 d="M55 45 L55 110 Q55 125 65 125 Q75 125 75 110 L75 45"
 stroke={TEAL}
 strokeWidth={1}
 strokeLinecap="round"
 />
 {/* Tube cap */}
 <line x1={50} y1={45} x2={80} y2={45} stroke={TEAL} strokeWidth={1} strokeLinecap="round" />
 {/* Liquid level */}
 <path d="M57 85 Q65 80 73 85 L73 110 Q73 122 65 122 Q57 122 57 110 Z" fill={TEAL} opacity={0.1} />
 {/* Bubbles */}
 <circle cx={63} cy={95} r={2} stroke={TEAL} strokeWidth={0.5} opacity={0.4} className="illus-float" />
 <circle cx={68} cy={102} r={1.5} stroke={TEAL} strokeWidth={0.5} opacity={0.3} className="illus-float-d1" />

 {/* Circuit board pattern */}
 <line x1={40} y1={70} x2={20} y2={70} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <line x1={20} y1={70} x2={20} y2={55} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <circle cx={20} cy={53} r={2} stroke={CYAN} strokeWidth={0.7} />
 <line x1={30} y1={85} x2={15} y2={85} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <circle cx={13} cy={85} r={2} stroke={CYAN} strokeWidth={0.7} />
 <line x1={85} y1={75} x2={105} y2={75} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <line x1={105} y1={75} x2={105} y2={60} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <circle cx={105} cy={58} r={2} stroke={CYAN} strokeWidth={0.7} />
 <line x1={85} y1={95} x2={110} y2={95} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <line x1={110} y1={95} x2={110} y2={110} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <circle cx={110} cy={112} r={2} stroke={CYAN} strokeWidth={0.7} />
 </g>

 {/* R-number badge with checkmark — right */}
 <g opacity={0.55}>
 {/* Badge shape */}
 <rect
 x={300}
 y={50}
 width={75}
 height={75}
 rx={10}
 stroke={BLUE}
 strokeWidth={1.2}
 strokeLinecap="round"
 fill={`${BLUE}08`}
 />
 {/* "R" text */}
 <text
 x={322}
 y={100}
 fontSize={30}
 fontFamily="monospace"
 fontWeight="bold"
 fill={BLUE}
 opacity={0.35}
 >
 R
 </text>
 {/* Checkmark circle overlay */}
 <circle cx={360} cy={60} r={12} stroke={TEAL} strokeWidth={1} fill={`${TEAL}10`} />
 <path
 d="M354 60 L358 64 L367 55"
 stroke={TEAL}
 strokeWidth={1.2}
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 {/* Registration number lines */}
 <line x1={310} y1={115} x2={365} y2={115} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 </g>

 {/* Connection lines between elements */}
 <g opacity={0.15} className="illus-dash">
 <path
 d="M80 85 C110 85 120 80 135 75"
 stroke={CYAN}
 strokeWidth={0.7}
 strokeLinecap="round"
 strokeDasharray="4 3"
 />
 <path
 d="M265 85 C280 85 290 82 300 80"
 stroke={CYAN}
 strokeWidth={0.7}
 strokeLinecap="round"
 strokeDasharray="4 3"
 />
 </g>

 {/* Floating sparkle dots */}
 <g opacity={0.35} className="illus-glow">
 {[
 { x: 125, y: 30 },
 { x: 280, y: 25 },
 { x: 390, y: 45 },
 { x: 15, y: 40 },
 { x: 45, y: 145 },
 { x: 385, y: 140 },
 { x: 200, y: 10 },
 { x: 300, y: 160 },
 { x: 140, y: 170 },
 { x: 350, y: 165 },
 ].map((s, i) => (
 <g key={`sp-${i}`}>
 <circle cx={s.x} cy={s.y} r={1.5} fill={PURPLE} />
 {/* Sparkle cross */}
 <line
 x1={s.x - 3}
 y1={s.y}
 x2={s.x + 3}
 y2={s.y}
 stroke={PURPLE}
 strokeWidth={0.3}
 opacity={0.5}
 />
 <line
 x1={s.x}
 y1={s.y - 3}
 x2={s.x}
 y2={s.y + 3}
 stroke={PURPLE}
 strokeWidth={0.3}
 opacity={0.5}
 />
 </g>
 ))}
 </g>
 </svg>
 );
}
