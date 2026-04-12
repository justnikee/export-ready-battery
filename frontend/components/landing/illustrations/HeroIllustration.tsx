const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 480" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* ===== BACKGROUND GRID ===== */}
      <g opacity={0.08}>
        {/* Isometric ground plane lines going right */}
        <line x1="0" y1="380" x2="1440" y2="380" stroke={COLORS.outline} strokeWidth="0.5" />
        <line x1="0" y1="400" x2="1440" y2="400" stroke={COLORS.outline} strokeWidth="0.5" />
        <line x1="0" y1="420" x2="1440" y2="420" stroke={COLORS.outline} strokeWidth="0.5" />
        <line x1="0" y1="440" x2="1440" y2="440" stroke={COLORS.outline} strokeWidth="0.5" />
        <line x1="0" y1="460" x2="1440" y2="460" stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Isometric diagonals left-to-right */}
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={`dg1-${i}`} x1={i * 50} y1="480" x2={i * 50 + 200} y2="340" stroke={COLORS.outline} strokeWidth="0.3" />
        ))}
        {/* Isometric diagonals right-to-left */}
        {Array.from({ length: 30 }).map((_, i) => (
          <line key={`dg2-${i}`} x1={i * 50 + 200} y1="480" x2={i * 50} y2="340" stroke={COLORS.outline} strokeWidth="0.3" />
        ))}
      </g>

      {/* ===== CONNECTING LINES BETWEEN ZONES ===== */}
      <g opacity={0.1}>
        <line x1="380" y1="300" x2="440" y2="280" stroke={COLORS.brightGreen} strokeWidth="0.5" />
        <line x1="400" y1="350" x2="500" y2="310" stroke={COLORS.brightGreen} strokeWidth="0.5" />
        <line x1="1020" y1="290" x2="1080" y2="270" stroke={COLORS.brightGreen} strokeWidth="0.5" />
        <line x1="1040" y1="340" x2="1100" y2="320" stroke={COLORS.brightGreen} strokeWidth="0.5" />
        <line x1="300" y1="250" x2="500" y2="200" stroke={COLORS.teal} strokeWidth="0.4" />
        <line x1="950" y1="200" x2="1150" y2="250" stroke={COLORS.teal} strokeWidth="0.4" />
        <line x1="600" y1="150" x2="850" y2="150" stroke={COLORS.neonGreen} strokeWidth="0.3" />
        <line x1="400" y1="180" x2="1050" y2="180" stroke={COLORS.outline} strokeWidth="0.3" />
      </g>

      {/* ===== LEFT ZONE: FACTORY/MANUFACTURING (0-400) ===== */}
      <g>
        {/* Factory base platform */}
        <polygon points="40,380 200,340 360,380 200,420" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Platform grid dashes */}
        <g opacity={0.1}>
          <line x1="80" y1="368" x2="240" y2="328" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="120" y1="390" x2="280" y2="350" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="120" y1="355" x2="280" y2="395" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="160" y1="345" x2="320" y2="385" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="4 4" />
        </g>

        {/* Factory building - left face */}
        <polygon points="60,370 60,240 170,200 170,330" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Factory building - right face */}
        <polygon points="170,200 170,330 280,370 280,240" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Factory building - top */}
        <polygon points="60,240 170,200 280,240 170,280" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Factory windows */}
        <rect x="85" y="260" width="20" height="14" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.7} />
        <rect x="115" y="250" width="20" height="14" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.7} />
        <rect x="85" y="290" width="20" height="14" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.7} />
        <rect x="115" y="280" width="20" height="14" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.7} />
        {/* Right face windows */}
        <rect x="195" y="250" width="20" height="14" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.6} />
        <rect x="225" y="260" width="20" height="14" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.6} />
        <rect x="195" y="280" width="20" height="14" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.6} />
        <rect x="225" y="290" width="20" height="14" rx="1" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.6} />

        {/* Chimney 1 */}
        <rect x="100" y="200" width="12" height="40" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" />
        <rect x="97" y="195" width="18" height="8" rx="1" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Smoke from chimney 1 */}
        <path d="M106 195 Q108 175 104 160 Q100 145 106 130" stroke={COLORS.outline} strokeWidth="0.8" opacity={0.15} fill="none" />
        <path d="M110 195 Q114 178 110 165 Q106 150 112 135" stroke={COLORS.outline} strokeWidth="0.5" opacity={0.1} fill="none" />
        {/* Chimney 2 */}
        <rect x="140" y="185" width="12" height="35" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" />
        <rect x="137" y="180" width="18" height="8" rx="1" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Smoke from chimney 2 */}
        <path d="M146 180 Q150 160 146 145 Q142 130 148 115" stroke={COLORS.outline} strokeWidth="0.8" opacity={0.15} fill="none" />

        {/* Conveyor belt */}
        <line x1="280" y1="350" x2="390" y2="370" stroke={COLORS.outline} strokeWidth="1.2" />
        <line x1="280" y1="345" x2="390" y2="365" stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Conveyor support legs */}
        <line x1="310" y1="355" x2="310" y2="385" stroke={COLORS.outline} strokeWidth="0.8" />
        <line x1="350" y1="363" x2="350" y2="393" stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Battery shapes on conveyor */}
        <rect x="290" y="340" width="10" height="16" rx="2" fill={COLORS.brightGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.7} />
        <rect x="288" y="338" width="14" height="3" rx="1" fill={COLORS.neonGreen} opacity={0.6} />
        <rect x="320" y="346" width="10" height="16" rx="2" fill={COLORS.brightGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.7} />
        <rect x="318" y="344" width="14" height="3" rx="1" fill={COLORS.neonGreen} opacity={0.6} />
        <rect x="350" y="352" width="10" height="16" rx="2" fill={COLORS.brightGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.7} />
        <rect x="348" y="350" width="14" height="3" rx="1" fill={COLORS.neonGreen} opacity={0.6} />

        {/* Stacked platforms/steps to the left of factory */}
        <polygon points="20,420 20,410 80,390 140,410 140,420 80,400" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
        <polygon points="20,410 80,390 140,410 80,430" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.6} />
        <polygon points="30,430 30,425 70,415 110,425 110,430 70,420" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.4" />

        {/* Plants on building walls */}
        <g opacity={0.6}>
          {/* Vine on left wall */}
          <path d="M62 370 Q58 340 65 310 Q70 285 63 260" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
          <circle cx="60" cy="310" r="3" fill={COLORS.lightGreen} opacity={0.5} />
          <circle cx="66" cy="285" r="2.5" fill={COLORS.neonGreen} opacity={0.4} />
          <circle cx="62" cy="340" r="2" fill={COLORS.lightGreen} opacity={0.5} />
          {/* Vine on right wall */}
          <path d="M278 370 Q282 345 276 320 Q272 300 278 280" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
          <circle cx="280" cy="320" r="3" fill={COLORS.lightGreen} opacity={0.5} />
          <circle cx="275" cy="300" r="2" fill={COLORS.neonGreen} opacity={0.4} />
        </g>
        {/* Ground-level plants */}
        <g opacity={0.5}>
          <path d="M30 420 Q25 405 35 395" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
          <circle cx="35" cy="393" r="3" fill={COLORS.lightGreen} opacity={0.6} />
          <path d="M350 390 Q345 378 355 370" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
          <circle cx="355" cy="368" r="2.5" fill={COLORS.neonGreen} opacity={0.5} />
        </g>

        {/* Worker figures in factory zone */}
        {/* Worker 1 - near conveyor */}
        <g>
          <circle cx="305" cy="320" r="3.5" fill={COLORS.figureLight} opacity={0.8} />
          <rect x="302" y="324" width="6" height="11" rx="1.5" fill={COLORS.figureLight} opacity={0.7} />
          <line x1="304" y1="335" x2="302" y2="345" stroke={COLORS.figureLight} strokeWidth="1.2" />
          <line x1="308" y1="335" x2="310" y2="345" stroke={COLORS.figureLight} strokeWidth="1.2" />
        </g>
        {/* Worker 2 - near factory entrance */}
        <g>
          <circle cx="190" cy="315" r="3" fill={COLORS.figureLight} opacity={0.7} />
          <rect x="187.5" y="318.5" width="5" height="10" rx="1.5" fill={COLORS.figureLight} opacity={0.6} />
          <line x1="189" y1="328.5" x2="187" y2="337" stroke={COLORS.figureLight} strokeWidth="1" />
          <line x1="193" y1="328.5" x2="195" y2="337" stroke={COLORS.figureLight} strokeWidth="1" />
        </g>
        {/* Worker 3 - on steps */}
        <g>
          <circle cx="80" cy="378" r="3" fill={COLORS.figureLight} opacity={0.7} />
          <rect x="77.5" y="381.5" width="5" height="9" rx="1.5" fill={COLORS.figureLight} opacity={0.6} />
          <line x1="79" y1="390.5" x2="77" y2="398" stroke={COLORS.figureLight} strokeWidth="1" />
          <line x1="83" y1="390.5" x2="85" y2="398" stroke={COLORS.figureLight} strokeWidth="1" />
        </g>
        {/* Worker 4 - clipboard person */}
        <g>
          <circle cx="240" cy="330" r="3" fill={COLORS.figureLight} opacity={0.75} />
          <rect x="237.5" y="333.5" width="5" height="10" rx="1.5" fill={COLORS.figureLight} opacity={0.65} />
          <line x1="239" y1="343.5" x2="237" y2="352" stroke={COLORS.figureLight} strokeWidth="1" />
          <line x1="243" y1="343.5" x2="245" y2="352" stroke={COLORS.figureLight} strokeWidth="1" />
          {/* Clipboard */}
          <rect x="246" y="335" width="6" height="8" rx="0.5" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.4" />
        </g>
      </g>

      {/* ===== CENTER ZONE: MAIN PLAZA (400-1040) ===== */}
      <g>
        {/* Large hexagonal platform */}
        <polygon points="720,220 840,280 840,360 720,420 600,360 600,280" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="1" />
        {/* Platform top surface */}
        <polygon points="720,220 840,280 720,340 600,280" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Platform grid on top */}
        <g opacity={0.1}>
          <line x1="640" y1="260" x2="760" y2="320" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="680" y1="240" x2="800" y2="300" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="660" y1="295" x2="780" y2="235" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="680" y1="310" x2="800" y2="250" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="700" y1="325" x2="820" y2="265" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="3 3" />
        </g>

        {/* Elevated sub-platform left */}
        <polygon points="500,320 600,280 700,320 600,360" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.7" />
        <polygon points="500,320 500,340 600,380 600,360" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
        <polygon points="600,360 600,380 700,340 700,320" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.8} />

        {/* Elevated sub-platform right */}
        <polygon points="740,320 840,280 940,320 840,360" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.7" />
        <polygon points="740,320 740,340 840,380 840,360" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
        <polygon points="840,360 840,380 940,340 940,320" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.8} />

        {/* Stairs going up to center left */}
        {[0, 1, 2, 3, 4].map((i) => (
          <polygon key={`stl-${i}`} points={`${480 + i * 15},${350 - i * 10} ${510 + i * 15},${335 - i * 10} ${525 + i * 15},${342 - i * 10} ${495 + i * 15},${357 - i * 10}`} fill={i % 2 === 0 ? COLORS.midGreen : COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.4" />
        ))}
        {/* Stairs going up to center right */}
        {[0, 1, 2, 3, 4].map((i) => (
          <polygon key={`str-${i}`} points={`${960 - i * 15},${350 - i * 10} ${930 - i * 15},${335 - i * 10} ${915 - i * 15},${342 - i * 10} ${945 - i * 15},${357 - i * 10}`} fill={i % 2 === 0 ? COLORS.midGreen : COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.4" />
        ))}

        {/* Ramp from left zone to center */}
        <polygon points="400,370 480,350 500,360 420,380" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Ramp from right zone to center */}
        <polygon points="1040,370 960,350 940,360 1020,380" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />

        {/* ---- Central pedestal with battery-passport symbol ---- */}
        {/* Pedestal base */}
        <polygon points="720,260 760,280 720,300 680,280" fill={COLORS.brandGreen} stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Pedestal pillar left */}
        <polygon points="680,280 680,250 720,230 720,260" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Pedestal pillar right */}
        <polygon points="720,260 720,230 760,250 760,280" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Pedestal top */}
        <polygon points="720,230 760,250 720,270 680,250" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Glow effect */}
        <ellipse cx="720" cy="260" rx="30" ry="15" fill={COLORS.neonGreen} opacity={0.08} />
        <ellipse cx="720" cy="260" rx="20" ry="10" fill={COLORS.neonGreen} opacity={0.12} />

        {/* Battery outline on pedestal */}
        <rect x="710" y="235" width="20" height="30" rx="3" fill="none" stroke={COLORS.neonGreen} strokeWidth="1.2" opacity={0.9} />
        <rect x="715" y="232" width="10" height="4" rx="1" fill={COLORS.neonGreen} opacity={0.7} />
        {/* QR pattern inside battery */}
        <g opacity={0.6}>
          <rect x="714" y="240" width="4" height="4" fill={COLORS.neonGreen} />
          <rect x="720" y="240" width="4" height="4" fill={COLORS.neonGreen} />
          <rect x="726" y="240" width="4" height="4" fill={COLORS.neonGreen} />
          <rect x="714" y="246" width="4" height="4" fill={COLORS.neonGreen} />
          <rect x="726" y="246" width="4" height="4" fill={COLORS.neonGreen} />
          <rect x="714" y="252" width="4" height="4" fill={COLORS.neonGreen} />
          <rect x="720" y="252" width="4" height="4" fill={COLORS.neonGreen} />
          <rect x="726" y="252" width="4" height="4" fill={COLORS.neonGreen} />
          <rect x="720" y="246" width="2" height="2" fill={COLORS.lightGreen} />
        </g>

        {/* Floating geometric nodes above plaza */}
        <g opacity={0.35}>
          <circle cx="680" cy="170" r="4" fill={COLORS.brightGreen} />
          <circle cx="760" cy="160" r="3.5" fill={COLORS.neonGreen} />
          <circle cx="720" cy="140" r="5" fill={COLORS.teal} />
          <circle cx="650" cy="190" r="3" fill={COLORS.lightGreen} />
          <circle cx="790" cy="185" r="3" fill={COLORS.brightGreen} />
          <circle cx="720" cy="110" r="3" fill={COLORS.neonGreen} />
          <circle cx="660" cy="145" r="2.5" fill={COLORS.teal} />
          <circle cx="780" cy="140" r="2.5" fill={COLORS.lightGreen} />
          {/* Connecting lines between nodes */}
          <line x1="680" y1="170" x2="720" y2="140" stroke={COLORS.brightGreen} strokeWidth="0.5" />
          <line x1="760" y1="160" x2="720" y2="140" stroke={COLORS.neonGreen} strokeWidth="0.5" />
          <line x1="720" y1="140" x2="720" y2="110" stroke={COLORS.teal} strokeWidth="0.5" />
          <line x1="650" y1="190" x2="680" y2="170" stroke={COLORS.lightGreen} strokeWidth="0.4" />
          <line x1="790" y1="185" x2="760" y2="160" stroke={COLORS.brightGreen} strokeWidth="0.4" />
          <line x1="660" y1="145" x2="680" y2="170" stroke={COLORS.teal} strokeWidth="0.3" />
          <line x1="780" y1="140" x2="760" y2="160" stroke={COLORS.lightGreen} strokeWidth="0.3" />
          <line x1="660" y1="145" x2="720" y2="140" stroke={COLORS.outline} strokeWidth="0.3" />
          <line x1="780" y1="140" x2="720" y2="140" stroke={COLORS.outline} strokeWidth="0.3" />
        </g>

        {/* Palm-like trees */}
        {/* Tree 1 - left of plaza */}
        <g>
          <line x1="550" y1="350" x2="550" y2="260" stroke={COLORS.outline} strokeWidth="1.5" />
          <path d="M550 260 Q530 250 520 240" stroke={COLORS.brightGreen} strokeWidth="1" fill="none" />
          <path d="M550 260 Q540 245 535 235" stroke={COLORS.lightGreen} strokeWidth="1" fill="none" />
          <path d="M550 260 Q560 245 565 235" stroke={COLORS.brightGreen} strokeWidth="1" fill="none" />
          <path d="M550 260 Q570 250 580 240" stroke={COLORS.lightGreen} strokeWidth="1" fill="none" />
          <path d="M550 260 Q548 240 550 230" stroke={COLORS.neonGreen} strokeWidth="0.8" fill="none" />
          <ellipse cx="550" cy="240" rx="25" ry="12" fill={COLORS.brightGreen} opacity={0.15} />
        </g>
        {/* Tree 2 - right of plaza */}
        <g>
          <line x1="890" y1="350" x2="890" y2="255" stroke={COLORS.outline} strokeWidth="1.5" />
          <path d="M890 255 Q870 245 860 235" stroke={COLORS.brightGreen} strokeWidth="1" fill="none" />
          <path d="M890 255 Q880 240 875 230" stroke={COLORS.lightGreen} strokeWidth="1" fill="none" />
          <path d="M890 255 Q900 240 905 230" stroke={COLORS.brightGreen} strokeWidth="1" fill="none" />
          <path d="M890 255 Q910 245 920 235" stroke={COLORS.lightGreen} strokeWidth="1" fill="none" />
          <path d="M890 255 Q888 235 890 225" stroke={COLORS.neonGreen} strokeWidth="0.8" fill="none" />
          <ellipse cx="890" cy="235" rx="25" ry="12" fill={COLORS.brightGreen} opacity={0.15} />
        </g>
        {/* Tree 3 - center back */}
        <g>
          <line x1="720" y1="320" x2="720" y2="200" stroke={COLORS.outline} strokeWidth="1" opacity={0.5} />
          <path d="M720 200 Q700 190 690 182" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" opacity={0.6} />
          <path d="M720 200 Q740 190 750 182" stroke={COLORS.lightGreen} strokeWidth="0.8" fill="none" opacity={0.6} />
          <path d="M720 200 Q718 185 720 175" stroke={COLORS.neonGreen} strokeWidth="0.7" fill="none" opacity={0.6} />
        </g>

        {/* Human figures on center plaza */}
        {/* Figure 1 - walking left on platform */}
        <g>
          <circle cx="620" cy="300" r="3.5" fill={COLORS.figureLight} opacity={0.8} />
          <rect x="617" y="304" width="6" height="11" rx="1.5" fill={COLORS.figureLight} opacity={0.7} />
          <line x1="619" y1="315" x2="616" y2="326" stroke={COLORS.figureLight} strokeWidth="1.2" />
          <line x1="623" y1="315" x2="626" y2="326" stroke={COLORS.figureLight} strokeWidth="1.2" />
        </g>
        {/* Figure 2 - near pedestal */}
        <g>
          <circle cx="695" cy="268" r="3.5" fill={COLORS.figureLight} opacity={0.85} />
          <rect x="692" y="272" width="6" height="12" rx="1.5" fill={COLORS.figureLight} opacity={0.75} />
          <line x1="694" y1="284" x2="692" y2="295" stroke={COLORS.figureLight} strokeWidth="1.3" />
          <line x1="698" y1="284" x2="700" y2="295" stroke={COLORS.figureLight} strokeWidth="1.3" />
        </g>
        {/* Figure 3 - right side of pedestal */}
        <g>
          <circle cx="750" cy="272" r="3" fill={COLORS.figureLight} opacity={0.8} />
          <rect x="747.5" y="275.5" width="5" height="10" rx="1.5" fill={COLORS.figureLight} opacity={0.7} />
          <line x1="749" y1="285.5" x2="747" y2="295" stroke={COLORS.figureLight} strokeWidth="1" />
          <line x1="753" y1="285.5" x2="755" y2="295" stroke={COLORS.figureLight} strokeWidth="1" />
        </g>
        {/* Figure 4 - climbing stairs left */}
        <g>
          <circle cx="520" cy="318" r="3" fill={COLORS.figureLight} opacity={0.7} />
          <rect x="517.5" y="321.5" width="5" height="10" rx="1.5" fill={COLORS.figureLight} opacity={0.6} />
          <line x1="519" y1="331.5" x2="517" y2="340" stroke={COLORS.figureLight} strokeWidth="1" />
          <line x1="523" y1="331.5" x2="525" y2="340" stroke={COLORS.figureLight} strokeWidth="1" />
        </g>
        {/* Figure 5 - walking right on platform */}
        <g>
          <circle cx="820" cy="300" r="3.5" fill={COLORS.figureLight} opacity={0.8} />
          <rect x="817" y="304" width="6" height="11" rx="1.5" fill={COLORS.figureLight} opacity={0.7} />
          <line x1="819" y1="315" x2="817" y2="326" stroke={COLORS.figureLight} strokeWidth="1.2" />
          <line x1="823" y1="315" x2="826" y2="326" stroke={COLORS.figureLight} strokeWidth="1.2" />
        </g>
        {/* Figure 6 - on right stairs */}
        <g>
          <circle cx="920" cy="322" r="3" fill={COLORS.figureLight} opacity={0.7} />
          <rect x="917.5" y="325.5" width="5" height="9" rx="1.5" fill={COLORS.figureLight} opacity={0.6} />
          <line x1="919" y1="334.5" x2="917" y2="342" stroke={COLORS.figureLight} strokeWidth="1" />
          <line x1="923" y1="334.5" x2="925" y2="342" stroke={COLORS.figureLight} strokeWidth="1" />
        </g>

        {/* Small plaza decorations */}
        <circle cx="640" cy="330" r="2" fill={COLORS.neonGreen} opacity={0.2} />
        <circle cx="800" cy="330" r="2" fill={COLORS.neonGreen} opacity={0.2} />
        <circle cx="720" cy="350" r="1.5" fill={COLORS.brightGreen} opacity={0.25} />
      </g>

      {/* ===== RIGHT ZONE: DIGITAL/TECH DISTRICT (1040-1440) ===== */}
      <g>
        {/* Tech platform */}
        <polygon points="1080,370 1240,330 1400,370 1240,410" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.8" />
        <g opacity={0.1}>
          <line x1="1120" y1="358" x2="1280" y2="318" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="1160" y1="380" x2="1320" y2="340" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="1160" y1="345" x2="1320" y2="385" stroke={COLORS.outline} strokeWidth="0.5" strokeDasharray="4 4" />
        </g>

        {/* Holographic dashboard screen */}
        <g>
          {/* Screen frame - angled */}
          <polygon points="1120,200 1280,160 1320,180 1160,220" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="1" opacity={0.8} />
          <polygon points="1160,220 1320,180 1320,310 1160,350" fill={COLORS.darkGreen1} stroke={COLORS.brightGreen} strokeWidth="0.8" opacity={0.7} />
          {/* Screen glow */}
          <polygon points="1165,225 1315,185 1315,305 1165,345" fill={COLORS.brandGreen} opacity={0.15} />
          {/* Data visualization lines on screen */}
          <g opacity={0.5}>
            {/* Bar chart */}
            <rect x="1180" y="290" width="8" height="40" fill={COLORS.brightGreen} opacity={0.6} />
            <rect x="1195" y="275" width="8" height="55" fill={COLORS.neonGreen} opacity={0.5} />
            <rect x="1210" y="285" width="8" height="45" fill={COLORS.teal} opacity={0.5} />
            <rect x="1225" y="260" width="8" height="70" fill={COLORS.brightGreen} opacity={0.6} />
            <rect x="1240" y="270" width="8" height="60" fill={COLORS.lightGreen} opacity={0.5} />
            {/* Line graph */}
            <polyline points="1180,240 1200,225 1220,235 1240,215 1260,220 1280,200 1300,210" stroke={COLORS.neonGreen} strokeWidth="1" fill="none" />
            <polyline points="1180,250 1200,240 1220,248 1240,230 1260,238 1280,225 1300,230" stroke={COLORS.teal} strokeWidth="0.7" fill="none" opacity={0.6} />
            {/* Horizontal grid lines */}
            <line x1="1175" y1="250" x2="1305" y2="210" stroke={COLORS.outline} strokeWidth="0.3" opacity={0.4} />
            <line x1="1175" y1="270" x2="1305" y2="230" stroke={COLORS.outline} strokeWidth="0.3" opacity={0.4} />
            <line x1="1175" y1="290" x2="1305" y2="250" stroke={COLORS.outline} strokeWidth="0.3" opacity={0.4} />
          </g>
        </g>

        {/* Globe wireframe */}
        <g opacity={0.25}>
          <circle cx="1350" cy="250" r="40" fill="none" stroke={COLORS.brightGreen} strokeWidth="0.8" />
          <ellipse cx="1350" cy="250" rx="40" ry="15" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
          <ellipse cx="1350" cy="250" rx="25" ry="40" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
          <ellipse cx="1350" cy="250" rx="40" ry="28" fill="none" stroke={COLORS.outline} strokeWidth="0.3" />
          <line x1="1310" y1="250" x2="1390" y2="250" stroke={COLORS.outline} strokeWidth="0.4" />
          <line x1="1350" y1="210" x2="1350" y2="290" stroke={COLORS.outline} strokeWidth="0.4" />
        </g>

        {/* Shipping container with checkmark */}
        <g>
          {/* Container body */}
          <polygon points="1100,350 1100,310 1140,295 1140,335" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.7" />
          <polygon points="1140,295 1140,335 1170,345 1170,305" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.7" />
          <polygon points="1100,310 1140,295 1170,305 1130,320" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.5" />
          {/* Checkmark */}
          <polyline points="1125,322 1132,330 1148,314" stroke={COLORS.neonGreen} strokeWidth="1.5" fill="none" opacity={0.8} />
          {/* Container lines */}
          <line x1="1110" y1="315" x2="1110" y2="345" stroke={COLORS.outline} strokeWidth="0.3" />
          <line x1="1120" y1="312" x2="1120" y2="342" stroke={COLORS.outline} strokeWidth="0.3" />
          <line x1="1130" y1="308" x2="1130" y2="338" stroke={COLORS.outline} strokeWidth="0.3" />
        </g>

        {/* Workstation 1 */}
        <g>
          <polygon points="1200,360 1230,348 1250,358 1220,370" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
          <rect x="1210" y="345" width="18" height="12" rx="1" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.4" />
          <rect x="1213" y="348" width="12" height="7" fill={COLORS.brandGreen} opacity={0.4} />
        </g>
        {/* Workstation 2 */}
        <g>
          <polygon points="1300,370 1330,358 1350,368 1320,380" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
          <rect x="1310" y="355" width="18" height="12" rx="1" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.4" />
          <rect x="1313" y="358" width="12" height="7" fill={COLORS.brandGreen} opacity={0.4} />
        </g>

        {/* Elevated pathway connecting to center */}
        <polygon points="1040,370 1040,360 1080,350 1080,360" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.7} />
        <polygon points="1060,355 1060,345 1100,335 1100,345" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.4" opacity={0.6} />

        {/* Tech figures */}
        {/* Figure at workstation 1 */}
        <g>
          <circle cx="1225" cy="330" r="3.5" fill={COLORS.figureLight} opacity={0.8} />
          <rect x="1222" y="334" width="6" height="11" rx="1.5" fill={COLORS.figureLight} opacity={0.7} />
          <line x1="1224" y1="345" x2="1222" y2="355" stroke={COLORS.figureLight} strokeWidth="1.2" />
          <line x1="1228" y1="345" x2="1230" y2="355" stroke={COLORS.figureLight} strokeWidth="1.2" />
        </g>
        {/* Figure at workstation 2 */}
        <g>
          <circle cx="1325" cy="340" r="3" fill={COLORS.figureLight} opacity={0.75} />
          <rect x="1322.5" y="343.5" width="5" height="10" rx="1.5" fill={COLORS.figureLight} opacity={0.65} />
          <line x1="1324" y1="353.5" x2="1322" y2="362" stroke={COLORS.figureLight} strokeWidth="1" />
          <line x1="1328" y1="353.5" x2="1330" y2="362" stroke={COLORS.figureLight} strokeWidth="1" />
        </g>
        {/* Figure near dashboard */}
        <g>
          <circle cx="1170" cy="320" r="3.5" fill={COLORS.figureLight} opacity={0.8} />
          <rect x="1167" y="324" width="6" height="11" rx="1.5" fill={COLORS.figureLight} opacity={0.7} />
          <line x1="1169" y1="335" x2="1167" y2="345" stroke={COLORS.figureLight} strokeWidth="1.2" />
          <line x1="1173" y1="335" x2="1175" y2="345" stroke={COLORS.figureLight} strokeWidth="1.2" />
        </g>
        {/* Figure near globe */}
        <g>
          <circle cx="1380" cy="305" r="3" fill={COLORS.figureLight} opacity={0.7} />
          <rect x="1377.5" y="308.5" width="5" height="10" rx="1.5" fill={COLORS.figureLight} opacity={0.6} />
          <line x1="1379" y1="318.5" x2="1377" y2="327" stroke={COLORS.figureLight} strokeWidth="1" />
          <line x1="1383" y1="318.5" x2="1385" y2="327" stroke={COLORS.figureLight} strokeWidth="1" />
        </g>

        {/* Plants in tech zone */}
        <g opacity={0.5}>
          <path d="M1090 370 Q1085 355 1095 345" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
          <circle cx="1095" cy="343" r="3" fill={COLORS.lightGreen} opacity={0.5} />
          <path d="M1400 370 Q1395 360 1405 352" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
          <circle cx="1405" cy="350" r="2.5" fill={COLORS.neonGreen} opacity={0.5} />
          <path d="M1280 370 Q1278 358 1285 350" stroke={COLORS.brightGreen} strokeWidth="0.7" fill="none" />
          <circle cx="1285" cy="348" r="2" fill={COLORS.lightGreen} opacity={0.4} />
        </g>
      </g>

      {/* ===== FLOATING HEXAGONS ===== */}
      <g opacity={0.17}>
        {[
          { x: 100, y: 150, s: 18 }, { x: 300, y: 100, s: 14 }, { x: 450, y: 80, s: 20 },
          { x: 600, y: 60, s: 16 }, { x: 850, y: 50, s: 22 }, { x: 1000, y: 75, s: 15 },
          { x: 1150, y: 100, s: 18 }, { x: 1350, y: 130, s: 14 }, { x: 200, y: 200, s: 12 },
          { x: 1050, y: 140, s: 16 }, { x: 720, y: 30, s: 24 }, { x: 400, y: 440, s: 10 },
          { x: 1300, y: 400, s: 12 }, { x: 50, y: 300, s: 10 }, { x: 1420, y: 200, s: 11 },
        ].map((h, i) => (
          <polygon
            key={`hex-${i}`}
            points={[0, 1, 2, 3, 4, 5].map((j) => {
              const angle = (Math.PI / 3) * j - Math.PI / 6;
              return `${h.x + h.s * Math.cos(angle)},${h.y + h.s * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={COLORS.brightGreen}
            strokeWidth="0.6"
          />
        ))}
      </g>

      {/* ===== SCATTERED PARTICLES ===== */}
      <g>
        {[
          { x: 50, y: 120, r: 1.5, o: 0.25 }, { x: 130, y: 80, r: 1, o: 0.2 },
          { x: 230, y: 150, r: 1.2, o: 0.3 }, { x: 340, y: 60, r: 1, o: 0.2 },
          { x: 420, y: 130, r: 1.5, o: 0.25 }, { x: 500, y: 50, r: 1, o: 0.35 },
          { x: 580, y: 100, r: 1.3, o: 0.2 }, { x: 660, y: 80, r: 1, o: 0.3 },
          { x: 770, y: 60, r: 1.5, o: 0.25 }, { x: 850, y: 90, r: 1, o: 0.2 },
          { x: 940, y: 70, r: 1.2, o: 0.3 }, { x: 1020, y: 120, r: 1, o: 0.2 },
          { x: 1100, y: 80, r: 1.5, o: 0.25 }, { x: 1200, y: 60, r: 1, o: 0.3 },
          { x: 1300, y: 100, r: 1.3, o: 0.2 }, { x: 1400, y: 70, r: 1, o: 0.25 },
          { x: 80, y: 250, r: 1, o: 0.2 }, { x: 360, y: 200, r: 1.2, o: 0.25 },
          { x: 680, y: 430, r: 1, o: 0.2 }, { x: 1100, y: 420, r: 1.3, o: 0.2 },
          { x: 760, y: 450, r: 1, o: 0.2 }, { x: 200, y: 440, r: 0.8, o: 0.15 },
          { x: 1250, y: 430, r: 1, o: 0.2 }, { x: 470, y: 450, r: 0.8, o: 0.15 },
          { x: 1050, y: 450, r: 1, o: 0.15 }, { x: 150, y: 350, r: 1, o: 0.2 },
          { x: 980, y: 430, r: 1.2, o: 0.2 }, { x: 560, y: 440, r: 0.8, o: 0.15 },
        ].map((p, i) => (
          <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={p.r} fill={COLORS.neonGreen} opacity={p.o} />
        ))}
      </g>

      {/* ===== THIN CONNECTING LINES BETWEEN ZONES ===== */}
      <g opacity={0.08}>
        <line x1="200" y1="280" x2="600" y2="280" stroke={COLORS.brightGreen} strokeWidth="0.5" />
        <line x1="840" y1="280" x2="1200" y2="280" stroke={COLORS.brightGreen} strokeWidth="0.5" />
        <line x1="170" y1="240" x2="680" y2="170" stroke={COLORS.teal} strokeWidth="0.3" />
        <line x1="760" y1="160" x2="1280" y2="160" stroke={COLORS.teal} strokeWidth="0.3" />
        <path d="M280 240 Q500 180 720 200 Q940 180 1160 220" stroke={COLORS.outline} strokeWidth="0.4" fill="none" />
      </g>

      {/* ===== ADDITIONAL DEPTH ELEMENTS ===== */}
      {/* Far background silhouettes */}
      <g opacity={0.06}>
        <polygon points="0,380 40,340 80,350 120,330 160,345 200,320 240,340 280,380" fill={COLORS.outline} />
        <polygon points="1200,380 1240,345 1280,355 1320,335 1360,350 1400,330 1440,380" fill={COLORS.outline} />
      </g>

      {/* Additional small structures */}
      {/* Small cube near left zone */}
      <g>
        <polygon points="380,395 395,388 410,395 395,402" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.4" />
        <polygon points="380,395 380,388 395,381 395,388" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.3" />
        <polygon points="395,388 395,381 410,388 410,395" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.3" />
      </g>
      {/* Small cube near right zone */}
      <g>
        <polygon points="1050,395 1065,388 1080,395 1065,402" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.4" />
        <polygon points="1050,395 1050,388 1065,381 1065,388" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.3" />
        <polygon points="1065,388 1065,381 1080,388 1080,395" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.3" />
      </g>

      {/* Floating data stream lines */}
      <g opacity={0.12}>
        <path d="M150 200 Q250 170 350 190" stroke={COLORS.neonGreen} strokeWidth="0.5" fill="none" strokeDasharray="3 6" />
        <path d="M1100 190 Q1200 170 1300 200" stroke={COLORS.neonGreen} strokeWidth="0.5" fill="none" strokeDasharray="3 6" />
        <path d="M600 120 Q720 100 840 120" stroke={COLORS.teal} strokeWidth="0.4" fill="none" strokeDasharray="2 5" />
      </g>

      {/* Additional plant clusters */}
      <g opacity={0.4}>
        {/* Plant cluster left edge */}
        <path d="M10 430 Q5 415 15 405" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
        <path d="M15 430 Q20 418 12 410" stroke={COLORS.lightGreen} strokeWidth="0.6" fill="none" />
        <circle cx="15" cy="403" r="3" fill={COLORS.lightGreen} opacity={0.4} />
        <circle cx="12" cy="408" r="2" fill={COLORS.neonGreen} opacity={0.3} />
        {/* Plant cluster right edge */}
        <path d="M1430 420 Q1425 408 1435 400" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
        <path d="M1435 420 Q1440 410 1432 404" stroke={COLORS.lightGreen} strokeWidth="0.6" fill="none" />
        <circle cx="1435" cy="398" r="2.5" fill={COLORS.lightGreen} opacity={0.4} />
      </g>

      {/* Decorative corner elements */}
      <g opacity={0.1}>
        <circle cx="20" cy="20" r="30" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
        <circle cx="1420" cy="20" r="25" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
        <circle cx="20" cy="460" r="20" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
        <circle cx="1420" cy="460" r="20" fill="none" stroke={COLORS.outline} strokeWidth="0.5" />
      </g>
    </svg>
  );
}
