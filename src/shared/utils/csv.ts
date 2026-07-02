export function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return '';
  }
  const columns = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
}
