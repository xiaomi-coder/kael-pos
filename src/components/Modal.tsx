import { ReactNode } from 'react';
import { T } from '../constants';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

const sOverlay = { 
  position: "fixed" as const, 
  top: 0, left: 0, right: 0, bottom: 0, 
  background: "rgba(28,25,23,0.4)", 
  display: "flex", alignItems: "center", justifyContent: "center", 
  zIndex: 1000, backdropFilter: "blur(8px)" 
};

const sModal = { 
  background: T.card, borderRadius: 24, padding: 32, width: "92%", 
  boxShadow: T.shadowXl, maxHeight: "90vh", overflowY: "auto" as const 
};

export const Modal = ({ show, onClose, title, children, wide }: ModalProps) => {
  if (!show) return null;
  
  return (
    <div style={sOverlay} onClick={onClose}>
      <div style={{ ...sModal, maxWidth: wide ? 650 : 500 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{ background: T.cardAlt, border: "none", color: T.textM, fontSize: 18, cursor: "pointer", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
