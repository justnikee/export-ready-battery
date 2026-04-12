const BLUE = "#8FB8DE";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";
const LAVENDER = "#B4A7D6";

export function ManufacturerIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Factory building */}
 <g>
 <rect x={80} y={50} width={160} height={80} rx={4} stroke={BLUE} strokeWidth={1.2} fill={`${BLUE}08`} />
 {/* Roof / sawtooth */}
 <path d="M80 50 L120 20 L120 50 M120 50 L160 20 L160 50 M160 50 L200 20 L200 50" stroke={BLUE} strokeWidth={1} strokeLinejoin="round" />
 {/* Chimney */}
 <rect x={210} y={25} width={16} height={25} rx={2} stroke={BLUE} strokeWidth={0.8} />
 {/* Smoke */}
 <path d="M218 25 C218 18 225 15 225 10" stroke={CYAN} strokeWidth={0.5} opacity={0.3} />
 <path d="M222 22 C222 15 228 12 230 8" stroke={CYAN} strokeWidth={0.5} opacity={0.25} />
 {/* Windows */}
 {[95, 135, 175, 215].map((x, i) => (
 <rect key={i} x={x} y={65} width={18} height={18} rx={2} stroke={CYAN} strokeWidth={0.6} fill={`${CYAN}08`} />
 ))}
 {/* Door */}
 <rect x={145} y={100} width={30} height={30} rx={3} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}06`} />
 </g>
 {/* Production line */}
 <g opacity={0.4} className="illus-pulse-d1">
 <line x1={50} y1={130} x2={270} y2={130} stroke={BLUE} strokeWidth={0.6} />
 {/* Battery units on line */}
 {[60, 100, 140, 180, 220].map((x, i) => (
 <g key={i}>
 <rect x={x} y={134} width={12} height={16} rx={2} stroke={TEAL} strokeWidth={0.5} />
 <rect x={x + 3} y={131} width={6} height={4} rx={1} stroke={TEAL} strokeWidth={0.4} />
 </g>
 ))}
 </g>
 {/* Ambient dots */}
 <g opacity={0.3} className="illus-glow">
 {[{x:20,y:15},{x:300,y:20},{x:15,y:140},{x:305,y:145},{x:160,y:5}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}

export function ExporterIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Globe */}
 <g opacity={0.5} className="illus-pulse">
 <circle cx={160} cy={75} r={45} stroke={BLUE} strokeWidth={1} />
 <ellipse cx={160} cy={75} rx={45} ry={15} stroke={BLUE} strokeWidth={0.5} strokeDasharray="3 3" />
 <ellipse cx={160} cy={75} rx={15} ry={45} stroke={BLUE} strokeWidth={0.5} strokeDasharray="3 3" />
 <ellipse cx={160} cy={58} rx={35} ry={6} stroke={BLUE} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.4} />
 <ellipse cx={160} cy={92} rx={35} ry={6} stroke={BLUE} strokeWidth={0.3} strokeDasharray="2 3" opacity={0.4} />
 {/* Region dots */}
 <circle cx={140} cy={68} r={3} fill={TEAL} opacity={0.6} />
 <circle cx={175} cy={62} r={2.5} fill={CYAN} opacity={0.5} />
 </g>
 {/* Shipping box — left */}
 <g opacity={0.55}>
 <rect x={25} y={55} width={40} height={35} rx={3} stroke={BLUE} strokeWidth={1} fill={`${BLUE}08`} />
 <line x1={25} y1={65} x2={65} y2={65} stroke={BLUE} strokeWidth={0.5} />
 <line x1={45} y1={55} x2={45} y2={90} stroke={BLUE} strokeWidth={0.5} />
 {/* Arrow pointing to globe */}
 <path d="M68 72 L110 72" stroke={TEAL} strokeWidth={0.8} strokeDasharray="4 3" className="illus-dash" />
 <polygon points="108,69 114,72 108,75" fill={TEAL} opacity={0.5} />
 </g>
 {/* Document — right */}
 <g opacity={0.55}>
 <rect x={240} y={45} width={55} height={65} rx={3} stroke={BLUE} strokeWidth={1} fill={`${BLUE}06`} />
 <line x1={250} y1={58} x2={285} y2={58} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={250} y1={66} x2={280} y2={66} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={250} y1={74} x2={282} y2={74} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <circle cx={275} cy={92} r={8} stroke={TEAL} strokeWidth={0.8} fill={`${TEAL}10`} />
 <path d="M271 92 L274 95 L280 89" stroke={TEAL} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
 {/* Arrow from globe */}
 <path d="M208 72 L238 65" stroke={TEAL} strokeWidth={0.8} strokeDasharray="4 3" />
 </g>
 {/* Ambient dots */}
 <g opacity={0.3} className="illus-glow">
 {[{x:10,y:20},{x:308,y:18},{x:15,y:145},{x:300,y:148},{x:160,y:5}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}

export function OEMIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* EV / vehicle outline */}
 <g opacity={0.55}>
 <path d="M80 95 L95 65 L225 65 L240 95" stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
 <line x1={70} y1={95} x2={250} y2={95} stroke={BLUE} strokeWidth={1.2} strokeLinecap="round" />
 {/* Wheels */}
 <circle cx={110} cy={100} r={12} stroke={BLUE} strokeWidth={1} />
 <circle cx={110} cy={100} r={5} stroke={CYAN} strokeWidth={0.5} fill={`${CYAN}10`} />
 <circle cx={210} cy={100} r={12} stroke={BLUE} strokeWidth={1} />
 <circle cx={210} cy={100} r={5} stroke={CYAN} strokeWidth={0.5} fill={`${CYAN}10`} />
 {/* Windows */}
 <path d="M105 68 L115 68 L115 90 L100 90 Z" stroke={CYAN} strokeWidth={0.5} fill={`${CYAN}06`} />
 <path d="M120 68 L200 68 L200 90 L120 90 Z" stroke={CYAN} strokeWidth={0.5} fill={`${CYAN}06`} />
 </g>
 {/* Battery pack underneath */}
 <g opacity={0.45} className="illus-pulse-d1">
 <rect x={100} y={112} width={120} height={22} rx={3} stroke={TEAL} strokeWidth={1} fill={`${TEAL}08`} />
 {/* Cells inside pack */}
 {[110, 130, 150, 170, 190].map((x, i) => (
 <rect key={i} x={x} y={116} width={14} height={14} rx={1.5} stroke={TEAL} strokeWidth={0.5} fill={`${TEAL}08`} />
 ))}
 {/* Verified badge */}
 <circle cx={245} cy={123} r={10} stroke={TEAL} strokeWidth={0.8} fill={`${TEAL}10`} />
 <path d="M241 123 L244 126 L250 120" stroke={TEAL} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
 </g>
 {/* Supply chain arrow */}
 <g opacity={0.3} className="illus-dash">
 <path d="M30 50 L80 50" stroke={CYAN} strokeWidth={0.7} strokeDasharray="4 3" />
 <polygon points="78,47 84,50 78,53" fill={CYAN} opacity={0.5} />
 <text x={20} y={45} fontSize={6} fontFamily="monospace" fill={BLUE} opacity={0.4}>IN</text>
 </g>
 {/* Ambient dots */}
 <g opacity={0.3} className="illus-glow">
 {[{x:15,y:20},{x:305,y:25},{x:10,y:150},{x:305,y:145},{x:160,y:8}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}

export function RecyclerIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Recycling arrows — center */}
 <g>
 <circle cx={160} cy={75} r={45} stroke={TEAL} strokeWidth={0.4} opacity={0.15} />
 {/* Arrow 1 */}
 <path d="M160 35 C190 35 215 55 215 75" stroke={TEAL} strokeWidth={1.3} strokeLinecap="round" fill="none" />
 <polygon points="215,68 222,77 208,77" fill={TEAL} opacity={0.5} />
 {/* Arrow 2 */}
 <path d="M210 85 C205 110 185 125 160 120" stroke={TEAL} strokeWidth={1.3} strokeLinecap="round" fill="none" />
 <polygon points="167,120 160,127 158,114" fill={TEAL} opacity={0.5} />
 {/* Arrow 3 */}
 <path d="M152 115 C130 110 110 95 110 72" stroke={TEAL} strokeWidth={1.3} strokeLinecap="round" fill="none" />
 <polygon points="110,80 103,70 117,70" fill={TEAL} opacity={0.5} />
 {/* Center battery */}
 <rect x={148} y={62} width={24} height={30} rx={3} stroke={BLUE} strokeWidth={0.8} />
 <rect x={155} y={58} width={10} height={5} rx={1.5} stroke={BLUE} strokeWidth={0.7} />
 <rect x={152} y={78} width={16} height={4} rx={0.5} fill={TEAL} opacity={0.3} />
 <rect x={152} y={72} width={16} height={4} rx={0.5} fill={TEAL} opacity={0.2} />
 </g>
 {/* Lifecycle history document */}
 <g opacity={0.45} className="illus-pulse-d1">
 <rect x={245} y={40} width={55} height={70} rx={3} stroke={BLUE} strokeWidth={0.8} fill={`${BLUE}06`} />
 <line x1={253} y1={55} x2={292} y2={55} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={253} y1={63} x2={288} y2={63} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={253} y1={71} x2={290} y2={71} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={253} y1={79} x2={285} y2={79} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 <line x1={253} y1={87} x2={280} y2={87} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />
 <line x1={253} y1={95} x2={287} y2={95} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />
 </g>
 {/* Leaf */}
 <g opacity={0.4} className="illus-float">
 <path d="M35 55 Q50 40 60 58 Q48 65 35 55 Z" stroke={TEAL} strokeWidth={0.8} fill={`${TEAL}10`} />
 <line x1={47} y1={47} x2={47} y2={62} stroke={TEAL} strokeWidth={0.4} />
 </g>
 {/* Ambient dots */}
 <g opacity={0.3} className="illus-glow">
 {[{x:15,y:20},{x:305,y:18},{x:10,y:148},{x:308,y:145},{x:160,y:5}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}
