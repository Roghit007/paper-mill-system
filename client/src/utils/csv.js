// Small helpers to download data as a CSV file that opens correctly in Excel.

const esc = (v) => {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // stop spreadsheet formulas such as =CMD() from being executed
  if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// columns: [{ label: 'Machine', key: 'machineId' }  or  { label, value: (row) => ... }]
export function toCsv(columns, rows) {
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows
    .map((r) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(','))
    .join('\r\n');
  return '\uFEFF' + head + '\r\n' + body;
}

export function downloadCsv(filename, columns, rows) {
  const blob = new Blob([toCsv(columns, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Builds columns automatically from the fields of any list of records
export function autoColumns(rows) {
  const skip = new Set(['_id', '__v', 'id', 'updatedAt']);
  const keys = [];
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (!skip.has(k) && !keys.includes(k)) keys.push(k); }));
  return keys.map((k) => ({
    label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
    value: (r) => {
      const v = r[k];
      return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) ? v.slice(0, 10) : v;
    }
  }));
}