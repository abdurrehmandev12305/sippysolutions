import type { CSSProperties, ReactElement } from "react";

import type { ServiceFeature } from "@/content/serviceFeatures";
import { cn } from "@/lib/cn";

/**
 * Illustrations for the `/services` feature sections — plain inline SVG so
 * there are no image assets to ship and they stay crisp at any size.
 * Swap any single entry in `illustrations` for real artwork without touching
 * the layout.
 *
 * Base palette is the design tokens in `globals.css`:
 * brand-500 #4f46e5 · brand-400 #818cf8 · brand-300 #a5b4fc
 * night-700 #222a41 · night-800 #161c2d · night-900 #0d121f
 *
 * Every drawing is built the same way, so the six read as one set:
 *
 *   1. a lifted body   — gradient fill + `-lift` drop shadow on a wrapper <g>
 *   2. recessed insets — `-inset` inner shadow on bays, gutters and tiles
 *   3. a light rim     — top-bright / bottom-dark gradient used as the stroke
 *   4. a drifting sheen — specular band clipped to the body
 *   5. the animation   — `ssx-*` classes, defined at the end of `globals.css`
 *
 * Two constraints worth knowing before editing:
 *
 * · All six SVGs share one document, so `url(#id)` is global — every def is
 *   namespaced with the drawing's `id` prefix.
 * · Static SVG filters go on a wrapper <g>, never on the element carrying an
 *   animated CSS `drop-shadow()`. A CSS filter list containing `url()` can
 *   only interpolate discretely, which would make the glows step.
 */

const stroke = {
  brand: "#4f46e5",
  brandLight: "#818cf8",
  brandPale: "#a5b4fc",
  line: "#222a41",
  panel: "#0d121f",
  surface: "#161c2d",
};

/** Accent hues layered over the indigo base so nothing reads as "all blue". */
const accent = {
  cyan: "#22d3ee",
  cyanPale: "#67e8f9",
  green: "#22c55e",
  greenBright: "#4ade80",
  orange: "#f97316",
  orangeBright: "#fb923c",
  purple: "#a855f7",
  purplePale: "#c084fc",
  pink: "#f472b6",
  yellow: "#facc15",
  red: "#ef4444",
  white: "#ffffff",
};

/** Inline CSS custom properties consumed by the `ssx-*` keyframes. */
type AnimStyle = CSSProperties & {
  "--ssx-peak"?: number;
  "--ssx-sweep"?: string;
};

/**
 * Depth filters shared by every drawing. Percentages set each filter region
 * wide enough that the blur is never clipped at the bounding box.
 */
