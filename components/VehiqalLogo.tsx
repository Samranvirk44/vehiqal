// Exact same logo as the app — navy rounded square + gold car + green badge
export function VehiqalIcon({ size = 36, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 180 180" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animate ? 'logo-float' : ''}
      style={animate ? { filter:'drop-shadow(0 0 24px rgba(245,166,35,0.25))' } : {}}
    >
      <rect width="180" height="180" rx="40" fill="#1A4A9E"/>
      <rect width="180" height="180" rx="40" fill="url(#iconG)" opacity="0.5"/>
      {/* Car body */}
      <rect x="22" y="100" width="136" height="38" rx="6" fill="#F5A623"/>
      <path d="M22 110 L22 138 Q22 142 26 142 L154 142 Q158 142 158 138 L158 110 Z" fill="#D98A10"/>
      {/* Roof */}
      <path d="M48 100 L58 72 Q62 64 70 64 L112 64 Q120 64 124 72 L134 100 Z" fill="#F5A623"/>
      <path d="M55 100 L63 76 Q66 70 72 70 L110 70 Q116 70 119 76 L127 100 Z" fill="#D98A10"/>
      {/* Windscreens */}
      <path d="M88 67 L122 67 L132 98 L86 98 Z" fill="rgba(180,220,255,0.35)"/>
      <path d="M50 67 L84 67 L84 98 L42 98 Z" fill="rgba(180,220,255,0.28)"/>
      {/* Left tyre */}
      <circle cx="55" cy="145" r="20" fill="#0D1A30"/>
      <circle cx="55" cy="145" r="13" fill="#162040"/>
      <circle cx="55" cy="145" r="5.5" fill="#F5A623"/>
      <line x1="55" y1="145" x2="55" y2="132" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
      <line x1="55" y1="145" x2="55" y2="158" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
      <line x1="55" y1="145" x2="42"  y2="145" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
      <line x1="55" y1="145" x2="68"  y2="145" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
      {/* Right tyre */}
      <circle cx="127" cy="145" r="20" fill="#0D1A30"/>
      <circle cx="127" cy="145" r="13" fill="#162040"/>
      <circle cx="127" cy="145" r="5.5" fill="#F5A623"/>
      <line x1="127" y1="145" x2="127" y2="132" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
      <line x1="127" y1="145" x2="127" y2="158" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
      <line x1="127" y1="145" x2="114"  y2="145" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
      <line x1="127" y1="145" x2="140"  y2="145" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
      {/* Front headlight — flashes */}
      <rect className={animate ? 'hl-flash' : ''} x="21" y="108" width="15" height="9" rx="3.5" fill="#FFF8DC"/>
      {/* Beam — flashes with headlight */}
      {animate && (
        <polygon className="beam-flash" points="21,109 21,117 -32,124 -32,102" fill="rgba(255,248,180,0.6)"/>
      )}
      {/* Tail light */}
      <rect className={animate ? 'hl-flash' : ''} x="146" y="108" width="13" height="9" rx="3.5" fill="#FF6644"/>
      {/* Green verified badge */}
      <circle cx="142" cy="55" r="19" fill="#1A9E6A"/>
      <circle cx="142" cy="55" r="15" fill="#1A9E6A" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      <path d="M134 55 L140 61 L151 47" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <defs>
        <linearGradient id="iconG" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A4A9E"/>
          <stop offset="100%" stopColor="#060E1E"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export function VehiqalWordmark({ className = '', size = 'text-xl' }: { className?: string; size?: string }) {
  return (
    <span className={`font-black tracking-tight ${size} ${className}`}>
      <span className="text-white">Veh</span>
      <span className="iq-pulse">iq</span>
      <span className="text-white">al</span>
    </span>
  )
}
