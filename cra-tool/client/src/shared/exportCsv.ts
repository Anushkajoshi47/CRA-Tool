// Client-side CSV export — no dependencies. Excel-friendly (BOM + CRLF).
export function exportCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = '﻿' + [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
