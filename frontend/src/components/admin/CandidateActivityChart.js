import React, { useState, useRef, useEffect, useCallback } from 'react';

const D = {
  7: [
    [42, 18], [58, 26], [51, 31], [74, 40], [69, 47], [88, 52], [96, 61]
  ],
  30: [
    [30, 12], [44, 20], [38, 18], [52, 28], [61, 30], [55, 36], 
    [72, 41], [66, 38], [81, 50], [78, 47], [92, 58], [98, 63]
  ],
  90: [
    [20, 8], [34, 15], [41, 19], [38, 24], [55, 30], [62, 41], 
    [58, 38], [74, 52], [80, 55], [91, 66], [88, 64], [104, 78]
  ]
};

const W = 640;
const H = 250;
const L = 34;
const B = 28;
const T = 10;
const MAX_VAL = 120;
const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const curve = (pts) =>
  pts.reduce((a, p, i, r) => {
    if (!i) return `M${p[0]} ${p[1]}`;
    const q = r[i - 1];
    const c = (p[0] - q[0]) / 2;
    return a + ` C${q[0] + c} ${q[1]} ${p[0] - c} ${p[1]} ${p[0]} ${p[1]}`;
  }, '');

export default function CandidateActivityChart() {
  const [range, setRange] = useState(7);
  const [tipState, setTipState] = useState({
    visible: false,
    title: '',
    valA: 0,
    valB: 0,
    left: 0,
    top: 0
  });
  const [cursorState, setCursorState] = useState({ visible: false, x: 0, y1: 0, y2: 0 });
  const [pathKey, setPathKey] = useState(0);

  const svgRef = useRef(null);
  const data = D[range];

  const getX = useCallback(
    (i) => L + (i * (W - L - 8)) / (data.length - 1),
    [data.length]
  );
  const getY = useCallback(
    (v) => T + (H - T - B) * (1 - v / MAX_VAL),
    []
  );

  useEffect(() => {
    setPathKey((k) => k + 1);
    setTipState({ visible: false, title: '', valA: 0, valB: 0, left: 0, top: 0 });
    setCursorState({ visible: false, x: 0, y1: 0, y2: 0 });
  }, [range]);

  const handlePointerMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rc = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const px = ((clientX - rc.left) / rc.width) * W;

    const idx = Math.max(
      0,
      Math.min(data.length - 1, Math.round(((px - L) / (W - L - 8)) * (data.length - 1)))
    );

    const xVal = getX(idx);
    const yValA = getY(data[idx][0]);
    const yValB = getY(data[idx][1]);

    const title = range === 7 ? LABELS[idx] : `Day ${idx + 1}`;

    setCursorState({
      visible: true,
      x: xVal,
      y1: yValA,
      y2: yValB
    });

    setTipState({
      visible: true,
      title,
      valA: data[idx][0],
      valB: data[idx][1],
      left: (xVal / W) * rc.width,
      top: (Math.min(yValA, yValB) / H) * rc.height
    });
  };

  const handlePointerLeave = () => {
    setTipState((s) => ({ ...s, visible: false }));
    setCursorState((s) => ({ ...s, visible: false }));
  };

  const ptsA = data.map((v, i) => [getX(i), getY(v[0])]);
  const ptsB = data.map((v, i) => [getX(i), getY(v[1])]);
  const baseY = getY(0);

  const pathA = curve(ptsA);
  const pathB = curve(ptsB);
  const areaA = `${pathA} L${ptsA[ptsA.length - 1][0]} ${baseY} L${ptsA[0][0]} ${baseY}Z`;
  const areaB = `${pathB} L${ptsB[ptsB.length - 1][0]} ${baseY} L${ptsB[0][0]} ${baseY}Z`;

  return (
    <article className="card pad rise" style={{ '--d': 2 }}>
      <div className="ph">
        <div>
          <h2>Candidate activity</h2>
          <p>Enrollments and exam submissions over time</p>
        </div>
        <div className="seg" id="seg">
          <button
            className={range === 7 ? 'on' : ''}
            onClick={() => setRange(7)}
          >
            7 days
          </button>
          <button
            className={range === 30 ? 'on' : ''}
            onClick={() => setRange(30)}
          >
            30 days
          </button>
          <button
            className={range === 90 ? 'on' : ''}
            onClick={() => setRange(90)}
          >
            90 days
          </button>
        </div>
      </div>

      <div className="lg">
        <span>
          <i style={{ background: 'var(--c1)' }}></i>Enrollments
        </span>
        <span>
          <i style={{ background: 'var(--gold)' }}></i>Submissions
        </span>
      </div>

      <div className="cw">
        <svg
          id="chart"
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Candidate activity chart"
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          onTouchEnd={handlePointerLeave}
        >
          <defs>
            <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c1)" stopOpacity="0.22" />
              <stop offset="60%" stopColor="var(--c1)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--c1)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.16" />
              <stop offset="70%" stopColor="var(--gold)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines and horizontal values */}
          {[0, 40, 80, 120].map((v) => (
            <g key={v}>
              <line
                x1={L}
                x2={W}
                y1={getY(v)}
                y2={getY(v)}
                stroke="var(--bd)"
                strokeDasharray={v === 0 ? 'none' : '3 4'}
                strokeWidth={v === 0 ? '1.2' : '1'}
              />
              <text
                x="0"
                y={getY(v) + 4}
                fill="var(--mu)"
                fontSize="11"
                fontWeight="500"
              >
                {v}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {data.map((_, i) => {
            if (data.length <= 7 || i % Math.ceil(data.length / 6) === 0) {
              const label = range === 7 ? LABELS[i] : i + 1;
              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={H - 6}
                  fill="var(--mu)"
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {label}
                </text>
              );
            }
            return null;
          })}

          {/* Area Gradients */}
          <path
            key={`area-a-${pathKey}`}
            d={areaA}
            fill="url(#ga)"
            style={{
              animation: 'rise 0.8s ease forwards'
            }}
          />
          <path
            key={`area-b-${pathKey}`}
            d={areaB}
            fill="url(#gb)"
            style={{
              animation: 'rise 0.9s ease forwards'
            }}
          />

          {/* Submissions (Gold Curve) */}
          <path
            key={`path-b-${pathKey}`}
            d={pathB}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2.4"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{
              animation: 'draw 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards'
            }}
          />

          {/* Enrollments (Blue Curve) */}
          <path
            key={`path-a-${pathKey}`}
            d={pathA}
            fill="none"
            stroke="var(--c1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{
              animation: 'draw 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards'
            }}
          />

          {/* Interactive cursor line */}
          <line
            y1={T}
            y2={H - B}
            x1={cursorState.x}
            x2={cursorState.x}
            stroke="var(--mu)"
            strokeDasharray="3 4"
            strokeWidth="1.2"
            opacity={cursorState.visible ? 0.9 : 0}
            style={{ transition: 'opacity 0.15s ease' }}
          />

          {/* Data point dot for Enrollments (A) */}
          <circle
            cx={cursorState.x}
            cy={cursorState.y1}
            r="5.5"
            fill="var(--sf)"
            stroke="var(--c1)"
            strokeWidth="2.6"
            opacity={cursorState.visible ? 1 : 0}
            style={{ transition: 'opacity 0.15s ease' }}
          />

          {/* Data point dot for Submissions (B) */}
          <circle
            cx={cursorState.x}
            cy={cursorState.y2}
            r="5"
            fill="var(--sf)"
            stroke="var(--gold)"
            strokeWidth="2.6"
            opacity={cursorState.visible ? 1 : 0}
            style={{ transition: 'opacity 0.15s ease' }}
          />
        </svg>

        {/* Enhanced Glass Tooltip */}
        <div
          className="tip"
          id="tip"
          style={{
            left: `${tipState.left}px`,
            top: `${tipState.top}px`,
            opacity: tipState.visible ? 1 : 0,
            transform: tipState.visible ? 'translate(-50%, -120%) scale(1)' : 'translate(-50%, -110%) scale(0.95)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: 'var(--tx)' }}>
            {tipState.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--c1)', marginBottom: '2px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c1)', display: 'inline-block' }}></span>
            <span><strong>{tipState.valA}</strong> Enrolled candidates</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--gold)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }}></span>
            <span><strong>{tipState.valB}</strong> Exam submissions</span>
          </div>
        </div>
      </div>
    </article>
  );
}
