import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import * as S from '../styles';
import { T } from '../constants';
import { Badge, IBtn, Modal, FL } from '../components';
import { fmt } from '../utils';

export const WarehousePage = () => {
  const { products, setProducts, logActivity } = useStorage();
  
  const [whSearch, setWhSearch] = useState("");
  const [showProdModal, setShowProdModal] = useState(false);
  const [editProd, setEditProd] = useState<any>(null);
  const [prodForm, setProdForm] = useState({ name: "", unit: "dona", price: "", cost: "", stock: "", minStock: "" });

  const filtered = whSearch ? products.filter(p => p.name.toLowerCase().includes(whSearch.toLowerCase())) : products;

  const handleAddProduct = () => {
    if (!prodForm.name || !prodForm.price) return;
    if (editProd) {
      setProducts(prev => prev.map(p => p.id === editProd.id ? { ...p, name: prodForm.name, unit: prodForm.unit, price: Number(prodForm.price), cost: Number(prodForm.cost), stock: Number(prodForm.stock) || 0, minStock: Number(prodForm.minStock) || 10 } : p));
      logActivity("Tizim", `Mahsulot tahrirlandi: ${prodForm.name}`, "", ""); 
      setEditProd(null);
    } else {
      setProducts(prev => [...prev, { id: Math.max(0, ...prev.map(x => x.id)) + 1, name: prodForm.name, unit: prodForm.unit, price: Number(prodForm.price), cost: Number(prodForm.cost), stock: Number(prodForm.stock) || 0, minStock: Number(prodForm.minStock) || 10 }]);
      logActivity("Tizim", `Yangi mahsulot: ${prodForm.name}`, "", "");
    }
    setProdForm({ name: "", unit: "dona", price: "", cost: "", stock: "", minStock: "" }); 
    setShowProdModal(false);
  };

  const startEditProduct = (p: any) => { 
    setProdForm({ name: p.name, unit: p.unit, price: String(p.price), cost: String(p.cost), stock: String(p.stock), minStock: String(p.minStock) }); 
    setEditProd(p); 
    setShowProdModal(true); 
  };
  
  const deleteProduct = (id: number) => { 
    if (confirm("O'chirmoqchimisiz?")) { 
      setProducts(prev => prev.filter(p => p.id !== id)); 
      logActivity("Tizim", "Mahsulot o'chirildi", "", ""); 
    } 
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Ombor</h2>
        <button style={S.sBtn} onClick={() => { setEditProd(null); setProdForm({ name: "", unit: "dona", price: "", cost: "", stock: "", minStock: "" }); setShowProdModal(true); }}>
          + Yangi mahsulot
        </button>
      </div>
      <input style={{ ...S.sInput, marginBottom: 14, maxWidth: 320 }} placeholder="Qidirish..." value={whSearch} onChange={e => setWhSearch(e.target.value)} />
      
      <div style={{ ...S.sCard, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cardAlt }}>
                {["#","Mahsulot","Birlik","Tannarx","Narx","Qoldiq","Min","Qiymat","Holat",""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 10px", color: T.textM, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderLight}`, background: p.stock <= p.minStock ? T.redLight : "transparent" }}>
                  <td style={{ padding: "10px", color: T.textD }}>{i + 1}</td>
                  <td style={{ padding: "10px", fontWeight: 700 }}>{p.name}</td>
                  <td style={{ padding: "10px", color: T.textM }}>{p.unit}</td>
                  <td style={{ padding: "10px", color: T.textM }}>{fmt(p.cost)}</td>
                  <td style={{ padding: "10px", color: T.accent, fontWeight: 700 }}>{fmt(p.price)}</td>
                  <td style={{ padding: "10px", fontWeight: 800, color: p.stock <= p.minStock ? T.red : T.text }}>{p.stock}</td>
                  <td style={{ padding: "10px", color: T.textD }}>{p.minStock}</td>
                  <td style={{ padding: "10px", color: T.green }}>{fmt(p.price * p.stock)}</td>
                  <td style={{ padding: "10px" }}>
                    <Badge text={p.stock === 0 ? "TUGADI" : p.stock <= p.minStock ? "Kam" : "OK"} color={p.stock === 0 ? T.red : p.stock <= p.minStock ? T.orange : T.green} />
                  </td>
                  <td style={{ padding: "10px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <IBtn color={T.blue} onClick={() => startEditProduct(p)}>✎</IBtn>
                      <IBtn color={T.red} onClick={() => deleteProduct(p.id)}>✕</IBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={showProdModal} onClose={() => { setShowProdModal(false); setEditProd(null); }} title={editProd ? "Tahrirlash" : "Yangi mahsulot"}>
        <FL label="Nomi"><input style={S.sInput} value={prodForm.name} onChange={e => setProdForm(p => ({ ...p, name: e.target.value }))} /></FL>
        <FL label="Birlik">
          <select style={S.sSelect} value={prodForm.unit} onChange={e => setProdForm(p => ({ ...p, unit: e.target.value }))}>
            {["dona","kg","tonna","metr","kv.m","ming","litr"].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </FL>
        <FL label="Tannarx"><input type="number" style={S.sInput} value={prodForm.cost} onChange={e => setProdForm(p => ({ ...p, cost: e.target.value }))} /></FL>
        <FL label="Sotuv narx"><input type="number" style={S.sInput} value={prodForm.price} onChange={e => setProdForm(p => ({ ...p, price: e.target.value }))} /></FL>
        <FL label="Qoldiq"><input type="number" style={S.sInput} value={prodForm.stock} onChange={e => setProdForm(p => ({ ...p, stock: e.target.value }))} /></FL>
        <FL label="Min qoldiq"><input type="number" style={S.sInput} value={prodForm.minStock} onChange={e => setProdForm(p => ({ ...p, minStock: e.target.value }))} /></FL>
        <button style={{ ...S.sBtn, width: "100%", padding: 14, borderRadius: 14 }} onClick={handleAddProduct}>{editProd ? "Saqlash" : "Qo'shish"}</button>
      </Modal>
    </div>
  );
};
