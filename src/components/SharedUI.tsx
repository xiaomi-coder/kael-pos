import { ReactNode } from 'react';
import { T } from '../constants';

export const FL = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, color: T.textM, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
      {label}
    </label>
    {children}
  </div>
);

export const Badge = ({ text, color }: { text: string; color: string }) => (
  <span style={{ background: `${color}18`, color, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
    {text}
  </span>
);

export const IBtn = ({ onClick, color, children, title }: { onClick?: (e: any) => void; color: string; children: ReactNode; title?: string }) => (
  <button 
    title={title} 
    onClick={onClick} 
    style={{ background: `${color}14`, border: "none", color, cursor: "pointer", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}
  >
    {children}
  </button>
);
