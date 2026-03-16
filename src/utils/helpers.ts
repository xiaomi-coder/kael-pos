export const fmt = (n: number | string): string => Number(n || 0).toLocaleString("uz-UZ");

export const getDateRange = (d: number): string => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString().split("T")[0];
};

export const pctCh = (c: number, p: number): string => 
  p === 0 ? (c > 0 ? "100" : "0") : (((c - p) / Math.abs(p)) * 100).toFixed(1);

export const nowTime = (): string => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};

export const getToday = (): string => new Date().toISOString().split("T")[0];

export const filterSales = (sales: any[], f: string, t: string) => sales.filter(s => s.date >= f && s.date <= t);
export const sumF = (a: any[], f: string) => a.reduce((s: number, x: any) => s + (x[f] || 0), 0);
