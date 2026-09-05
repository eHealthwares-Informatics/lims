import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

const SEEDS_CANDIDATES = [
  join(process.cwd(), 'seeds'),
  resolve(__dirname, '..', '..', '..', '..', 'seeds'),
  resolve(__dirname, '..', '..', '..', 'seeds'),
];

function seedsDir(): string {
  for (const candidate of SEEDS_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return SEEDS_CANDIDATES[0];
}

export function readCsv(filename: string): Record<string, string>[] {
  const dir = seedsDir();
  const content = readFileSync(join(dir, filename), 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true }) as Record<string, string>[];
}

export function boolValue(v: string | undefined, defaultValue = false): boolean {
  if (v === undefined || v === '') return defaultValue;
  return v.toLowerCase() === 'true' || v === '1' || v === 't' || v === 'Y';
}
