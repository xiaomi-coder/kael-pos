export function exportToCSV(filename: string, rows: (string | number)[][]) {
  let csv = "\\uFEFF";
  rows.forEach(row => {
    csv += row.map(c => {
      const s = String(c ?? "");
      return s.includes(",") || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",") + "\\n";
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
