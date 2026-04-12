const BLUE = "#8FB8DE";
const CYAN = "#7EC8E3";
const TEAL = "#7ECFC0";
const PURPLE = "#C4B5E0";
const LAVENDER = "#B4A7D6";

export function CreateBatchIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* CSV document */}
 <rect x={110} y={20} width={100} height={120} rx={5} stroke={BLUE} strokeWidth={1.2} fill={`${BLUE}08`} />
 <rect x={110} y={20} width={100} height={18} rx={5} stroke={BLUE} strokeWidth={0.6} fill={`${BLUE}10`} />
 <text x={135} y={33} fontSize={7} fontFamily="monospace" fill={BLUE} opacity={0.5}>CSV</text>
 {/* Grid lines */}
 {[50, 65, 80, 95, 110, 125].map((y, i) => (
 <line key={`h-${i}`} x1={118} y1={y} x2={202} y2={y} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 ))}
 {[140, 165, 185].map((x, i) => (
 <line key={`v-${i}`} x1={x} y1={42} x2={x} y2={132} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 ))}
 {/* Cell hints */}
 <g opacity={0.3}>
 <line x1={120} y1={57} x2={135} y2={57} stroke={CYAN} strokeWidth={0.5} />
 <line x1={143} y1={57} x2={160} y2={57} stroke={CYAN} strokeWidth={0.5} />
 <line x1={168} y1={57} x2={182} y2={57} stroke={TEAL} strokeWidth={0.5} />
 <line x1={120} y1={72} x2={133} y2={72} stroke={CYAN} strokeWidth={0.5} />
 <line x1={143} y1={72} x2={158} y2={72} stroke={CYAN} strokeWidth={0.5} />
 <line x1={168} y1={72} x2={180} y2={72} stroke={TEAL} strokeWidth={0.5} />
 </g>
 {/* Upload arrow */}
 <g opacity={0.55}>
 <circle cx={55} cy={80} r={22} stroke={TEAL} strokeWidth={1} fill={`${TEAL}08`} />
 <line x1={55} y1={92} x2={55} y2={70} stroke={TEAL} strokeWidth={1.2} strokeLinecap="round" />
 <path d="M48 76 L55 68 L62 76" stroke={TEAL} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
 </g>
 {/* API connector right */}
 <g opacity={0.45}>
 <rect x={240} y={60} width={50} height={40} rx={4} stroke={CYAN} strokeWidth={0.8} fill={`${CYAN}06`} />
 <text x={248} y={84} fontSize={8} fontFamily="monospace" fill={CYAN} opacity={0.5}>API</text>
 <circle cx={265} cy={65} r={2} fill={TEAL} opacity={0.5} />
 </g>
 {/* Connection lines */}
 <g opacity={0.2}>
 <path d="M77 80 L110 80" stroke={CYAN} strokeWidth={0.7} strokeDasharray="4 3" />
 <path d="M210 80 L240 80" stroke={CYAN} strokeWidth={0.7} strokeDasharray="4 3" />
 </g>
 {/* Ambient dots */}
 <g opacity={0.3}>
 {[{x:20,y:30},{x:300,y:25},{x:25,y:140},{x:290,y:145},{x:160,y:10}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}

export function GeneratePassportsIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Passport card */}
 <rect x={90} y={25} width={140} height={90} rx={6} stroke={BLUE} strokeWidth={1.2} fill={`${BLUE}08`} />
 <rect x={98} y={33} width={124} height={74} rx={4} stroke={BLUE} strokeWidth={0.4} opacity={0.3} />
 {/* QR code */}
 <g opacity={0.5}>
 <rect x={105} y={40} width={40} height={40} rx={2} stroke={CYAN} strokeWidth={0.8} />
 <rect x={109} y={44} width={10} height={10} rx={1} fill={CYAN} opacity={0.3} />
 <rect x={125} y={44} width={10} height={10} rx={1} fill={CYAN} opacity={0.3} />
 <rect x={109} y={60} width={10} height={10} rx={1} fill={CYAN} opacity={0.3} />
 <rect x={121} y={56} width={6} height={6} fill={CYAN} opacity={0.2} />
 <rect x={129} y={62} width={6} height={6} fill={CYAN} opacity={0.2} />
 </g>
 {/* Passport text lines */}
 <line x1={155} y1={48} x2={215} y2={48} stroke={BLUE} strokeWidth={0.5} opacity={0.3} />
 <line x1={155} y1={56} x2={205} y2={56} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />
 <line x1={155} y1={64} x2={210} y2={64} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />
 {/* Chip */}
 <rect x={185} y={78} width={16} height={12} rx={2} stroke={CYAN} strokeWidth={0.6} fill={`${CYAN}10`} />
 <line x1={189} y1={78} x2={189} y2={90} stroke={CYAN} strokeWidth={0.3} />
 <line x1={195} y1={78} x2={195} y2={90} stroke={CYAN} strokeWidth={0.3} />
 {/* Badge checkmark */}
 <circle cx={250} cy={45} r={14} stroke={TEAL} strokeWidth={1} fill={`${TEAL}10`} />
 <path d="M244 45 L248 49 L257 40" stroke={TEAL} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
 {/* Generation sparkle lines */}
 <g opacity={0.4}>
 <path d="M55 50 C70 45 80 40 90 38" stroke={LAVENDER} strokeWidth={0.6} strokeDasharray="3 3" />
 <path d="M55 80 C70 78 80 72 90 68" stroke={LAVENDER} strokeWidth={0.6} strokeDasharray="3 3" />
 <path d="M50 65 L40 65" stroke={LAVENDER} strokeWidth={0.6} />
 <circle cx={50} cy={65} r={8} stroke={LAVENDER} strokeWidth={0.7} strokeDasharray="2 2" />
 </g>
 {/* Multiple passport stack hint */}
 <g opacity={0.2}>
 <rect x={95} y={120} width={130} height={10} rx={3} stroke={BLUE} strokeWidth={0.6} />
 <rect x={100} y={126} width={120} height={8} rx={3} stroke={BLUE} strokeWidth={0.5} />
 </g>
 {/* Ambient dots */}
 <g opacity={0.3}>
 {[{x:15,y:25},{x:305,y:30},{x:20,y:140},{x:300,y:140},{x:160,y:8}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}

export function TrackLifecycleIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* Timeline line */}
 <line x1={40} y1={80} x2={280} y2={80} stroke={BLUE} strokeWidth={0.8} opacity={0.3} />
 {/* Timeline nodes */}
 {[{x:60,label:"MFG",active:true},{x:120,label:"TEST",active:true},{x:180,label:"SHIP",active:true},{x:240,label:"EOL",active:false}].map((node, i) => (
 <g key={i}>
 <circle cx={node.x} cy={80} r={12} stroke={node.active ? TEAL : BLUE} strokeWidth={1} fill={node.active ? `${TEAL}15` : `${BLUE}08`} />
 {node.active && <circle cx={node.x} cy={80} r={4} fill={TEAL} opacity={0.5} />}
 <text x={node.x} y={105} fontSize={6} fontFamily="monospace" fill={BLUE} opacity={0.4} textAnchor="middle">{node.label}</text>
 {/* Connecting segment highlight */}
 {i < 3 && (
 <line x1={node.x + 12} y1={80} x2={node.x + 48} y2={80} stroke={node.active ? TEAL : BLUE} strokeWidth={node.active ? 1 : 0.5} opacity={node.active ? 0.4 : 0.2} />
 )}
 </g>
 ))}
 {/* Battery with lifecycle tracking */}
 <g opacity={0.5}>
 <rect x={130} y={25} width={60} height={35} rx={4} stroke={BLUE} strokeWidth={1} />
 <rect x={150} y={20} width={20} height={6} rx={2} stroke={BLUE} strokeWidth={0.8} />
 <rect x={136} y={42} width={48} height={6} rx={1} fill={TEAL} opacity={0.3} />
 <rect x={136} y={34} width={48} height={6} rx={1} fill={TEAL} opacity={0.2} />
 </g>
 {/* Audit trail markers */}
 <g opacity={0.4}>
 <rect x={50} y={120} width={220} height={25} rx={3} stroke={BLUE} strokeWidth={0.6} fill={`${BLUE}06`} />
 <text x={62} y={136} fontSize={6} fontFamily="monospace" fill={CYAN} opacity={0.5}>AUDIT TRAIL</text>
 {[130, 155, 180, 205, 230].map((x, i) => (
 <line key={i} x1={x} y1={125} x2={x + 15} y2={125} stroke={CYAN} strokeWidth={0.4} opacity={0.3} />
 ))}
 {[130, 155, 180, 205, 230].map((x, i) => (
 <line key={`b-${i}`} x1={x} y1={132} x2={x + 12} y2={132} stroke={CYAN} strokeWidth={0.3} opacity={0.25} />
 ))}
 </g>
 {/* Connection: battery to timeline */}
 <path d="M160 60 L160 68" stroke={CYAN} strokeWidth={0.6} strokeDasharray="2 2" opacity={0.3} />
 {/* Ambient dots */}
 <g opacity={0.3}>
 {[{x:15,y:20},{x:305,y:25},{x:10,y:145},{x:305,y:150},{x:160,y:8}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}

export function ExportCompliantIllustration({ className }: { className?: string }) {
 return (
 <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
 {/* QR label sheet */}
 <g opacity={0.55}>
 <rect x={30} y={30} width={80} height={100} rx={4} stroke={BLUE} strokeWidth={1} fill={`${BLUE}06`} />
 {/* Mini QR codes on sheet */}
 {[0,1,2].map(row => [0,1].map(col => (
 <g key={`${row}-${col}`}>
 <rect x={40 + col * 35} y={40 + row * 30} width={22} height={22} rx={2} stroke={CYAN} strokeWidth={0.5} fill={`${CYAN}06`} />
 <rect x={43 + col * 35} y={43 + row * 30} width={6} height={6} rx={0.5} fill={CYAN} opacity={0.2} />
 <rect x={51 + col * 35} y={43 + row * 30} width={6} height={6} rx={0.5} fill={CYAN} opacity={0.2} />
 <rect x={43 + col * 35} y={51 + row * 30} width={6} height={6} rx={0.5} fill={CYAN} opacity={0.2} />
 </g>
 )))}
 </g>
 {/* Document with checkmark */}
 <g>
 <rect x={150} y={20} width={90} height={120} rx={5} stroke={BLUE} strokeWidth={1.2} fill={`${BLUE}08`} />
 <line x1={162} y1={42} x2={228} y2={42} stroke={BLUE} strokeWidth={0.5} opacity={0.3} />
 <line x1={162} y1={52} x2={220} y2={52} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />
 <line x1={162} y1={62} x2={225} y2={62} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />
 <line x1={162} y1={72} x2={215} y2={72} stroke={BLUE} strokeWidth={0.4} opacity={0.25} />
 {/* Big checkmark */}
 <circle cx={195} cy={105} r={18} stroke={TEAL} strokeWidth={1.2} fill={`${TEAL}10`} />
 <path d="M186 105 L192 111 L205 98" stroke={TEAL} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
 </g>
 {/* Download arrow */}
 <g opacity={0.5}>
 <circle cx={275} cy={80} r={18} stroke={TEAL} strokeWidth={0.8} fill={`${TEAL}06`} />
 <line x1={275} y1={72} x2={275} y2={88} stroke={TEAL} strokeWidth={1} strokeLinecap="round" />
 <path d="M269 84 L275 90 L281 84" stroke={TEAL} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
 </g>
 {/* Flow arrows */}
 <g opacity={0.2}>
 <path d="M113 80 L148 80" stroke={CYAN} strokeWidth={0.7} strokeDasharray="4 3" />
 <path d="M242 80 L255 80" stroke={CYAN} strokeWidth={0.7} strokeDasharray="4 3" />
 </g>
 {/* Ambient dots */}
 <g opacity={0.3}>
 {[{x:15,y:20},{x:308,y:25},{x:10,y:145},{x:308,y:145},{x:160,y:8}].map((d, i) => (
 <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={PURPLE} />
 ))}
 </g>
 </svg>
 );
}
