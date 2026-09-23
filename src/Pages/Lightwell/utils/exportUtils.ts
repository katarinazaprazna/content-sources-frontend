type ExportRow = Record<string, unknown>;

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Prevent CSV formula injection: spreadsheet apps treat cells starting with
// these characters as formulas, so prefix them with a single quote to keep the
// value inert while it still reads as text.
function neutralizeFormula(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function csvValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'object') {
    return csvCell(neutralizeFormula(JSON.stringify(value)));
  }
  return csvCell(neutralizeFormula(String(value)));
}

function csvKeys(rows: readonly ExportRow[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }

  return keys;
}

export function buildCsv<T extends object>(rows: readonly T[]): string {
  const records = rows as readonly ExportRow[];
  const keys = csvKeys(records);
  if (keys.length === 0) {
    return '';
  }

  const body = records.map((row) => keys.map((key) => csvValue(row[key])).join(','));

  return [keys.map(csvCell).join(','), ...body].join('\n');
}

function downloadBlob(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToCsv<T extends object>(rows: T[], filename: string): void {
  downloadBlob(buildCsv(rows), 'text/csv;charset=utf-8;', filename);
}

export function exportToJson<T>(rows: T[], filename: string): void {
  downloadBlob(JSON.stringify(rows, null, 2), 'application/json;charset=utf-8;', filename);
}
