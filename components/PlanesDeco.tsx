import styles from "@/app/landing.module.css";

const PLANES = [
  { x: 110, y: 50, sz: 1.3, rot: -40, op: 0.156, tx2: 162.1, ty2: 112.0 },
  { x: 70, y: 120, sz: 0.9, rot: -35, op: 0.108, tx2: 111.9, ty2: 179.8 },
  { x: 130, y: 180, sz: 1.1, rot: -45, op: 0.132, tx2: 184.4, ty2: 234.4 },
  { x: 55, y: 250, sz: 0.75, rot: -38, op: 0.09, tx2: 98.1, ty2: 305.2 },
  { x: 115, y: 310, sz: 1.0, rot: -42, op: 0.12, tx2: 165.2, ty2: 365.7 },
  { x: 75, y: 390, sz: 0.85, rot: -36, op: 0.102, tx2: 117.3, ty2: 448.2 },
  { x: 135, y: 460, sz: 0.7, rot: -40, op: 0.084, tx2: 179.4, ty2: 512.9 },
];

export default function PlanesDeco() {
  return (
    <div className={styles.planesDeco}>
      <svg
        width="160"
        height="520"
        viewBox="0 0 160 520"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, pointerEvents: "none" }}
      >
        {PLANES.map((p, i) => (
          <line
            key={`trail-${i}`}
            x1={p.x}
            y1={p.y}
            x2={p.tx2}
            y2={p.ty2}
            stroke="#1c1712"
            strokeWidth="1"
            strokeDasharray="4 7"
            opacity={p.op}
          />
        ))}
        {PLANES.map((p, i) => (
          <g key={`plane-${i}`} transform={`translate(${p.x},${p.y}) rotate(${p.rot}) scale(${p.sz})`}>
            <path d="M0,-14 L5,4 L0,1 L-5,4 Z" fill="#1c1712" />
            <path d="M-3,3 L0,1 L3,3" fill="#1c1712" />
          </g>
        ))}
      </svg>
    </div>
  );
}
