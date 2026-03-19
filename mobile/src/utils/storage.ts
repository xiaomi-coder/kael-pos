export const STORE_KEY = "kael-pos-v2";

export async function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) { 
    console.error("Load error:", e); 
  }
  return null;
}

export async function saveData(data: any) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch(e) { 
    console.error("Save error:", e); 
  }
}
