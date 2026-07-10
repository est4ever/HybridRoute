import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Design tokens ───
const Bg = 'oklch(0.08 0.015 260';
const Border = 'oklch(0.20 0.04 260';
const Cyan = 'oklch(0.72 0.19 175';
const Teal = 'oklch(0.65 0.16 185';
const Purple = 'oklch(0.50 0.27 290';
const Violet = 'oklch(0.60 0.22 290';
const White = 'oklch(0.92 0.01 260';
const Muted = 'oklch(0.60 0.03 260';
const Amber = 'oklch(0.72 0.18 75';
const Font = 'Fira Code, monospace';

// ─── SVG defs & filters ───
function Defs() {
  return (
    <defs>
      <filter id="heroBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="heroGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="heroGlowStrong" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="14" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <linearGradient id="humanGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={`${Teal}`} stopOpacity="0.9" />
        <stop offset="100%" stopColor={`${Cyan}`} stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="aiGrad" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stopColor={`${Violet}`} stopOpacity="0.9" />
        <stop offset="100%" stopColor={`${Purple}`} stopOpacity="0.6" />
      </linearGradient>
      <radialGradient id="sparkGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="white" stopOpacity="0.9" />
        <stop offset="30%" stopColor={`${Cyan}`} stopOpacity="0.7" />
        <stop offset="100%" stopColor={`${Cyan}`} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="handBackdropGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={`${Bg}`} stopOpacity="0" />
        <stop offset="20%" stopColor={`${Bg}`} stopOpacity="0.55" />
        <stop offset="80%" stopColor={`${Bg}`} stopOpacity="0.55" />
        <stop offset="100%" stopColor={`${Bg}`} stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

// ─── Tech Grid Background ───
function TechGrid() {
  return (
    <g opacity="0.12">
      {Array.from({ length: 18 }, (_, i) => (
        <line
          key={`h${i}`}
          x1="0" y1={i * 35}
          x2="1000" y2={i * 35}
          stroke={`${Cyan}`}
          strokeWidth="0.5"
          opacity="0.5"
        />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={i * 35} y1="0"
          x2={i * 35} y2="620"
          stroke={`${Cyan}`}
          strokeWidth="0.5"
          opacity="0.5"
        />
      ))}
    </g>
  );
}

// ─── Even backdrop wash behind the hands ───
function HandBackdrop() {
  return (
    <g opacity="1" pointerEvents="none">
      {/* Soft horizontal gradient to even out the field behind the hands */}
      <rect x="0" y="140" width="1000" height="340" fill="url(#handBackdropGrad)" opacity="0.55" />
      {/* Large blurred vignettes that unify the hand region */}
      <ellipse cx="220" cy="260" rx="240" ry="150" fill={`${Bg} / 0.42)`} filter="url(#heroBlur)" opacity="0.8" />
      <ellipse cx="780" cy="260" rx="240" ry="150" fill={`${Bg} / 0.42)`} filter="url(#heroBlur)" opacity="0.8" />
      {/* Central bridge wash behind the spark/hands */}
      <ellipse cx="500" cy="260" rx="320" ry="120" fill={`${Bg} / 0.28)`} filter="url(#heroBlur)" opacity="0.65" />
    </g>
  );
}

// ─── Human Hand (left side) ───
function HumanHand() {
  return (
    <g className="animate-fade-label" style={{ animationDelay: '0.1s' }}>
      {/* Forearm */}
      <path d="M 40,250 L 90,220 L 155,235 L 140,305 L 50,290 Z" fill={`${Teal} / 0.06)`} stroke={`${Teal} / 0.35)`} strokeWidth="1.5" />
      <path d="M 90,220 L 155,235 L 165,260 L 100,245 Z" fill={`${Teal} / 0.04)`} stroke={`${Cyan} / 0.2)`} strokeWidth="0.75" />

      {/* Palm */}
      <path d="M 140,235 L 225,215 L 245,285 L 180,315 L 135,300 Z" fill={`${Teal} / 0.08)`} stroke={`${Teal} / 0.4)`} strokeWidth="1.2" />
      <path d="M 225,215 L 245,285 L 225,292 L 205,222 Z" fill={`${Cyan} / 0.04)`} stroke={`${Cyan} / 0.18)`} strokeWidth="0.75" />

      {/* Pinky */}
      <path d="M 145,235 L 162,228 L 205,205 L 195,220 L 155,245 Z" fill={`${Teal} / 0.05)`} stroke={`${Teal} / 0.25)`} strokeWidth="1" />
      {/* Ring */}
      <path d="M 170,230 L 188,222 L 245,188 L 232,205 L 182,240 Z" fill={`${Teal} / 0.06)`} stroke={`${Teal} / 0.28)`} strokeWidth="1" />
      {/* Middle */}
      <path d="M 195,225 L 213,217 L 285,172 L 270,190 L 208,235 Z" fill={`${Teal} / 0.07)`} stroke={`${Teal} / 0.32)`} strokeWidth="1.1" />
      {/* Index — reaches toward spark */}
      <path d="M 220,220 L 238,210 L 365,160 L 350,180 L 233,230 Z" fill={`${Cyan} / 0.08)`} stroke={`${Cyan} / 0.45)`} strokeWidth="1.2" />
      {/* Thumb */}
      <path d="M 225,275 L 245,260 L 305,345 L 285,355 L 215,295 Z" fill={`${Teal} / 0.06)`} stroke={`${Cyan} / 0.35)`} strokeWidth="1.2" />

      {/* Finger separation / knuckle lines */}
      <line x1="160" y1="238" x2="155" y2="290" stroke={`${Teal} / 0.15)`} strokeWidth="1" />
      <line x1="187" y1="232" x2="182" y2="295" stroke={`${Teal} / 0.15)`} strokeWidth="1" />
      <line x1="215" y1="226" x2="210" y2="300" stroke={`${Teal} / 0.15)`} strokeWidth="1" />

      {/* Wrist band */}
      <rect x="135" y="272" width="50" height="3" rx="1.5" fill={`${Cyan} / 0.15)`} />
    </g>
  );
}

// ─── AI Hand (right side, mirrored) ───
function AIHand() {
  return (
    <g className="animate-fade-label" style={{ animationDelay: '0.3s' }}>
      {/* Forearm */}
      <path d="M 960,250 L 910,220 L 845,235 L 860,305 L 950,290 Z" fill={`${Violet} / 0.06)`} stroke={`${Violet} / 0.35)`} strokeWidth="1.5" />
      <path d="M 910,220 L 845,235 L 835,260 L 900,245 Z" fill={`${Purple} / 0.04)`} stroke={`${Purple} / 0.2)`} strokeWidth="0.75" />

      {/* Palm */}
      <path d="M 860,235 L 775,215 L 755,285 L 820,315 L 865,300 Z" fill={`${Violet} / 0.08)`} stroke={`${Violet} / 0.4)`} strokeWidth="1.2" />
      <path d="M 775,215 L 755,285 L 775,292 L 795,222 Z" fill={`${Purple} / 0.04)`} stroke={`${Purple} / 0.18)`} strokeWidth="0.75" />

      {/* Pinky */}
      <path d="M 855,235 L 838,228 L 795,205 L 805,220 L 845,245 Z" fill={`${Violet} / 0.05)`} stroke={`${Violet} / 0.25)`} strokeWidth="1" />
      {/* Ring */}
      <path d="M 830,230 L 812,222 L 755,188 L 768,205 L 818,240 Z" fill={`${Violet} / 0.06)`} stroke={`${Violet} / 0.28)`} strokeWidth="1" />
      {/* Middle */}
      <path d="M 805,225 L 787,217 L 715,172 L 730,190 L 792,235 Z" fill={`${Violet} / 0.07)`} stroke={`${Violet} / 0.32)`} strokeWidth="1.1" />
      {/* Index — reaches toward spark */}
      <path d="M 780,220 L 762,210 L 635,160 L 650,180 L 767,230 Z" fill={`${Purple} / 0.08)`} stroke={`${Purple} / 0.45)`} strokeWidth="1.2" />
      {/* Thumb */}
      <path d="M 775,275 L 755,260 L 695,345 L 715,355 L 785,295 Z" fill={`${Violet} / 0.06)`} stroke={`${Purple} / 0.35)`} strokeWidth="1.2" />

      {/* Finger separation / knuckle lines */}
      <line x1="840" y1="238" x2="845" y2="290" stroke={`${Violet} / 0.15)`} strokeWidth="1" />
      <line x1="813" y1="232" x2="818" y2="295" stroke={`${Violet} / 0.15)`} strokeWidth="1" />
      <line x1="785" y1="226" x2="790" y2="300" stroke={`${Violet} / 0.15)`} strokeWidth="1" />

      {/* Wrist circuit band */}
      <rect x="815" y="272" width="50" height="3" rx="1.5" fill={`${Purple} / 0.15)`} />
      {/* Circuit dots on AI arm */}
      <circle cx="900" cy="235" r="2" fill={`${Purple} / 0.3)`} />
      <circle cx="880" cy="240" r="1.5" fill={`${Purple} / 0.25)`} />
      <circle cx="860" cy="248" r="2" fill={`${Purple} / 0.2)`} />
    </g>
  );
}

// ─── Central Routing Decision Spark ───
function RoutingSpark() {
  const cx = 500;
  const cy = 280;
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Outer glow */}
      <circle cx="0" cy="0" r="90" fill="url(#sparkGrad)" className="animate-spark-outer svg-animated" />
      <circle cx="0" cy="0" r="66" fill={`${Cyan} / 0.06)`} className="animate-spark-inner svg-animated" />
      {/* Pulsing energy rings */}
      <circle cx="0" cy="0" r="45" fill="none" stroke={`${Cyan} / 0.3)`} strokeWidth="1.5" className="animate-spark-ring svg-animated" />
      <circle cx="0" cy="0" r="33" fill="none" stroke={`${Purple} / 0.22)`} strokeWidth="1" className="animate-spark-ring svg-animated" style={{ animationDelay: '0.6s', animationDirection: 'reverse' }} />
      {/* Inner glow */}
      <circle cx="0" cy="0" r="21" fill={`${Cyan} / 0.35)`} className="animate-pulse-core svg-animated" />
      <circle cx="0" cy="0" r="12" fill={`${White} / 0.5)`} className="animate-pulse-core svg-animated" style={{ animationDelay: '0.3s' }} />
      <circle cx="0" cy="0" r="5.25" fill="white" />
      {/* Energy rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <line
          key={a}
          x1="0" y1="0"
          x2={Math.cos((a * Math.PI) / 180) * 72}
          y2={Math.sin((a * Math.PI) / 180) * 72}
          stroke={a % 90 === 0 ? `${White} / 0.15)` : `${Cyan} / 0.1)`}
          strokeWidth="1"
          className="animate-ray svg-animated-opacity"
          style={{ animationDelay: `${a * 0.012}s` }}
        />
      ))}
    </g>
  );
}

// ─── Route branch lines from spark to model nodes ───
const modelDestinations = [
  { label: 'Local Model', x: 800, y: 80, accent: Purple },
  { label: 'Remote Model', x: 800, y: 380, accent: Purple },
];

function RouteBranches() {
  const cx = 500;
  const cy = 280;

  return (
    <g>
      {modelDestinations.map((dest, i) => {
        // Curved path: arc above/below the hand to avoid overlap
        const dx = dest.x - cx;
        const dy = dest.y - cy;
        const midX = cx + dx * 0.5;
        const midY = dest.y < cy ? cy + dy * 0.2 - 80 : cy + dy * 0.2 + 60;
        const d = `M ${cx} ${cy} Q ${midX} ${midY} ${dest.x} ${dest.y}`;

        return (
          <g key={dest.label}>
            <path
              d={d}
              fill="none"
              stroke={`${dest.accent} / 0.2)`}
              strokeWidth="1.2"
              strokeDasharray="4 5"
              className="animate-route-line"
              style={{ animationDelay: `${1.0 + i * 0.2}s` }}
            />
            <path
              d={d}
              fill="none"
              stroke={`${dest.accent} / 0.05)`}
              strokeWidth="3"
              filter="url(#heroGlow)"
            />
          </g>
        );
      })}
    </g>
  );
}

// ─── User Request branch to routing spark ───
function UserRequestBranch() {
  const cx = 500;
  const cy = 280;
  const labelX = 168;
  const labelY = 96;
  const controlX = 300;
  const controlY = 30;
  const d = `M ${labelX} ${labelY} Q ${controlX} ${controlY} ${cx} ${cy}`;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={`${Cyan} / 0.2)`}
        strokeWidth="1.2"
        strokeDasharray="4 5"
        className="animate-route-line"
        style={{ animationDelay: '0.5s' }}
      />
      <path
        d={d}
        fill="none"
        stroke={`${Cyan} / 0.05)`}
        strokeWidth="3"
        filter="url(#heroGlow)"
      />
    </g>
  );
}

// ─── Model destination node pill ───
function ModelNode({
  x,
  y,
  label,
  accent,
  delay = 0,
  active,
  onClick,
}: {
  x: number;
  y: number;
  label: string;
  accent: string;
  delay?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const pw = Math.max(120, label.length * 8 + 44);
  const isActive = active ?? false;
  return (
    <g
      className="hero-node-hover"
      style={{
        transformOrigin: `${x}px ${y}px`,
        transitionDelay: `${delay}ms`,
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
      }}
      onClick={onClick}
      onMouseDown={(e) => {
        // Prevent focus outline / white box on click.
        e.preventDefault();
      }}
    >
      {/* Glow behind */}
      <ellipse cx={x} cy={y} rx={pw / 2 + 10} ry="20" fill={`${accent} / ${isActive ? '0.12' : '0.04'})`} filter="url(#heroBlur)" />
      {/* Glass pill */}
      <rect
        x={x - pw / 2} y={y - 14} width={pw} height={28} rx={14}
        fill={`${Bg} / 0.78)`}
        stroke={`${accent} / ${isActive ? '0.75' : '0.35'})`}
        strokeWidth={isActive ? 1.5 : 1}
        className="transition-all duration-200"
      />

      {/* Label */}
      <text
        x={x} y={y + 5}
        textAnchor="middle"
        fill={White}
        fontSize="14"
        fontFamily={Font}
        fontWeight="600"
      >
        {label}
      </text>
    </g>
  );
}

