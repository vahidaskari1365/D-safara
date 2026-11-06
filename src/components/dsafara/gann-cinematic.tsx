"use client";

/* An illustration of Gann geometry, not a market-data feed. */
const candles = [
  [42,300,279,311,270],[59,279,287,293,267],[76,287,259,295,249],[93,259,267,275,246],
  [110,267,238,276,230],[127,238,247,255,228],[144,247,219,254,210],[161,219,229,238,211],
  [178,229,203,239,194],[195,203,215,222,192],[212,215,190,224,179],[229,190,200,210,180],
  [246,200,176,208,166],[263,176,188,198,167],[280,188,157,196,148],[297,157,169,180,148],
  [314,169,142,179,130],[331,142,154,164,134],[348,154,126,161,117],[365,126,137,147,116],
  [382,137,114,145,105],[399,114,123,133,105],[416,123,100,132,90],[433,100,110,119,92],
];

export function GannCinematic() {
  const cx = 340, cy = 230;
  return (
    <div className="gann-scene" aria-hidden="true" dir="ltr">
      <div className="gann-glow" />
      <div className="gann-orbit gann-orbit-one" />
      <div className="gann-orbit gann-orbit-two" />
      <div className="gann-terminal">
        <div className="gann-terminal-top"><span><i /> D.SAFARA <b>/</b> MARKET GEOMETRY</span><span>GANN STUDIES <b>✦</b></span></div>
        <svg className="gann-art" viewBox="0 0 680 460" fill="none">
          <defs>
            <linearGradient id="gann-line" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#35c49b" stopOpacity=".1" /><stop offset=".55" stopColor="#75f2c6" /><stop offset="1" stopColor="#e7c77a" /></linearGradient>
            <radialGradient id="gann-core"><stop stopColor="#77e9c2" stopOpacity=".2"/><stop offset="1" stopColor="#77e9c2" stopOpacity="0"/></radialGradient>
            <pattern id="gann-grid" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M 38 0 L 0 0 0 38" stroke="#a5e7d0" strokeOpacity=".11" strokeWidth=".7" /></pattern>
            <filter id="gann-blur"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>
          <rect width="680" height="460" fill="url(#gann-grid)" />
          <circle cx={cx} cy={cy} r="200" fill="url(#gann-core)" />
          <g className="gann-wheel" style={{ transformOrigin: `${cx}px ${cy}px` }}>
            {[112,150,190,210].map((r) => <circle key={r} cx={cx} cy={cy} r={r} stroke="#a2e6ce" strokeOpacity={r === 190 ? '.38' : '.15'} strokeWidth=".8" strokeDasharray={r === 210 ? '2 7' : undefined} />)}
            {Array.from({length: 24}, (_, i) => { const angle = i * Math.PI / 12; return <line key={i} x1={cx + Math.cos(angle)*195} y1={cy + Math.sin(angle)*195} x2={cx + Math.cos(angle)*(i % 2 ? 202 : 207)} y2={cy + Math.sin(angle)*(i % 2 ? 202 : 207)} stroke="#b6f2d5" strokeOpacity=".7" />; })}
            <rect x="206" y="96" width="268" height="268" stroke="#d7c385" strokeOpacity=".35" transform="rotate(45 340 230)" />
            <rect x="230" y="120" width="220" height="220" stroke="#9deacb" strokeOpacity=".22" />
            <circle cx="340" cy="20" r="3" fill="#d6c47d" />
          </g>
          <g className="gann-fan" stroke="#c7a85f" strokeOpacity=".55" strokeWidth=".8">
            {[40,90,140,190,240,290,340,390,440,490,540,590,640].map((x) => <line key={x} x1="60" y1="400" x2={x} y2="35" />)}
            <path d="M60 400 L650 400 M60 400 L60 40" strokeOpacity=".3" />
          </g>
          <path className="gann-curve-glow" d="M20 347 L59 325 L93 329 L127 290 L161 302 L195 266 L229 274 L263 238 L297 247 L331 205 L365 218 L399 175 L433 185 L467 143 L501 155 L535 110 L569 120 L620 69" stroke="#51eac3" strokeWidth="5" filter="url(#gann-blur)" />
          <path className="gann-curve" d="M20 347 L59 325 L93 329 L127 290 L161 302 L195 266 L229 274 L263 238 L297 247 L331 205 L365 218 L399 175 L433 185 L467 143 L501 155 L535 110 L569 120 L620 69" stroke="url(#gann-line)" strokeWidth="2" />
          <g className="gann-candles" opacity=".8">{candles.map(([x,o,c,h,l],i) => <g key={x} transform={`translate(${x+112},0)`} style={{ animationDelay: `${i*45}ms` }}><line x1="0" y1={h} x2="0" y2={l} stroke={c < o ? '#6ce2b5' : '#e58e88'} strokeWidth="1" /><rect x="-3" y={Math.min(o,c)} width="6" height={Math.abs(o-c)} rx="1" fill={c < o ? '#55d6a5' : '#db807e'} /></g>)}</g>
          <circle className="gann-point" cx="501" cy="155" r="4" fill="#dbf9d9" /><circle cx="501" cy="155" r="12" stroke="#8ff3c4" strokeOpacity=".5" />
          <g fill="#b8d2c7" fontFamily="monospace" fontSize="9" letterSpacing="2"><text x="38" y="35">TIME / PRICE</text><text x="554" y="420">GANN FAN</text><text x="351" y="27">90°</text><text x="554" y="226">0°</text><text x="126" y="226">180°</text><text x="351" y="446">270°</text></g>
          <g fill="#dfc584" fontFamily="monospace" fontSize="10"><text x="160" y="118">1×2</text><text x="250" y="89">1×1</text><text x="423" y="95">2×1</text></g>
        </svg>
        <div className="gann-terminal-bottom"><span>ANGLE · TIME · PRICE</span><span>ILLUSTRATIVE VISUAL</span></div>
      </div>
      <div className="gann-floating gann-label-one"><span>01 / GEOMETRY</span><strong>زمان × قیمت</strong></div>
      <div className="gann-floating gann-label-two"><span>GANN ANGLES</span><strong>1×1 &nbsp; / &nbsp; 45°</strong></div>
    </div>
  );
}