function DepthFilters({ id }: { id: string }) {
  return (
    <>
      {/* Lifts a panel off the page. */}
      <filter id={`${id}-lift`} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow
          dx="0"
          dy="7"
          stdDeviation="9"
          floodColor="#02040a"
          floodOpacity="0.7"
        />
      </filter>

      {/* Same idea, tuned for small cards and badges. */}
      <filter id={`${id}-lift-sm`} x="-45%" y="-45%" width="190%" height="200%">
        <feDropShadow
          dx="0"
          dy="3"
          stdDeviation="4"
          floodColor="#02040a"
          floodOpacity="0.65"
        />
      </filter>

      {/* Recesses a surface into whatever it sits on. */}
      <filter id={`${id}-inset`} x="-25%" y="-25%" width="150%" height="150%">
        <feOffset in="SourceAlpha" dx="0" dy="2" result="off" />
        <feGaussianBlur in="off" stdDeviation="2.5" result="blur" />
        <feComposite in="SourceAlpha" in2="blur" operator="out" result="cut" />
        <feFlood floodColor="#01030a" floodOpacity="0.9" result="tint" />
        <feComposite in="tint" in2="cut" operator="in" result="ring" />
        <feComposite in="ring" in2="SourceGraphic" operator="over" />
      </filter>

      {/* Soft bloom for glow trails. */}
      <filter id={`${id}-bloom`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </>
  );
}

/**
 * Top-bright / bottom-dark stroke gradient — the cheapest convincing way to
 * make a flat shape look like a lit surface with a shaded underside.
 */
function RimGradient({ id }: { id: string }) {
  return (
    <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
      <stop offset="35%" stopColor="#8ea3c9" stopOpacity="0.1" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
    </linearGradient>
  );
}

/** The drifting specular band, plus the flat highlight used on top edges. */
function SheenGradients({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0.7">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="50%" stopColor="#dceaff" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </>
  );
}

function ServerRack() {
  const id = "ssx-srv";

  /* One hue per bay — the sequence sweeps cyan → purple → green → orange. */
  const bays = [
    { line: accent.cyan, wash: "#0f3242" },
    { line: accent.purple, wash: "#2a1147" },
    { line: accent.green, wash: "#0d3320" },
    { line: accent.orange, wash: "#3a2109" },
  ];

  return (
    <>
      <defs>
        <DepthFilters id={id} />
        <RimGradient id={id} />
        <SheenGradients id={id} />

        {/* Brushed chassis — alternating bands read as milled metal. */}
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="#0b1020" />
          <stop offset="18%" stopColor="#232c47" />
          <stop offset="34%" stopColor="#161d31" />
          <stop offset="62%" stopColor="#1f2842" />
          <stop offset="80%" stopColor="#131a2c" />
          <stop offset="100%" stopColor="#0a0e1c" />
        </linearGradient>

        {/* Bay interior, darkest at the very top where the shadow falls. */}
        <linearGradient id={`${id}-bay`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#070b16" />
          <stop offset="55%" stopColor="#0e1424" />
          <stop offset="100%" stopColor="#080d1a" />
        </linearGradient>

        {/* LED bloom */}
        <radialGradient id={`${id}-bloom-green`}>
          <stop offset="0%" stopColor={accent.green} stopOpacity="0.6" />
          <stop offset="100%" stopColor={accent.green} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-bloom-orange`}>
          <stop offset="0%" stopColor={accent.orangeBright} stopOpacity="0.6" />
          <stop offset="100%" stopColor={accent.orangeBright} stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${id}-clip`}>
          <rect x="112" y="34" width="176" height="232" rx="16" />
        </clipPath>
      </defs>

      {/* Chassis */}
      <g filter={`url(#${id}-lift)`}>
        <rect
          x="112"
          y="34"
          width="176"
          height="232"
          rx="16"
          fill={`url(#${id}-metal)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth="2"
        />
      </g>

      {/* Light travelling across the metal */}
      <g clipPath={`url(#${id}-clip)`}>
        <rect
          className="ssx-sheen"
          style={{ "--ssx-sweep": "252px" } as AnimStyle}
          x="24"
          y="24"
          width="62"
          height="252"
          fill={`url(#${id}-sheen)`}
        />
      </g>

      {/* Breathing cyan halo on the outline */}
      <rect
        className="ssx-rack-frame"
        x="112"
        y="34"
        width="176"
        height="232"
        rx="16"
        fill="none"
        stroke={accent.cyan}
        strokeWidth="1.5"
        strokeOpacity="0.16"
      />

      {/* Rack units */}
      {[0, 1, 2, 3].map((unit) => {
        const y = 56 + unit * 54;
        const bay = bays[unit];
        /* 5.2s loop ÷ 4 bays — each lights 1.3s after the one above it. */
        const sequence = `${unit * 1.3}s`;
        /* Green strikes, orange answers half a cycle later. */
        const ledGreen = `${unit * 0.22}s`;
        const ledOrange = `${unit * 0.22 - 1.7}s`;

        return (
          <g key={unit}>
            {/* Recessed bay */}
            <rect
              x="128"
              y={y}
              width="144"
              height="40"
              rx="9"
              fill={`url(#${id}-bay)`}
              filter={`url(#${id}-inset)`}
            />
            {/* Colour wash as the sequence reaches this bay */}
            <rect
              className="ssx-rack-lit"
              style={{ animationDelay: sequence }}
              x="128"
              y={y}
              width="144"
              height="40"
              rx="9"
              fill={bay.wash}
              opacity="0"
            />
            {/* Bezel */}
            <rect
              className="ssx-rack-unit"
              style={{ animationDelay: sequence }}
              x="128"
              y={y}
              width="144"
              height="40"
              rx="9"
              fill="none"
              stroke={bay.line}
              strokeOpacity="0.3"
              strokeWidth="1.5"
            />
            {/* Light catching the top lip */}
            <path
              d={`M139 ${y + 1.5}h122`}
              stroke={`url(#${id}-edge)`}
              strokeWidth="1.5"
            />

            {/* Status LEDs */}
            <circle
              className="ssx-led"
              style={{ animationDelay: ledGreen }}
              cx="144"
              cy={y + 20}
              r="10"
              fill={`url(#${id}-bloom-green)`}
            />
            <circle
              className="ssx-led"
              style={{ animationDelay: ledGreen }}
              cx="144"
              cy={y + 20}
              r="4"
              fill={accent.green}
            />
            <circle
              className="ssx-led"
              style={{ animationDelay: ledOrange }}
              cx="158"
              cy={y + 20}
              r="10"
              fill={`url(#${id}-bloom-orange)`}
            />
            <circle
              className="ssx-led"
              style={{ animationDelay: ledOrange }}
              cx="158"
              cy={y + 20}
              r="4"
              fill={accent.orangeBright}
            />

            {/* Drive vents */}
            {[0, 1, 2, 3].map((vent) => (
              <rect
                key={vent}
                className="ssx-rack-vent"
                style={{ animationDelay: `${unit * 1.3 + vent * 0.07}s` }}
                x={186 + vent * 18}
                y={y + 13}
                width="10"
                height="14"
                rx="2"
                fill={bay.line}
                opacity="0.18"
              />
            ))}
          </g>
        );
      })}

      {/* Feet */}
      <path
        d="M140 266v14M260 266v14"
        stroke={stroke.line}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  );
}

function WebBrowser() {
  const id = "ssx-web";

  /* Sidebar rows pick up their own hue; the content rows stay white. */
  const sidebarHues = [
    accent.cyanPale,
    accent.purplePale,
    accent.greenBright,
    accent.orangeBright,
  ];

  /* Window controls, left to right, exactly as a real title bar. */
  const controls = [
    { cx: 76, fill: accent.red, delay: "0s" },
    { cx: 94, fill: accent.yellow, delay: "-2s" },
    { cx: 112, fill: accent.green, delay: "-4s" },
  ];

  return (
    <>
      <defs>
        <DepthFilters id={id} />
        <RimGradient id={id} />
        <SheenGradients id={id} />

        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#1c2438" />
          <stop offset="55%" stopColor="#141a2c" />
          <stop offset="100%" stopColor="#0c111f" />
        </linearGradient>
        {/* Title bar sits proud of the body */}
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#28324d" />
          <stop offset="100%" stopColor="#171e32" />
        </linearGradient>
        {/* Glass: light pools under the top edge and fades out */}
        <linearGradient id={`${id}-glass`} x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-hero`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={accent.purple} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent.purple} stopOpacity="0.06" />
        </linearGradient>
        {/* Text rows fade along their length like anti-aliased type */}
        <linearGradient id={`${id}-row`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.45" />
        </linearGradient>

        <clipPath id={`${id}-clip`}>
          <rect x="54" y="48" width="292" height="204" rx="16" />
        </clipPath>
      </defs>

      {/* Window body */}
      <g filter={`url(#${id}-lift)`}>
        <rect
          x="54"
          y="48"
          width="292"
          height="204"
          rx="16"
          fill={`url(#${id}-body)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth="2"
        />
      </g>

      {/* Title bar, glass reflection and the drifting sheen */}
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d="M54 64a16 16 0 0 1 16-16h260a16 16 0 0 1 16 16v18H54z"
          fill={`url(#${id}-chrome)`}
        />
        <rect x="54" y="48" width="292" height="204" fill={`url(#${id}-glass)`} />
        <rect
          className="ssx-sheen"
          style={{ "--ssx-sweep": "372px" } as AnimStyle}
          x="-38"
          y="38"
          width="76"
          height="224"
          fill={`url(#${id}-sheen)`}
        />
      </g>
      <path d="M54 82h292" stroke={stroke.line} strokeWidth="2" />
      <path d="M70 49h260" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />

      {/* Purple glow breathing on the frame */}
      <rect
        className="ssx-browser-frame"
        x="54"
        y="48"
        width="292"
        height="204"
        rx="16"
        fill="none"
        stroke={accent.purple}
        strokeWidth="1.5"
        strokeOpacity="0.14"
      />

      {/* Window controls — glossy, cycling red → yellow → green */}
      {controls.map((control) => (
        <g key={control.cx}>
          <circle
            className="ssx-dot-cycle"
            style={{ animationDelay: control.delay }}
            cx={control.cx}
            cy="65"
            r="9"
            fill={control.fill}
            opacity="0.2"
          />
          <circle
            className="ssx-dot-cycle"
            style={{ animationDelay: control.delay }}
            cx={control.cx}
            cy="65"
            r="5"
            fill={control.fill}
          />
          <circle
            cx={control.cx - 1.6}
            cy="63.2"
            r="1.5"
            fill={accent.white}
            opacity="0.5"
          />
        </g>
      ))}

      {/* Address bar */}
      <rect
        x="134"
        y="57"
        width="188"
        height="16"
        rx="8"
        fill={stroke.panel}
        filter={`url(#${id}-inset)`}
      />
      <rect
        x="134"
        y="57"
        width="188"
        height="16"
        rx="8"
        fill="none"
        stroke={accent.purple}
        strokeOpacity="0.3"
      />

      {/* Sidebar */}
      <rect
        x="72"
        y="100"
        width="60"
        height="134"
        rx="8"
        fill={stroke.panel}
        filter={`url(#${id}-inset)`}
      />
      {[0, 1, 2, 3].map((row) => (
        <rect
          key={row}
          className="ssx-slide-in"
          style={
            {
              animationDelay: `${row * 0.32}s`,
              "--ssx-peak": row === 0 ? 0.85 : 0.45,
            } as AnimStyle
          }
          x="84"
          y={116 + row * 24}
          width="36"
          height="6"
          rx="3"
          fill={sidebarHues[row]}
          opacity={row === 0 ? 0.75 : 0.25}
        />
      ))}

      {/* Content */}
      <g filter={`url(#${id}-lift-sm)`}>
        <rect
          x="148"
          y="100"
          width="174"
          height="52"
          rx="8"
          fill={`url(#${id}-hero)`}
          stroke={accent.purple}
          strokeOpacity="0.35"
        />
      </g>
      <path d="M158 101h154" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />
      {[0, 1, 2].map((row) => (
        <rect
          key={row}
          className="ssx-slide-in"
          style={
            {
              animationDelay: `${1.3 + row * 0.38}s`,
              "--ssx-peak": 0.85,
            } as AnimStyle
          }
          x="148"
          y={168 + row * 22}
          width={row === 2 ? 108 : 174}
          height="8"
          rx="4"
          fill={`url(#${id}-row)`}
          opacity="0.2"
        />
      ))}
    </>
  );
}

function LockShield() {
  const id = "ssx-ssl";
  const shieldPath =
    "M200 30 322 70v86c0 60-48 102-122 124-74-22-122-64-122-124V70L200 30Z";

  return (
    <>
      <defs>
        <DepthFilters id={id} />
        <SheenGradients id={id} />

        {/* Brushed steel: fine alternating bands across the face. */}
        <linearGradient id={`${id}-brushed`} x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#161d33" stopOpacity="0.95" />
          <stop offset="14%" stopColor="#27304e" stopOpacity="0.9" />
          <stop offset="26%" stopColor="#1a2139" stopOpacity="0.92" />
          <stop offset="41%" stopColor="#2c3556" stopOpacity="0.88" />
          <stop offset="55%" stopColor="#1b2340" stopOpacity="0.92" />
          <stop offset="72%" stopColor="#252e4c" stopOpacity="0.9" />
          <stop offset="88%" stopColor="#151b30" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0f1428" stopOpacity="0.95" />
        </linearGradient>
        {/* Light pooling in the shield's upper half */}
        <linearGradient id={`${id}-face`} x1="0.2" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Rim: bright crown, dark underside */}
        <linearGradient id={`${id}-rim`} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#a5b4fc" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>

        {/* Padlock: chrome body, brighter cyan shackle */}
        <linearGradient id={`${id}-lock`} x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#2b3557" />
          <stop offset="38%" stopColor="#1a2138" />
          <stop offset="70%" stopColor="#131a2e" />
          <stop offset="100%" stopColor="#232c49" />
        </linearGradient>
        <linearGradient id={`${id}-shackle`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="45%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#1a7f92" />
        </linearGradient>

        {/* Pink sheen sweeping the face */}
        <linearGradient id={`${id}-pink`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor={accent.pink} stopOpacity="0" />
          <stop offset="50%" stopColor={accent.pink} stopOpacity="0.24" />
          <stop offset="100%" stopColor={accent.pink} stopOpacity="0" />
        </linearGradient>

        <clipPath id={`${id}-clip`}>
          <path d={shieldPath} />
        </clipPath>
      </defs>

      {/* Shield body */}
      <g filter={`url(#${id}-lift)`}>
        <path
          d={shieldPath}
          fill={`url(#${id}-brushed)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>

      <g clipPath={`url(#${id}-clip)`}>
        <path d={shieldPath} fill={`url(#${id}-face)`} />
        {/* Pink shimmer */}
        <rect
          className="ssx-sheen"
          style={{ "--ssx-sweep": "330px" } as AnimStyle}
          x="-30"
          y="20"
          width="84"
          height="272"
          fill={`url(#${id}-pink)`}
        />
        {/* Specular band */}
        <rect
          className="ssx-sheen"
          style={{ animationDelay: "-3s", "--ssx-sweep": "330px" } as AnimStyle}
          x="-70"
          y="20"
          width="58"
          height="272"
          fill={`url(#${id}-sheen)`}
        />
      </g>

      {/* Breathing green glow on the outline */}
      <path
        className="ssx-shield"
        d={shieldPath}
        fill="none"
        stroke={stroke.brand}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      <g className="ssx-padlock">
        {/* Shackle, with a highlight along its lit side */}
        <path
          d="M172 138v-20a28 28 0 0 1 56 0v20"
          fill="none"
          stroke={`url(#${id}-shackle)`}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M176 132v-14a24 24 0 0 1 15-22"
          fill="none"
          stroke={accent.white}
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Body */}
        <g filter={`url(#${id}-lift-sm)`}>
          <rect
            x="156"
            y="138"
            width="88"
            height="72"
            rx="12"
            fill={`url(#${id}-lock)`}
            stroke={accent.purple}
            strokeOpacity="0.55"
            strokeWidth="2.5"
          />
        </g>
        {/* Metallic highlight across the top face */}
        <path d="M166 139.5h68" stroke={`url(#${id}-edge)`} strokeWidth="2" />
        <path
          d="M160 150v48"
          stroke={accent.white}
          strokeOpacity="0.12"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Keyhole */}
        <circle cx="200" cy="168" r="9" fill={accent.white} />
        <path
          d="M200 177v16"
          stroke={accent.white}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="197.5" cy="165.5" r="2.5" fill="#dbeafe" opacity="0.9" />
      </g>

      {/* Secure-connection ticks — each draws itself, alternating left / right.
          The wide, faint copy rides the same curve as its own glow. */}
      {[
        { d: "M96 118l12 12 22-24", delay: "0s" },
        { d: "M270 118l12 12 22-24", delay: "3s" },
      ].map((tick) => (
        <g key={tick.d}>
          <path
            className="ssx-tick"
            style={{ animationDelay: tick.delay, "--ssx-peak": 0.22 } as AnimStyle}
            d={tick.d}
            fill="none"
            stroke={accent.greenBright}
            strokeOpacity="0"
            strokeWidth="10"
            strokeDasharray="52"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="ssx-tick"
            style={{ animationDelay: tick.delay, "--ssx-peak": 0.95 } as AnimStyle}
            d={tick.d}
            fill="none"
            stroke={accent.greenBright}
            strokeOpacity="0.9"
            strokeWidth="4"
            strokeDasharray="52"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </>
  );
}

function NetworkSwitch() {
  const id = "ssx-sw";

  /* Pulse hue rotates cyan → orange → purple around the endpoints. */
  const hues = [accent.cyan, accent.orange, accent.purple];

  const endpoints = [
    { x: 64, y: 62 },
    { x: 64, y: 150 },
    { x: 64, y: 238 },
    { x: 336, y: 62 },
    { x: 336, y: 150 },
    { x: 336, y: 238 },
  ];

  /** Drawn node → switch, so a pulse runs it from 100% back to 0%. */
  const linkPath = (point: { x: number; y: number }) =>
    `M${point.x} ${point.y}H${point.x < 200 ? 150 : 250}L200 150`;

  /* Head plus two trailing dots, strung out behind it by a small delay. */
  const trail = [
    { r: 4.5, peak: 1, lead: 0 },
    { r: 3.2, peak: 0.45, lead: 0.07 },
    { r: 2.2, peak: 0.2, lead: 0.14 },
  ];

  return (
    <>
      <defs>
        <DepthFilters id={id} />
        <RimGradient id={id} />
        <SheenGradients id={id} />

        {/* Matte-metal chassis with a light band across the upper third. */}
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#28324f" />
          <stop offset="30%" stopColor="#1a2138" />
          <stop offset="62%" stopColor="#121828" />
          <stop offset="100%" stopColor="#0a0f1d" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Domed node cap */}
        <radialGradient id={`${id}-cap`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#20293f" />
          <stop offset="100%" stopColor="#080c17" />
        </radialGradient>

        {hues.map((hue, index) => (
          <radialGradient key={hue} id={`${id}-flare-${index}`}>
            <stop offset="0%" stopColor={hue} stopOpacity="0.85" />
            <stop offset="45%" stopColor={hue} stopOpacity="0.3" />
            <stop offset="100%" stopColor={hue} stopOpacity="0" />
          </radialGradient>
        ))}
        {hues.map((hue, index) => (
          <linearGradient
            key={`port-${hue}`}
            id={`${id}-port-${index}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#070b16" />
            <stop offset="60%" stopColor={hue} stopOpacity="0.55" />
            <stop offset="100%" stopColor={hue} />
          </linearGradient>
        ))}

        <clipPath id={`${id}-clip`}>
          <rect x="130" y="112" width="140" height="76" rx="14" />
        </clipPath>
      </defs>

      {/* Trunk links — a soft wide pass under a crisp one */}
      {endpoints.map((point, index) => (
        <g key={`${point.x}-${point.y}`}>
          <path
            d={linkPath(point)}
            fill="none"
            stroke={hues[index % 3]}
            strokeOpacity="0.09"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linkPath(point)}
            fill="none"
            stroke={hues[index % 3]}
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}

      {/* Endpoint nodes */}
      {endpoints.map((point, index) => {
        const hue = hues[index % 3];
        const delay = `${index * 0.5}s`;

        return (
          <g key={`node-${point.x}-${point.y}`}>
            {/* Flare blooming as the pulse lands */}
            <circle
              className="ssx-node-glow"
              style={{ animationDelay: delay }}
              cx={point.x}
              cy={point.y}
              r="26"
              fill={`url(#${id}-flare-${index % 3})`}
              opacity="0"
            />
            {/* Ring pushing outward from the impact */}
            <circle
              className="ssx-node-halo"
              style={{
                animationDelay: delay,
                transformOrigin: `${point.x}px ${point.y}px`,
              }}
              cx={point.x}
              cy={point.y}
              r="12"
              fill="none"
              stroke={hue}
              strokeWidth="2"
              opacity="0"
            />
            <g filter={`url(#${id}-lift-sm)`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill={`url(#${id}-cap)`}
              />
            </g>
            <circle
              className="ssx-node"
              style={{ animationDelay: delay }}
              cx={point.x}
              cy={point.y}
              r="12"
              fill="none"
              stroke={hue}
              strokeOpacity="0.5"
              strokeWidth="2.5"
            />
            <path
              d={`M${point.x - 6} ${point.y - 9.5}a12 12 0 0 1 12 0`}
              fill="none"
              stroke={accent.white}
              strokeOpacity="0.3"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* Data pulses, head first with a fading trail behind */}
      {endpoints.map((point, index) =>
        trail.map((dot) => (
          <circle
            key={`pulse-${point.x}-${point.y}-${dot.lead}`}
            className="ssx-pulse"
            style={
              {
                offsetPath: `path("${linkPath(point)}")`,
                animationDelay: `${index * 0.5 - dot.lead}s`,
                "--ssx-peak": dot.peak,
              } as AnimStyle
            }
            r={dot.r}
            fill={hues[index % 3]}
            opacity="0"
          />
        )),
      )}

      {/* Switch chassis */}
      <g filter={`url(#${id}-lift)`}>
        <rect
          x="130"
          y="112"
          width="140"
          height="76"
          rx="14"
          fill={`url(#${id}-metal)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth="2.5"
        />
      </g>
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d="M130 126a14 14 0 0 1 14-14h112a14 14 0 0 1 14 14v18H130z"
          fill={`url(#${id}-gloss)`}
        />
        <rect
          className="ssx-sheen"
          style={{ "--ssx-sweep": "200px" } as AnimStyle}
          x="90"
          y="104"
          width="38"
          height="92"
          fill={`url(#${id}-sheen)`}
        />
      </g>
      <path d="M144 113h112" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />

      {/* Ports */}
      {[0, 1, 2, 3, 4, 5].map((port) => (
        <rect
          key={port}
          x={146 + port * 19}
          y="132"
          width="12"
          height="16"
          rx="2"
          fill={`url(#${id}-port-${port % 3})`}
          opacity="0.6"
        />
      ))}
      <rect
        x="146"
        y="162"
        width="60"
        height="8"
        rx="4"
        fill={accent.cyanPale}
        opacity="0.5"
      />
      <circle
        className="ssx-led"
        cx="252"
        cy="166"
        r="9"
        fill={`url(#${id}-flare-0)`}
        opacity="0.6"
      />
      <circle className="ssx-led" cx="252" cy="166" r="5" fill={accent.green} />
    </>
  );
}

function MonitoringDashboard() {
  const id = "ssx-mon";

  return (
    <>
      <defs>
        <DepthFilters id={id} />
        <RimGradient id={id} />
        <SheenGradients id={id} />

        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#1c2438" />
          <stop offset="55%" stopColor="#141a2c" />
          <stop offset="100%" stopColor="#0c111f" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0f1e" />
          <stop offset="100%" stopColor="#121a2e" />
        </linearGradient>
        {/* Traffic area: dense at the line, gone by the baseline */}
        <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent.greenBright} stopOpacity="0.38" />
          <stop offset="55%" stopColor={accent.green} stopOpacity="0.14" />
          <stop offset="100%" stopColor={accent.green} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-bar-warm`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id={`${id}-bar-cool`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <radialGradient id={`${id}-head`}>
          <stop offset="0%" stopColor={accent.white} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent.greenBright} stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${id}-clip`}>
          <rect x="52" y="44" width="296" height="212" rx="16" />
        </clipPath>
      </defs>

      {/* Dashboard body */}
      <g filter={`url(#${id}-lift)`}>
        <rect
          x="52"
          y="44"
          width="296"
          height="212"
          rx="16"
          fill={`url(#${id}-body)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth="2"
        />
      </g>
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="52" y="44" width="296" height="212" fill={`url(#${id}-glass)`} />
        <rect
          className="ssx-sheen"
          style={{ "--ssx-sweep": "376px" } as AnimStyle}
          x="-40"
          y="34"
          width="80"
          height="232"
          fill={`url(#${id}-sheen)`}
        />
      </g>
      <path d="M68 45h264" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />

      {/* KPI tiles */}
      {[0, 1, 2].map((tile) => (
        <g key={tile}>
          <g filter={`url(#${id}-lift-sm)`}>
            <rect
              x={70 + tile * 94}
              y="62"
              width="78"
              height="44"
              rx="9"
              fill={`url(#${id}-tile)`}
            />
          </g>
          <rect
            className="ssx-kpi-card"
            style={{ animationDelay: `${tile * 0.5}s` }}
            x={70 + tile * 94}
            y="62"
            width="78"
            height="44"
            rx="9"
            fill="none"
            stroke={stroke.brand}
            strokeOpacity="0.28"
          />
          <path
            d={`M${80 + tile * 94} 63h58`}
            stroke={`url(#${id}-edge)`}
            strokeWidth="1.5"
          />
          <rect
            className="ssx-kpi-bar"
            style={{ animationDelay: `${tile * 0.5}s` }}
            x={82 + tile * 94}
            y="74"
            width="30"
            height="6"
            rx="3"
            fill={accent.cyanPale}
            opacity="0.35"
          />
          <rect
            className="ssx-kpi-bar"
            style={{ animationDelay: `${tile * 0.5 + 0.18}s` }}
            x={82 + tile * 94}
            y="88"
            width="48"
            height="8"
            rx="4"
            fill={accent.white}
            opacity="0.7"
          />
        </g>
      ))}

      {/* Chart grid */}
      {[0, 1, 2, 3].map((line) => (
        <path
          key={line}
          d={`M70 ${140 + line * 26}H330`}
          stroke={stroke.line}
          strokeWidth="1.5"
        />
      ))}

      {/* Live traffic — glow trail, then the crisp line, both on one curve */}
      {/* Resting opacity is 1, not 0 — the keyframe fades it in from nothing,
          but with motion off this has to stay visible under the line. */}
      <path
        className="ssx-chart-area"
        d="M70 208l38-26 38 14 38-42 38 24 38-38 40 20v40H70Z"
        fill={`url(#${id}-area)`}
      />
      <path
        className="ssx-chart-line"
        d="M70 208l38-26 38 14 38-42 38 24 38-38 40 20"
        fill="none"
        stroke={accent.greenBright}
        strokeOpacity="0.5"
        strokeWidth="7"
        strokeDasharray="290"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${id}-bloom)`}
      />
      <path
        className="ssx-chart-line"
        d="M70 208l38-26 38 14 38-42 38 24 38-38 40 20"
        fill="none"
        stroke={accent.greenBright}
        strokeWidth="3"
        strokeDasharray="290"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        className="ssx-chart-head"
        cx="300"
        cy="160"
        r="16"
        fill={`url(#${id}-head)`}
      />
      <circle className="ssx-chart-head" cx="300" cy="160" r="5" fill={accent.white} />

      {/* Baseline bars */}
      {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
        <rect
          key={bar}
          className="ssx-bar"
          style={{ animationDelay: `${bar * 0.24}s` }}
          x={74 + bar * 38}
          y={246 - (bar % 3) * 6 - 8}
          width="20"
          height={(bar % 3) * 6 + 8}
          rx="3"
          fill={bar % 2 === 0 ? `url(#${id}-bar-warm)` : `url(#${id}-bar-cool)`}
          opacity="0.4"
        />
      ))}
    </>
  );
}

function ApiCode() {
  const id = "ssx-api";

  const codeLines = [
    { indent: 0, width: 96 },
    { indent: 18, width: 140 },
    { indent: 18, width: 108 },
    { indent: 36, width: 156 },
    { indent: 18, width: 84 },
    { indent: 0, width: 120 },
  ];

  return (
    <>
      <defs>
        <DepthFilters id={id} />
        <RimGradient id={id} />
        <SheenGradients id={id} />

        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#1c2438" />
          <stop offset="55%" stopColor="#141a2c" />
          <stop offset="100%" stopColor="#0c111f" />
        </linearGradient>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#28324d" />
          <stop offset="100%" stopColor="#171e32" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Code rows fade along their length, like syntax-coloured type */}
        <linearGradient id={`${id}-row-cyan`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent.cyanPale} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent.cyan} stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${id}-row-white`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
        </linearGradient>
        {/* Badge: chrome disc under a purple bloom */}
        <linearGradient id={`${id}-badge`} x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#2a3355" />
          <stop offset="45%" stopColor="#141b2e" />
          <stop offset="100%" stopColor="#0a0f1d" />
        </linearGradient>
        <linearGradient id={`${id}-bracket`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor={accent.purplePale} />
          <stop offset="100%" stopColor={accent.purple} />
        </linearGradient>
        <radialGradient id={`${id}-badge-bloom`}>
          <stop offset="55%" stopColor={accent.purple} stopOpacity="0" />
          <stop offset="80%" stopColor={accent.purple} stopOpacity="0.45" />
          <stop offset="100%" stopColor={accent.purple} stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${id}-clip`}>
          <rect x="58" y="52" width="284" height="196" rx="16" />
        </clipPath>
      </defs>

      {/* Editor body */}
      <g filter={`url(#${id}-lift)`}>
        <rect
          x="58"
          y="52"
          width="284"
          height="196"
          rx="16"
          fill={`url(#${id}-body)`}
          stroke={`url(#${id}-rim)`}
          strokeWidth="2"
        />
      </g>
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d="M58 68a16 16 0 0 1 16-16h252a16 16 0 0 1 16 16v18H58z"
          fill={`url(#${id}-chrome)`}
        />
        <rect x="58" y="52" width="284" height="196" fill={`url(#${id}-glass)`} />
        <rect
          className="ssx-sheen"
          style={{ "--ssx-sweep": "364px" } as AnimStyle}
          x="-36"
          y="42"
          width="72"
          height="216"
          fill={`url(#${id}-sheen)`}
        />
      </g>
      <path d="M58 86h284" stroke={stroke.line} strokeWidth="2" />
      <path d="M74 53h252" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />

      {/* Title-bar lights */}
      <circle className="ssx-led" cx="80" cy="69" r="5" fill={accent.green} />
      <circle
        className="ssx-led"
        style={{ animationDelay: "-1.7s" }}
        cx="98"
        cy="69"
        r="5"
        fill={accent.orangeBright}
      />

      {/* Gutter */}
      <rect
        x="70"
        y="86"
        width="34"
        height="162"
        fill={stroke.panel}
        opacity="0.55"
        filter={`url(#${id}-inset)`}
      />
      <path d="M104 86v162" stroke={stroke.line} strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <circle
          key={row}
          className="ssx-gutter-dot"
          /* 4.6s loop: the runner reaches row `n` at 6% + 14n%. */
          style={{ animationDelay: `${row * 0.644}s` }}
          cx="82"
          cy={112 + row * 24}
          r="2.5"
          fill={stroke.brandPale}
          opacity="0.3"
        />
      ))}
      {/* Orange marker stepping down the bullets */}
      <g className="ssx-gutter-fade" opacity="0">
        <circle
          className="ssx-gutter-runner"
          cx="82"
          cy="112"
          r="3.5"
          fill={accent.orange}
        />
      </g>

      {/* Code lines */}
      {codeLines.map((line, index) => (
        <rect
          key={index}
          className="ssx-code-line"
          style={
            {
              animationDelay: `${index * 0.4}s`,
              "--ssx-peak": index % 2 === 0 ? 0.85 : 0.6,
            } as AnimStyle
          }
          x={124 + line.indent}
          y={108 + index * 24}
          width={line.width}
          height="8"
          rx="4"
          fill={
            index % 2 === 0 ? `url(#${id}-row-cyan)` : `url(#${id}-row-white)`
          }
          opacity={index % 2 === 0 ? 0.55 : 0.25}
        />
      ))}

      {/* Angle-brackets badge */}
      <circle
        className="ssx-badge-halo"
        cx="306"
        cy="212"
        r="40"
        fill={`url(#${id}-badge-bloom)`}
        opacity="0.12"
      />
      <g filter={`url(#${id}-lift-sm)`}>
        <circle
          cx="306"
          cy="212"
          r="34"
          fill={`url(#${id}-badge)`}
          stroke={accent.purple}
          strokeOpacity="0.6"
          strokeWidth="2.5"
        />
      </g>
      <path
        d="M288 196a34 34 0 0 1 36-6"
        fill="none"
        stroke={accent.white}
        strokeOpacity="0.3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        className="ssx-badge-brackets"
        d="M297 200l-12 12 12 12M315 200l12 12-12 12"
        fill="none"
        stroke={accent.purple}
        strokeOpacity="0.5"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${id}-bloom)`}
      />
      <path
        className="ssx-badge-brackets"
        d="M297 200l-12 12 12 12M315 200l12 12-12 12"
        fill="none"
        stroke={`url(#${id}-bracket)`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

const illustrations: Record<ServiceFeature["illustration"], () => ReactElement> = {
  server: ServerRack,
  browser: WebBrowser,
  shield: LockShield,
  switch: NetworkSwitch,
  monitoring: MonitoringDashboard,
  api: ApiCode,
};

export function ServiceIllustration({
  name,
  className,
}: {
  name: ServiceFeature["illustration"];
  className?: string;
}) {
  const Drawing = illustrations[name];

  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      role="presentation"
      aria-hidden
      className={cn("h-auto w-full", className)}
    >
      <Drawing />
    </svg>
  );
}