// ─── All model destination nodes ───
function ModelNodes({
  localActive,
  remoteActive,
  onToggleLocal,
  onToggleRemote,
}: {
  localActive: boolean;
  remoteActive: boolean;
  onToggleLocal: () => void;
  onToggleRemote: () => void;
}) {
  return (
    <g>
      {modelDestinations.map((m, i) => (
        <ModelNode
          key={m.label}
          x={m.x}
          y={m.y}
          label={m.label}
          accent={m.accent}
          delay={i * 80}
          active={m.label === 'Local Model' ? localActive : remoteActive}
          onClick={m.label === 'Local Model' ? onToggleLocal : onToggleRemote}
        />
      ))}
    </g>
  );
}

// ─── Input label ───
function InputLabel({ active, onClick }: { active: boolean; onClick: () => void }) {
  const x = 93;
  const y = 96;
  const pw = 150;
  const accent = Cyan;
  return (
    <g
      className="hero-node-hover animate-fade-label"
      style={{
        transformOrigin: `${x}px ${y}px`,
        animationDelay: '0.1s',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
      }}
      onClick={onClick}
      onMouseDown={(e) => {
        // Prevent focus outline / white box on click.
        e.preventDefault();
      }}
    >
      {/* Glow behind */}
      <ellipse
        cx={x}
        cy={y}
        rx={pw / 2 + 10}
        ry="20"
        fill={`${accent} / ${active ? '0.12' : '0.04'})`}
        filter="url(#heroBlur)"
      />
      {/* Glass pill — fill stays constant, no white barrier */}
      <rect
        x={x - pw / 2} y={y - 14} width={pw} height={28} rx={14}
        fill={`${Bg} / 0.78)`}
        stroke={`${accent} / ${active ? '0.75' : '0.35'})`}
        strokeWidth={active ? 1.5 : 1}
        className="transition-all duration-200"
      />
      {/* Label stays the same */}
      <text x={x} y={y + 5} textAnchor="middle" fill={White} fontSize="14" fontFamily={Font} fontWeight="600">
        User Request
      </text>
    </g>
  );
}

