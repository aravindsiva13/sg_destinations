/** Build a CSV string from rows and trigger a browser download. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  // Neutralize spreadsheet formula injection: cells that begin with =, +, - or
  // @ would be executed as formulas in Excel/Sheets when opened from a file.
  const escape = (val: string | number) => {
    let s = String(val ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}