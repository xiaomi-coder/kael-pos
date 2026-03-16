import { T } from './constants';

export const sCard = { 
  background: T.card, borderRadius: 16, padding: "20px 24px", 
  boxShadow: T.shadow, border: `1px solid ${T.border}` 
};
export const sBtn = { 
  background: T.accent, color: "#fff", border: "none", 
  borderRadius: 12, padding: "12px 24px", fontWeight: 700, 
  cursor: "pointer", fontSize: 14 
};
export const sBtnG = { ...sBtn, background: T.green };
export const sBtnS = { 
  background: "transparent", color: T.textM, border: `1.5px solid ${T.border}`, 
  borderRadius: 12, padding: "10px 20px", cursor: "pointer", 
  fontSize: 13, fontWeight: 500 
};
export const sInput = { 
  background: T.cardAlt, border: `1.5px solid ${T.border}`, 
  borderRadius: 12, padding: "12px 16px", color: T.text, fontSize: 14, 
  width: "100%", boxSizing: "border-box" as const, outline: "none", 
  fontFamily: "inherit" 
};
export const sSelect = { ...sInput, appearance: "none" as const };
