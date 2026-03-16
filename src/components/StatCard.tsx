import { T } from '../constants';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  color: string;
  icon: string;
}

const sCard = { 
  background: T.card, borderRadius: 16, padding: "20px 24px", 
  boxShadow: T.shadow, border: `1px solid ${T.border}` 
};

export const StatCard = ({ title, value, change, color, icon }: StatCardProps) => (
  <div style={{ ...sCard, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -4, right: -4, width: 56, height: 56, borderRadius: "50%", background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 22, opacity: 0.6 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 12, color: T.textM, marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{value}</div>
    {change !== undefined && (
      <div style={{ fontSize: 12, marginTop: 8, color: Number(change) >= 0 ? T.green : T.red, fontWeight: 700 }}>
        {Number(change) >= 0 ? "↑" : "↓"} {Math.abs(Number(change))}%
      </div>
    )}
  </div>
);
