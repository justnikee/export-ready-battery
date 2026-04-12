const BLUE = "#8FB8DE";
const LAVENDER = "#B4A7D6";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";

export function HeroIllustration({ className }: { className?: string }) {
 return (
 <svg
 viewBox="0 0 1440 480"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 >
 {/* Perspective floor grid */}
 <g opacity={0.12}>
 {Array.from({ length: 20 }).map((_, i) => (
 <line
 key={`vg-${i}`}
 x1={720 + (i - 10) * 20}
 y1={300}
 x2={720 + (i - 10) * 120}
 y2={480}
 stroke={BLUE}
 strokeWidth={0.5}
 />
 ))}
 {[320, 350, 380, 410, 440, 470].map((y, i) => (
 <line
 key={`hg-${i}`}
 x1={120 + (480 - y) * 1.5}
 y1={y}
 x2={1320 - (480 - y) * 1.5}
 y2={y}
 stroke={BLUE}
 strokeWidth={0.5}
 />
 ))}
 </g>

 {/* Background architectural arches */}
 <g opacity={0.1}>
 <path
 d="M400 320 Q400 100 720 80 Q1040 100 1040 320"
 stroke={BLUE}
 strokeWidth={1.5}
 strokeLinecap="round"
 />
 <path
 d="M500 320 Q500 140 720 120 Q940 140 940 320"
 stroke={BLUE}
 strokeWidth={1}
 strokeLinecap="round"
 />
 <path
 d="M300 320 Q300 60 720 40 Q1140 60 1140 320"
 stroke={LAVENDER}
 strokeWidth={1}
 strokeLinecap="round"
 />
 </g>

 {/* Glass dome columns */}
 <g opacity={0.08}>
 <line x1={400} y1={120} x2={400} y2={320} stroke={BLUE} strokeWidth={1} />
 <line x1={1040} y1={120} x2={1040} y2={320} stroke={BLUE} strokeWidth={1} />
 <line x1={300} y1={80} x2={300} y2={320} stroke={LAVENDER} strokeWidth={0.7} />
 <line x1={1140} y1={80} x2={1140} y2={320} stroke={LAVENDER} strokeWidth={0.7} />
 </g>

 {/* Palm tree — far left */}
 <g opacity={0.5}>
 <line x1={80} y1={380} x2={90} y2={240} stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" />
 <path d="M90 240 Q60 220 30 230" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 <path d="M90 240 Q70 210 50 200" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 <path d="M90 240 Q110 210 130 200" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 <path d="M90 240 Q120 225 145 235" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 <path d="M90 240 Q85 205 80 185" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 </g>

 {/* Palm tree — far right */}
 <g opacity={0.5}>
 <line x1={1370} y1={380} x2={1360} y2={230} stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" />
 <path d="M1360 230 Q1330 210 1310 220" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 <path d="M1360 230 Q1340 200 1320 190" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 <path d="M1360 230 Q1390 200 1410 195" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 <path d="M1360 230 Q1395 215 1415 225" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 <path d="M1360 230 Q1358 195 1355 180" stroke={TEAL} strokeWidth={1} strokeLinecap="round" fill="none" />
 </g>

 {/* Factory / manufacturing building — left side */}
 <g opacity={0.55}>
 {/* Main building */}
 <rect x={180} y={220} width={140} height={130} rx={2} stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
 {/* Chimney */}
 <rect x={200} y={180} width={20} height={40} stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 {/* Smoke puffs */}
 <circle cx={210} cy={170} r={5} stroke={BLUE} strokeWidth={0.7} opacity={0.4} className="illus-float" />
 <circle cx={215} cy={158} r={4} stroke={BLUE} strokeWidth={0.7} opacity={0.3} className="illus-float-d1" />
 <circle cx={208} cy={148} r={3} stroke={BLUE} strokeWidth={0.7} opacity={0.2} className="illus-float-d2" />
 {/* Windows */}
 <rect x={195} y={240} width={18} height={14} rx={1} stroke={CYAN} strokeWidth={0.8} />
 <rect x={220} y={240} width={18} height={14} rx={1} stroke={CYAN} strokeWidth={0.8} />
 <rect x={245} y={240} width={18} height={14} rx={1} stroke={CYAN} strokeWidth={0.8} />
 <rect x={195} y={265} width={18} height={14} rx={1} stroke={CYAN} strokeWidth={0.8} />
 <rect x={220} y={265} width={18} height={14} rx={1} stroke={CYAN} strokeWidth={0.8} />
 <rect x={245} y={265} width={18} height={14} rx={1} stroke={CYAN} strokeWidth={0.8} />
 {/* Smaller adjacent building */}
 <rect x={320} y={260} width={80} height={90} rx={2} stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 <rect x={335} y={278} width={14} height={10} rx={1} stroke={CYAN} strokeWidth={0.7} />
 <rect x={355} y={278} width={14} height={10} rx={1} stroke={CYAN} strokeWidth={0.7} />
 <rect x={375} y={278} width={14} height={10} rx={1} stroke={CYAN} strokeWidth={0.7} />
 {/* Door */}
 <rect x={345} y={320} width={24} height={30} rx={1} stroke={CYAN} strokeWidth={0.8} />
 </g>

 {/* Circuit board patterns near factory */}
 <g opacity={0.3}>
 <line x1={170} y1={200} x2={150} y2={200} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <line x1={150} y1={200} x2={150} y2={180} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <circle cx={150} cy={178} r={2} stroke={CYAN} strokeWidth={0.8} />
 <line x1={160} y1={210} x2={135} y2={210} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <line x1={135} y1={210} x2={135} y2={230} stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" />
 <circle cx={135} cy={232} r={2} stroke={CYAN} strokeWidth={0.8} />
 <line x1={340} y1={250} x2={340} y2={235} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <line x1={340} y1={235} x2={365} y2={235} stroke={CYAN} strokeWidth={0.7} strokeLinecap="round" />
 <circle cx={367} cy={235} r={1.5} stroke={CYAN} strokeWidth={0.7} />
 </g>

 {/* Central hexagonal shield with battery */}
 <g>
 {/* Outer glow ring */}
 <circle cx={720} cy={220} r={110} stroke={PURPLE} strokeWidth={0.5} opacity={0.15} />
 <circle cx={720} cy={220} r={100} stroke={CYAN} strokeWidth={0.5} opacity={0.2} />

 {/* Data orbit rings */}
 <ellipse cx={720} cy={220} rx={130} ry={40} stroke={CYAN} strokeWidth={0.7} opacity={0.25} strokeDasharray="4 6" />
 <ellipse cx={720} cy={220} rx={120} ry={70} stroke={LAVENDER} strokeWidth={0.7} opacity={0.2} strokeDasharray="3 8" transform="rotate(30, 720, 220)" />
 <ellipse cx={720} cy={220} rx={125} ry={55} stroke={PURPLE} strokeWidth={0.6} opacity={0.18} strokeDasharray="5 7" transform="rotate(-20, 720, 220)" />

 {/* Orbit data dots */}
 <circle cx={850} cy={220} r={3} fill={CYAN} opacity={0.6} className="illus-float" />
 <circle cx={590} cy={220} r={2.5} fill={CYAN} opacity={0.5} className="illus-float" />
 <circle cx={780} cy={170} r={2} fill={LAVENDER} opacity={0.5} className="illus-float-d1" />
 <circle cx={660} cy={270} r={2} fill={PURPLE} opacity={0.5} className="illus-float-d1" />
 <circle cx={810} cy={260} r={2.5} fill={LAVENDER} opacity={0.4} className="illus-float-d2" />

 {/* Hexagonal shield */}
 <path
 d="M720 135 L785 170 L785 270 L720 305 L655 270 L655 170 Z"
 stroke={BLUE}
 strokeWidth={1.5}
 strokeLinecap="round"
 strokeLinejoin="round"
 fill={`${BLUE}12`}
 />
 {/* Inner hexagon highlight */}
 <path
 d="M720 155 L770 182 L770 258 L720 285 L670 258 L670 182 Z"
 stroke={CYAN}
 strokeWidth={0.8}
 strokeLinecap="round"
 strokeLinejoin="round"
 fill="none"
 opacity={0.4}
 />

 {/* Battery icon inside */}
 <rect x={700} y={195} width={40} height={55} rx={4} stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
 <rect x={712} y={190} width={16} height={6} rx={2} stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 {/* Charge bars */}
 <rect x={707} y={232} width={26} height={6} rx={1} fill={TEAL} opacity={0.5} />
 <rect x={707} y={222} width={26} height={6} rx={1} fill={TEAL} opacity={0.4} />
 <rect x={707} y={212} width={26} height={6} rx={1} fill={CYAN} opacity={0.3} />
 {/* Shield checkmark */}
 <path d="M710 264 L718 272 L735 255" stroke={TEAL} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
 </g>

 {/* Dashboard screen — right side */}
 <g opacity={0.55}>
 {/* Monitor frame */}
 <rect x={1020} y={180} width={220} height={150} rx={6} stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
 {/* Monitor stand */}
 <line x1={1130} y1={330} x2={1130} y2={355} stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 <line x1={1100} y1={355} x2={1160} y2={355} stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 {/* Screen content — bar chart */}
 <rect x={1040} y={260} width={16} height={50} rx={1} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}10`} />
 <rect x={1062} y={240} width={16} height={70} rx={1} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}10`} />
 <rect x={1084} y={250} width={16} height={60} rx={1} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}10`} />
 <rect x={1106} y={230} width={16} height={80} rx={1} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}10`} />
 {/* Line chart */}
 <path
 d="M1040 210 Q1070 195 1100 205 Q1130 215 1150 198 L1170 200 Q1195 188 1220 195"
 stroke={TEAL}
 strokeWidth={0.8}
 strokeLinecap="round"
 fill="none"
 />
 {/* Status circles */}
 <circle cx={1160} cy={245} r={8} stroke={TEAL} strokeWidth={0.8} />
 <path d="M1156 245 L1159 248 L1165 242" stroke={TEAL} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
 <circle cx={1185} cy={245} r={8} stroke={CYAN} strokeWidth={0.8} />
 <path d="M1181 245 L1184 248 L1190 242" stroke={CYAN} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
 <circle cx={1210} cy={245} r={8} stroke={LAVENDER} strokeWidth={0.8} />
 <line x1={1207} y1={245} x2={1213} y2={245} stroke={LAVENDER} strokeWidth={0.8} strokeLinecap="round" />
 {/* Header bar */}
 <line x1={1030} y1={198} x2={1230} y2={198} stroke={BLUE} strokeWidth={0.5} opacity={0.4} />
 <circle cx={1038} cy={190} r={3} stroke={CYAN} strokeWidth={0.5} opacity={0.5} />
 <circle cx={1048} cy={190} r={3} stroke={TEAL} strokeWidth={0.5} opacity={0.5} />
 </g>

 {/* People silhouettes */}
 <g opacity={0.5}>
 {/* Person 1 — near center-left */}
 <circle cx={500} cy={338} r={8} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={500} y1={346} x2={500} y2={380} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={500} y1={380} x2={493} y2={405} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={500} y1={380} x2={507} y2={405} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={500} y1={355} x2={490} y2={368} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={500} y1={355} x2={510} y2={368} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />

 {/* Person 2 — center-right */}
 <circle cx={920} cy={340} r={7} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={920} y1={347} x2={920} y2={378} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={920} y1={378} x2={914} y2={400} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={920} y1={378} x2={926} y2={400} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={920} y1={356} x2={912} y2={365} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={920} y1={356} x2={930} y2={370} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />

 {/* Person 3 — far right walking */}
 <circle cx={1300} cy={350} r={7} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={1300} y1={357} x2={1300} y2={388} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={1300} y1={388} x2={1293} y2={412} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={1300} y1={388} x2={1308} y2={410} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={1300} y1={365} x2={1310} y2={378} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />

 {/* Person 4 — left side */}
 <circle cx={160} cy={355} r={6} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={160} y1={361} x2={160} y2={388} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={160} y1={388} x2={155} y2={408} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 <line x1={160} y1={388} x2={165} y2={408} stroke={LAVENDER} strokeWidth={1} strokeLinecap="round" />
 </g>

 {/* Curved connection lines between elements */}
 <g opacity={0.2} className="illus-dash">
 <path
 d="M320 280 C450 260 550 250 655 220"
 stroke={CYAN}
 strokeWidth={0.8}
 strokeLinecap="round"
 strokeDasharray="6 4"
 />
 <path
 d="M785 220 C880 230 950 240 1020 250"
 stroke={CYAN}
 strokeWidth={0.8}
 strokeLinecap="round"
 strokeDasharray="6 4"
 />
 <path
 d="M720 305 C720 350 720 360 720 400"
 stroke={LAVENDER}
 strokeWidth={0.6}
 strokeLinecap="round"
 strokeDasharray="3 5"
 />
 </g>

 {/* Ambient floating particles */}
 <g opacity={0.35} className="illus-glow">
 {[
 { x: 120, y: 140, r: 2 },
 { x: 280, y: 100, r: 1.5 },
 { x: 450, y: 80, r: 2 },
 { x: 600, y: 120, r: 1.5 },
 { x: 840, y: 90, r: 2 },
 { x: 980, y: 110, r: 1.5 },
 { x: 1100, y: 80, r: 1 },
 { x: 1250, y: 130, r: 2 },
 { x: 1350, y: 100, r: 1.5 },
 { x: 350, y: 160, r: 1 },
 { x: 550, y: 300, r: 1.5 },
 { x: 870, y: 310, r: 1 },
 { x: 1050, y: 140, r: 1.5 },
 { x: 680, y: 380, r: 1 },
 { x: 760, y: 400, r: 1.5 },
 { x: 200, y: 420, r: 1 },
 { x: 1200, y: 400, r: 1.5 },
 ].map((p, i) => (
 <circle key={`p-${i}`} cx={p.x} cy={p.y} r={p.r} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}