// ─── Routing Engine label ───
function RoutingEngineLabel({ onClick }: { onClick?: () => void }) {
  return (
    <g
      className="animate-fade-label hero-node-hover"
      style={{
        animationDelay: '0.5s',
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        transformOrigin: '500px 438px',
      }}
      onClick={onClick}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      <rect x="390" y="410" width="220" height="56" rx={16} fill={`${Bg} / 0.78)`} stroke={`${Cyan} / 0.3)`} strokeWidth="1" className="transition-all duration-200" />
      <text x="500" y="444" textAnchor="middle" fill={Cyan} fontSize="16" fontFamily={Font} fontWeight="700">
        Routing Engine
      </text>
    </g>
  );
}

// ─── Main Hero Visual ───
export default function HeroVisual() {
  const [mounted, setMounted] = useState(false);
  const [userRequestActive, setUserRequestActive] = useState(false);
  const [localActive, setLocalActive] = useState(false);
  const [remoteActive, setRemoteActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg
        viewBox="0 0 1000 620"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <Defs />
        <TechGrid />
        <HandBackdrop />
        <RouteBranches />
        <UserRequestBranch />
        <g opacity="0.85">
          <HumanHand />
          <AIHand />
        </g>
        <InputLabel active={userRequestActive} onClick={() => setUserRequestActive((v) => !v)} />
        <RoutingSpark />
        <RoutingEngineLabel onClick={() => navigate('/demo')} />
        <ModelNodes
          localActive={localActive}
          remoteActive={remoteActive}
          onToggleLocal={() => setLocalActive((v) => !v)}
          onToggleRemote={() => setRemoteActive((v) => !v)}
        />
      </svg>
    </div>
  );
}