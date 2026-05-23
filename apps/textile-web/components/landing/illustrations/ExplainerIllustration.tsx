const COLORS = {
  darkGreen1: '#0d1f17', darkGreen2: '#142e22', midGreen: '#1a4d3a',
  brandGreen: '#006239', brightGreen: '#0ea371', neonGreen: '#3ecf8e',
  lightGreen: '#4ade80', teal: '#14b8a6',
  figureLight: '#c4d4ce', outline: '#2e5e48',
};

export function ExplainerIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* ===== BACKGROUND GRID ===== */}
      <g opacity={0.08}>
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`dg-${i}`} x1={i * 45} y1="350" x2={i * 45 + 100} y2="240" stroke={COLORS.outline} strokeWidth="0.3" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`dg2-${i}`} x1={i * 45 + 100} y1="350" x2={i * 45} y2="240" stroke={COLORS.outline} strokeWidth="0.3" />
        ))}
        {[260, 280, 300, 320, 340].map((y, i) => (
          <line key={`hg-${i}`} x1="0" y1={y} x2="500" y2={y} stroke={COLORS.outline} strokeWidth="0.2" />
        ))}
      </g>

      {/* ===== STEPPED PLATFORM ===== */}
      <g>
        {/* Main platform */}
        <polygon points="80,290 250,250 420,290 250,330" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.8" />
        {/* Platform side left */}
        <polygon points="80,290 80,300 250,340 250,330" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Platform side right */}
        <polygon points="250,330 250,340 420,300 420,290" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.8} />
        {/* Platform grid dashes */}
        <g opacity={0.1}>
          <line x1="130" y1="275" x2="300" y2="235" stroke={COLORS.outline} strokeWidth="0.4" strokeDasharray="3 3" />
          <line x1="180" y1="295" x2="350" y2="255" stroke={COLORS.outline} strokeWidth="0.4" strokeDasharray="3 3" />
          <line x1="150" y1="290" x2="320" y2="290" stroke={COLORS.outline} strokeWidth="0.4" strokeDasharray="3 3" />
          <line x1="200" y1="268" x2="370" y2="308" stroke={COLORS.outline} strokeWidth="0.4" strokeDasharray="3 3" />
        </g>

        {/* Step up sub-platform */}
        <polygon points="120,275 220,255 310,275 210,295" fill={COLORS.midGreen} stroke={COLORS.outline} strokeWidth="0.6" />
        <polygon points="120,275 120,280 210,300 210,295" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.4" />
        <polygon points="210,295 210,300 310,280 310,275" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.4" />

        {/* Steps */}
        {[0, 1, 2].map((i) => (
          <polygon key={`st-${i}`} points={`${95 + i * 12},${290 - i * 6} ${115 + i * 12},${284 - i * 6} ${127 + i * 12},${288 - i * 6} ${107 + i * 12},${294 - i * 6}`} fill={i % 2 === 0 ? COLORS.midGreen : COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.3" />
        ))}
      </g>

      {/* ===== MAIN HOLOGRAPHIC DASHBOARD ===== */}
      <g>
        {/* Dashboard frame */}
        <polygon points="180,100 380,60 400,75 200,115" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.8" opacity={0.9} />
        <polygon points="200,115 400,75 400,225 200,265" fill={COLORS.darkGreen1} stroke={COLORS.brightGreen} strokeWidth="0.7" opacity={0.6} />
        {/* Dashboard screen glow */}
        <polygon points="205,118 395,78 395,220 205,260" fill={COLORS.brandGreen} opacity={0.12} />

        {/* Bar chart on dashboard */}
        <g opacity={0.6}>
          <rect x="220" y="210" width="10" height="35" fill={COLORS.brightGreen} opacity={0.5} />
          <rect x="236" y="195" width="10" height="50" fill={COLORS.neonGreen} opacity={0.45} />
          <rect x="252" y="205" width="10" height="40" fill={COLORS.teal} opacity={0.45} />
          <rect x="268" y="185" width="10" height="60" fill={COLORS.brightGreen} opacity={0.5} />
          <rect x="284" y="198" width="10" height="47" fill={COLORS.lightGreen} opacity={0.45} />
          <rect x="300" y="190" width="10" height="55" fill={COLORS.neonGreen} opacity={0.45} />
        </g>

        {/* Line graph on dashboard */}
        <g opacity={0.55}>
          <polyline points="220,160 240,148 260,155 280,138 300,142 320,128 340,135 360,120 380,125" stroke={COLORS.neonGreen} strokeWidth="1" fill="none" />
          <polyline points="220,170 240,162 260,168 280,155 300,160 320,148 340,152 360,140 380,145" stroke={COLORS.teal} strokeWidth="0.6" fill="none" opacity={0.5} />
        </g>

        {/* Battery status indicators */}
        <g opacity={0.6}>
          {/* Battery icon 1 - full */}
          <rect x="225" y="120" width="12" height="20" rx="2" fill="none" stroke={COLORS.neonGreen} strokeWidth="0.7" />
          <rect x="229" y="117" width="4" height="3" rx="0.5" fill={COLORS.neonGreen} opacity={0.6} />
          <rect x="227" y="125" width="8" height="13" fill={COLORS.neonGreen} opacity={0.4} />
          {/* Battery icon 2 - 75% */}
          <rect x="245" y="120" width="12" height="20" rx="2" fill="none" stroke={COLORS.brightGreen} strokeWidth="0.7" />
          <rect x="249" y="117" width="4" height="3" rx="0.5" fill={COLORS.brightGreen} opacity={0.6} />
          <rect x="247" y="128" width="8" height="10" fill={COLORS.brightGreen} opacity={0.4} />
          {/* Battery icon 3 - 50% */}
          <rect x="265" y="120" width="12" height="20" rx="2" fill="none" stroke={COLORS.teal} strokeWidth="0.7" />
          <rect x="269" y="117" width="4" height="3" rx="0.5" fill={COLORS.teal} opacity={0.6} />
          <rect x="267" y="132" width="8" height="6" fill={COLORS.teal} opacity={0.4} />
        </g>

        {/* Compliance checkmarks */}
        <g opacity={0.55}>
          <circle cx="340" cy="125" r="6" fill="none" stroke={COLORS.neonGreen} strokeWidth="0.6" />
          <polyline points="336,125 339,128 345,121" stroke={COLORS.neonGreen} strokeWidth="0.8" fill="none" />
          <circle cx="360" cy="125" r="6" fill="none" stroke={COLORS.brightGreen} strokeWidth="0.6" />
          <polyline points="356,125 359,128 365,121" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
          <circle cx="380" cy="125" r="6" fill="none" stroke={COLORS.teal} strokeWidth="0.6" />
          <polyline points="376,125 379,128 385,121" stroke={COLORS.teal} strokeWidth="0.8" fill="none" />
        </g>

        {/* Dashboard grid lines */}
        <g opacity={0.15}>
          <line x1="210" y1="150" x2="390" y2="110" stroke={COLORS.outline} strokeWidth="0.3" />
          <line x1="210" y1="180" x2="390" y2="140" stroke={COLORS.outline} strokeWidth="0.3" />
          <line x1="210" y1="210" x2="390" y2="170" stroke={COLORS.outline} strokeWidth="0.3" />
          <line x1="210" y1="240" x2="390" y2="200" stroke={COLORS.outline} strokeWidth="0.3" />
        </g>
      </g>

      {/* ===== FLOATING QR/BATTERY ID PANEL ===== */}
      <g>
        <polygon points="60,120 140,100 150,107 70,127" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.5" opacity={0.8} />
        <polygon points="70,127 150,107 150,190 70,210" fill={COLORS.darkGreen1} stroke={COLORS.brightGreen} strokeWidth="0.5" opacity={0.5} />
        <polygon points="73,130 147,110 147,187 73,207" fill={COLORS.brandGreen} opacity={0.1} />
        {/* QR Code pattern */}
        <g opacity={0.5}>
          <rect x="82" y="138" width="8" height="8" fill={COLORS.neonGreen} />
          <rect x="94" y="138" width="8" height="8" fill={COLORS.neonGreen} />
          <rect x="106" y="138" width="8" height="8" fill={COLORS.neonGreen} />
          <rect x="82" y="150" width="8" height="8" fill={COLORS.neonGreen} />
          <rect x="106" y="150" width="8" height="8" fill={COLORS.neonGreen} />
          <rect x="82" y="162" width="8" height="8" fill={COLORS.neonGreen} />
          <rect x="94" y="162" width="8" height="8" fill={COLORS.neonGreen} />
          <rect x="106" y="162" width="8" height="8" fill={COLORS.neonGreen} />
          <rect x="94" y="150" width="4" height="4" fill={COLORS.lightGreen} />
          <rect x="118" y="140" width="6" height="6" fill={COLORS.brightGreen} opacity={0.4} />
          <rect x="118" y="152" width="6" height="6" fill={COLORS.brightGreen} opacity={0.4} />
          <rect x="118" y="164" width="6" height="6" fill={COLORS.brightGreen} opacity={0.4} />
        </g>
        {/* Battery ID text lines */}
        <g opacity={0.4}>
          <line x1="82" y1="180" x2="130" y2="172" stroke={COLORS.neonGreen} strokeWidth="1" />
          <line x1="82" y1="188" x2="120" y2="181" stroke={COLORS.brightGreen} strokeWidth="0.7" />
          <line x1="82" y1="196" x2="115" y2="190" stroke={COLORS.teal} strokeWidth="0.7" />
        </g>
        {/* Connecting line to dashboard */}
        <line x1="150" y1="150" x2="200" y2="160" stroke={COLORS.brightGreen} strokeWidth="0.4" opacity={0.3} strokeDasharray="3 3" />
      </g>

      {/* ===== STANDING PERSON AT DASHBOARD ===== */}
      <g>
        <circle cx="195" cy="238" r="4" fill={COLORS.figureLight} opacity={0.85} />
        <rect x="192" y="242.5" width="6" height="12" rx="1.5" fill={COLORS.figureLight} opacity={0.75} />
        <line x1="194" y1="254.5" x2="191" y2="268" stroke={COLORS.figureLight} strokeWidth="1.3" />
        <line x1="198" y1="254.5" x2="201" y2="268" stroke={COLORS.figureLight} strokeWidth="1.3" />
        {/* Arm reaching toward dashboard */}
        <line x1="198" y1="246" x2="210" y2="240" stroke={COLORS.figureLight} strokeWidth="0.8" opacity={0.6} />
      </g>

      {/* ===== SITTING PERSON AT DESK ===== */}
      <g>
        {/* Desk */}
        <polygon points="340,275 380,265 410,275 370,285" fill={COLORS.darkGreen2} stroke={COLORS.outline} strokeWidth="0.5" />
        {/* Desk legs */}
        <line x1="350" y1="280" x2="350" y2="295" stroke={COLORS.outline} strokeWidth="0.6" />
        <line x1="395" y1="273" x2="395" y2="288" stroke={COLORS.outline} strokeWidth="0.6" />
        {/* Laptop on desk */}
        <rect x="358" y="264" width="18" height="12" rx="1" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.4" />
        <rect x="360" y="266" width="14" height="8" fill={COLORS.brandGreen} opacity={0.35} />
        {/* Laptop screen angled */}
        <polygon points="358,264 376,264 378,254 356,254" fill={COLORS.darkGreen1} stroke={COLORS.outline} strokeWidth="0.4" />
        <polygon points="359,263 375,263 377,255 357,255" fill={COLORS.brandGreen} opacity={0.2} />
        {/* Sitting person */}
        <circle cx="370" cy="248" r="3.5" fill={COLORS.figureLight} opacity={0.8} />
        <rect x="367.5" y="252" width="5" height="10" rx="1.5" fill={COLORS.figureLight} opacity={0.7} />
        <line x1="369" y1="262" x2="366" y2="272" stroke={COLORS.figureLight} strokeWidth="1" />
        <line x1="373" y1="262" x2="376" y2="272" stroke={COLORS.figureLight} strokeWidth="1" />
      </g>

      {/* ===== PLANTS AROUND DESK ===== */}
      <g opacity={0.5}>
        {/* Plant 1 */}
        <path d="M420 290 Q418 275 425 265" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
        <path d="M420 290 Q425 278 420 270" stroke={COLORS.lightGreen} strokeWidth="0.6" fill="none" />
        <circle cx="425" cy="263" r="3" fill={COLORS.lightGreen} opacity={0.5} />
        <circle cx="420" cy="268" r="2" fill={COLORS.neonGreen} opacity={0.4} />
        {/* Plant 2 */}
        <path d="M85 290 Q80 278 88 270" stroke={COLORS.brightGreen} strokeWidth="0.8" fill="none" />
        <circle cx="88" cy="268" r="3" fill={COLORS.lightGreen} opacity={0.5} />
        <path d="M85 290 Q90 280 84 274" stroke={COLORS.lightGreen} strokeWidth="0.6" fill="none" />
        <circle cx="84" cy="272" r="2" fill={COLORS.neonGreen} opacity={0.4} />
        {/* Plant 3 - tall */}
        <line x1="440" y1="295" x2="440" y2="250" stroke={COLORS.outline} strokeWidth="0.8" />
        <path d="M440 250 Q430 242 425 236" stroke={COLORS.brightGreen} strokeWidth="0.7" fill="none" />
        <path d="M440 250 Q450 242 455 236" stroke={COLORS.lightGreen} strokeWidth="0.7" fill="none" />
        <path d="M440 250 Q438 240 440 232" stroke={COLORS.neonGreen} strokeWidth="0.5" fill="none" />
      </g>

      {/* ===== GLOBE ELEMENT ===== */}
      <g opacity={0.2}>
        <circle cx="450" cy="100" r="30" fill="none" stroke={COLORS.brightGreen} strokeWidth="0.6" />
        <ellipse cx="450" cy="100" rx="30" ry="12" fill="none" stroke={COLORS.outline} strokeWidth="0.4" />
        <ellipse cx="450" cy="100" rx="18" ry="30" fill="none" stroke={COLORS.outline} strokeWidth="0.4" />
        <line x1="420" y1="100" x2="480" y2="100" stroke={COLORS.outline} strokeWidth="0.3" />
        <line x1="450" y1="70" x2="450" y2="130" stroke={COLORS.outline} strokeWidth="0.3" />
      </g>

      {/* ===== DATA PARTICLES FLOWING FROM DASHBOARD ===== */}
      <g>
        {[
          { x: 390, y: 90, r: 1.2, o: 0.3 }, { x: 400, y: 110, r: 1, o: 0.25 },
          { x: 410, y: 130, r: 1.3, o: 0.2 }, { x: 405, y: 80, r: 0.8, o: 0.35 },
          { x: 395, y: 140, r: 1, o: 0.2 }, { x: 415, y: 100, r: 0.8, o: 0.3 },
          { x: 420, y: 120, r: 1, o: 0.25 }, { x: 385, y: 100, r: 0.8, o: 0.2 },
          { x: 410, y: 150, r: 1, o: 0.15 }, { x: 425, y: 85, r: 0.8, o: 0.2 },
        ].map((p, i) => (
          <circle key={`dp-${i}`} cx={p.x} cy={p.y} r={p.r} fill={COLORS.neonGreen} opacity={p.o} />
        ))}
        {/* Flow lines */}
        <path d="M395 85 Q410 75 425 80" stroke={COLORS.neonGreen} strokeWidth="0.3" fill="none" opacity={0.2} />
        <path d="M400 105 Q415 95 430 100" stroke={COLORS.teal} strokeWidth="0.3" fill="none" opacity={0.15} />
        <path d="M395 125 Q410 118 425 122" stroke={COLORS.neonGreen} strokeWidth="0.3" fill="none" opacity={0.15} />
      </g>

      {/* ===== FLOATING HEXAGONS ===== */}
      <g opacity={0.15}>
        {[
          { x: 30, y: 60, s: 12 }, { x: 470, y: 50, s: 10 }, { x: 250, y: 20, s: 14 },
          { x: 50, y: 320, s: 8 }, { x: 480, y: 300, s: 10 }, { x: 130, y: 40, s: 10 },
        ].map((h, i) => (
          <polygon
            key={`hx-${i}`}
            points={[0, 1, 2, 3, 4, 5].map((j) => {
              const angle = (Math.PI / 3) * j - Math.PI / 6;
              return `${h.x + h.s * Math.cos(angle)},${h.y + h.s * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={COLORS.brightGreen}
            strokeWidth="0.5"
          />
        ))}
      </g>

      {/* ===== SCATTERED PARTICLES ===== */}
      <g>
        {[
          { x: 15, y: 100, r: 1, o: 0.25 }, { x: 60, y: 30, r: 0.8, o: 0.2 },
          { x: 160, y: 50, r: 1, o: 0.3 }, { x: 300, y: 30, r: 0.8, o: 0.2 },
          { x: 480, y: 180, r: 1, o: 0.25 }, { x: 20, y: 220, r: 0.8, o: 0.2 },
          { x: 250, y: 340, r: 1, o: 0.2 }, { x: 460, y: 320, r: 0.8, o: 0.2 },
          { x: 120, y: 340, r: 0.8, o: 0.15 }, { x: 350, y: 340, r: 0.8, o: 0.15 },
        ].map((p, i) => (
          <circle key={`sp-${i}`} cx={p.x} cy={p.y} r={p.r} fill={COLORS.neonGreen} opacity={p.o} />
        ))}
      </g>

      {/* ===== FLOATING GEOMETRIC DECORATIONS ===== */}
      <g opacity={0.12}>
        <rect x="15" y="160" width="10" height="10" rx="1" fill="none" stroke={COLORS.outline} strokeWidth="0.5" transform="rotate(15 20 165)" />
        <polygon points="40,200 47,190 54,200 47,210" fill="none" stroke={COLORS.outline} strokeWidth="0.4" />
        <circle cx="470" cy="220" r="5" fill="none" stroke={COLORS.outline} strokeWidth="0.4" />
        <rect x="455" y="260" width="8" height="8" rx="1" fill="none" stroke={COLORS.brightGreen} strokeWidth="0.4" transform="rotate(-10 459 264)" />
      </g>

      {/* ===== CONNECTING LINES ===== */}
      <g opacity={0.08}>
        <line x1="100" y1="210" x2="195" y2="245" stroke={COLORS.brightGreen} strokeWidth="0.4" />
        <line x1="370" y1="255" x2="400" y2="230" stroke={COLORS.teal} strokeWidth="0.3" />
        <path d="M60 210 Q130 220 200 240" stroke={COLORS.outline} strokeWidth="0.3" fill="none" />
      </g>
    </svg>
  );
}
