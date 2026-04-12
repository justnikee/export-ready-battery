const BLUE = "#8FB8DE";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";
const LAVENDER = "#B4A7D6";

export function IndiaComplianceIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Shield */}
 <g>
 <path d="M160 15 L220 40 L220 90 C220 120 190 140 160 150 C130 140 100 120 100 90 L100 40 Z"
 stroke={TEAL} strokeWidth={1.2} fill={`${TEAL}06`} strokeLinejoin="round" />
 <path d="M160 28 L208 48 L208 88 C208 112 184 128 160 136 C136 128 112 112 112 88 L112 48 Z"
 stroke={TEAL} strokeWidth={0.5} fill="none" opacity={0.3} />
 {/* BIS text */}
 <text x={141} y={72} fontSize={14} fontFamily="monospace" fill={BLUE} opacity={0.4}>BIS</text>
 {/* EPR text */}
 <text x={140} y={90} fontSize={10} fontFamily="monospace" fill={CYAN} opacity={0.35}>EPR</text>
 {/* PLI text */}
 <text x={145} y={106} fontSize={10} fontFamily="monospace" fill={LAVENDER} opacity={0.3}>PLI</text>
 </g>
 {/* Checkmarks on the side */}
 <g opacity={0.5}>
 {[{y:55,label:"IS 16046"},{y:75,label:"CPCB"},{y:95,label:"PLI Cert"}].map((item, i) => (
 <g key={i}>
 <circle cx={255} cy={item.y} r={7} stroke={TEAL} strokeWidth={0.7} fill={`${TEAL}10`} />
 <path d={`M251 ${item.y} L254 ${item.y + 3} L260 ${item.y - 3}`} stroke={TEAL} strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
 <text x={268} y={item.y + 3} fontSize={6} fontFamily="monospace" fill={BLUE} opacity={0.4}>{item.label}</text>
 </g>
 ))}
 </g>
 {/* Connection dashes */}
 <g opacity={0.15}>
 <path d="M220 65 L245 60" stroke={CYAN} strokeWidth={0.7} strokeDasharray="3 3" />
 <path d="M220 85 L245 80" stroke={CYAN} strokeWidth={0.7} strokeDasharray="3 3" />
 <path d="M220 100 L245 98" stroke={CYAN} strokeWidth={0.7} strokeDasharray="3 3" />
 </g>
 {/* Circuit nodes left */}
 <g opacity={0.3}>
 <circle cx={55} cy={50} r={3} stroke={CYAN} strokeWidth={0.6} />
 <line x1={55} y1={53} x2={55} y2={70} stroke={CYAN} strokeWidth={0.4} />
 <circle cx={55} cy={73} r={3} stroke={CYAN} strokeWidth={0.6} />
 <line x1={55} y1={76} x2={55} y2={93} stroke={CYAN} strokeWidth={0.4} />
 <circle cx={55} cy={96} r={3} stroke={CYAN} strokeWidth={0.6} />
 <line x1={58} y1={73} x2={100} y2={65} stroke={CYAN} strokeWidth={0.4} strokeDasharray="3 3" />
 </g>
 {/* Ambient dots */}
 <g opacity={0.3}>
 {[{x:20,y:20},{x:305,y:22},{x:15,y:145},{x:300,y:148},{x:160,y:5}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}

export function AuditReadyIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Main document stack */}
 <g>
 <rect x={100} y={18} width={120} height={125} rx={5} stroke={BLUE} strokeWidth={1.2} fill={`${BLUE}08`} />
 {/* Header */}
 <line x1={115} y1={38} x2={205} y2={38} stroke={BLUE} strokeWidth={0.5} opacity={0.4} />
 {/* Audit line items with checkmarks */}
 {[50, 65, 80, 95, 110].map((y, i) => (
 <g key={i}>
 <line x1={130} y1={y} x2={200} y2={y} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <circle cx={118} cy={y} r={5} stroke={TEAL} strokeWidth={0.6} fill={`${TEAL}08`} />
 <path d={`M115 ${y} L117 ${y + 2} L122 ${y - 2}`} stroke={TEAL} strokeWidth={0.6} strokeLinecap="round" strokeLinejoin="round" />
 </g>
 ))}
 {/* Seal stamp */}
 <circle cx={185} cy={125} r={12} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}08`} />
 <circle cx={185} cy={125} r={8} stroke={CYAN} strokeWidth={0.5} opacity={0.4} />
 <text x={179} y={128} fontSize={7} fontFamily="monospace" fill={CYAN} opacity={0.5}>✓</text>
 </g>
 {/* Lock icon — right */}
 <g opacity={0.5}>
 <rect x={255} y={65} width={30} height={25} rx={3} stroke={BLUE} strokeWidth={1} fill={`${BLUE}08`} />
 <path d="M262 65 L262 55 C262 48 278 48 278 55 L278 65" stroke={BLUE} strokeWidth={1} strokeLinecap="round" />
 <circle cx={270} cy={77} r={3} fill={CYAN} opacity={0.4} />
 <line x1={270} y1={80} x2={270} y2={85} stroke={CYAN} strokeWidth={0.6} strokeLinecap="round" />
 </g>
 {/* Timeline markers — left */}
 <g opacity={0.4}>
 <line x1={50} y1={30} x2={50} y2={130} stroke={BLUE} strokeWidth={0.5} />
 {[40, 60, 80, 100, 120].map((y, i) => (
 <g key={i}>
 <circle cx={50} cy={y} r={3} stroke={CYAN} strokeWidth={0.5} fill={`${CYAN}10`} />
 <line x1={55} y1={y} x2={75} y2={y} stroke={CYAN} strokeWidth={0.4} strokeDasharray="2 2" />
 </g>
 ))}
 </g>
 {/* Ambient dots */}
 <g opacity={0.3}>
 {[{x:20,y:15},{x:305,y:20},{x:15,y:148},{x:305,y:145},{x:160,y:5}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}

export function ZeroInfraIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Cloud shape */}
 <g>
 <path d="M100 65 C100 45 120 30 145 35 C150 15 185 15 190 35 C210 28 225 42 220 60 C235 65 228 85 215 85 L110 85 C95 85 88 75 100 65 Z"
 stroke={CYAN} strokeWidth={1.2} strokeLinecap="round" fill={`${CYAN}06`} />
 {/* Inner cloud highlight */}
 <path d="M115 70 C115 58 128 48 145 52 C148 42 168 42 170 52 C180 48 188 55 185 65"
 stroke={CYAN} strokeWidth={0.4} opacity={0.3} fill="none" />
 </g>
 {/* Passport generation inside cloud */}
 <g opacity={0.5}>
 <rect x={135} y={50} width={50} height={30} rx={3} stroke={BLUE} strokeWidth={0.7} fill={`${BLUE}08`} />
 <rect x={140} y={55} width={12} height={12} rx={1} stroke={TEAL} strokeWidth={0.5} fill={`${TEAL}08`} />
 <line x1={157} y1={58} x2={178} y2={58} stroke={BLUE} strokeWidth={0.3} opacity={0.4} />
 <line x1={157} y1={64} x2={175} y2={64} stroke={BLUE} strokeWidth={0.3} opacity={0.35} />
 <line x1={157} y1={70} x2={176} y2={70} stroke={BLUE} strokeWidth={0.3} opacity={0.3} />
 </g>
 {/* Instant start — lightning bolt */}
 <g opacity={0.45}>
 <path d="M160 95 L155 108 L162 108 L157 125" stroke={TEAL} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
 </g>
 {/* Connection nodes — devices */}
 <g opacity={0.4}>
 {/* Laptop left */}
 <rect x={35} y={100} width={40} height={28} rx={3} stroke={BLUE} strokeWidth={0.7} />
 <line x1={30} y1={128} x2={80} y2={128} stroke={BLUE} strokeWidth={0.7} strokeLinecap="round" />
 <path d="M78 105 L100 65" stroke={CYAN} strokeWidth={0.5} strokeDasharray="3 3" />
 {/* Phone right */}
 <rect x={250} y={95} width={28} height={45} rx={4} stroke={BLUE} strokeWidth={0.7} />
 <rect x={254} y={102} width={20} height={28} rx={1} stroke={BLUE} strokeWidth={0.3} opacity={0.3} />
 <path d="M250 112 L225 80" stroke={CYAN} strokeWidth={0.5} strokeDasharray="3 3" />
 </g>
 {/* Ambient dots */}
 <g opacity={0.3}>
 {[{x:15,y:18},{x:305,y:22},{x:10,y:148},{x:308,y:148},{x:160,y:5}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}
