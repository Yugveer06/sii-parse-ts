import { Buffer } from 'buffer';
import { promises, readFileSync, statSync } from 'fs';
import { extname, resolve } from 'path';

/* ============================================================
   Types
   ============================================================ */

/**
 * Primitive value types allowed in SII files.
 * `null` is included for `nil` / `null` SII values.
 */
export type SiiPrimitive = string | number | boolean | null;

/**
 * Any valid value that can exist in an SII file.
 */
export type SiiValue = SiiPrimitive | SiiObject | readonly SiiValue[];

/**
 * Generic object structure used by SII blocks.
 */
export interface SiiObject {
  readonly [key: string]: SiiValue;
}

/* ============================================================
   Type-safe parsing helpers
   ============================================================ */

/**
 * Parse SII file with type assertion
 */
export async function parseSiiFileAs<T>(filePath: string): Promise<T> {
  const result = await parseSiiFile(filePath);
  return result as T;
}

/**
 * Parse SII file synchronously with type assertion
 */
export function parseSiiFileSyncAs<T>(filePath: string): T {
  const result = parseSiiFileSync(filePath);
  return result as T;
}

/**
 * Parse SII content with type assertion
 */
export function parseSiiAs<T>(input: string): T {
  const result = parseSii(input);
  return result as T;
}

/* ============================================================
   Parser
   ============================================================ */

/**
 * Validates if the SII content is in a supported plaintext format
 * @param input - Raw SII file content
 * @returns true if valid plaintext SII, false otherwise
 */
export function isValidSiiContent(input: string): boolean {
  if (typeof input !== 'string' || input.trim().length === 0) {
    return false;
  }

  const trimmed = input.trim();

  // Check for encrypted/binary formats
  if (trimmed.startsWith('SCSC') || trimmed.startsWith('BSII')) {
    return false;
  }

  // Check for binary content (non-printable characters in first 100 bytes)
  const firstChunk = trimmed.slice(0, 100);
  for (let i = 0; i < firstChunk.length; i++) {
    const code = firstChunk.charCodeAt(i);
    // Allow common whitespace and printable ASCII
    if (code < 9 || (code > 13 && code < 32) || code > 126) {
      return false;
    }
  }

  // Must contain SiiNunit (case insensitive)
  if (!/SiiNunit/i.test(trimmed)) {
    return false;
  }

  // Must have balanced braces
  let braceCount = 0;
  for (const char of trimmed) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount < 0) return false;
  }

  return braceCount === 0;
}

/**
 * Parses raw `.sii` text content into a structured object.
 *
 * @param input - Raw `.sii` file content as a string
 * @returns Parsed SII object
 *
 * @throws Error if braces are unbalanced, grammar is invalid, or file is encrypted
 */
export function parseSii(input: string): SiiObject;
export function parseSii<T>(input: string): T;
export function parseSii<T = SiiObject>(input: string): T {
  if (!isValidSiiContent(input)) {
    throw new Error(
      'Invalid SII content: File may be encrypted, corrupted, or not a valid SII file. Only plaintext SIIN format is supported.'
    );
  }
  const lines: readonly string[] = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//'));

  const root: Record<string, SiiValue> = {};
  const stack: SiiObject[] = [];
  let current: SiiObject = root;

  /** Holds last standalone identifier (e.g. `SiiNunit`) */
  let pendingBlockName: string | null = null;

  for (const line of lines) {
    /* --------------------------------------------------------
       Standalone identifier (e.g. SiiNunit)
       -------------------------------------------------------- */
    if (/^\w+$/.test(line)) {
      pendingBlockName = line;
      continue;
    }

    /* --------------------------------------------------------
       Named block: key : id {
       -------------------------------------------------------- */
    const namedBlockMatch = /^(\w+)\s*:\s*([^\s{]+)\s*\{$/.exec(line);
    if (namedBlockMatch) {
      const blockName = namedBlockMatch[1];
      const blockId = namedBlockMatch[2];

      if (blockName === undefined || blockId === undefined) {
        throw new Error('Invalid named block format');
      }

      const block: SiiObject = { id: blockId };

      const existing = current[blockName];
      const blocks: readonly SiiObject[] = Array.isArray(existing)
        ? [...(existing as SiiObject[]), block]
        : [block];

      (current as Record<string, SiiValue>)[blockName] = blocks;

      stack.push(current);
      current = block;
      pendingBlockName = null;
      continue;
    }

    /* --------------------------------------------------------
       Anonymous block opening "{"
       -------------------------------------------------------- */
    if (line === '{') {
      if (!pendingBlockName) {
        throw new Error('Anonymous block without a name');
      }

      const obj: SiiObject = {};
      (current as Record<string, SiiValue>)[pendingBlockName] = obj;

      stack.push(current);
      current = obj;
      pendingBlockName = null;
      continue;
    }

    /* --------------------------------------------------------
       Block end
       -------------------------------------------------------- */
    if (line === '}') {
      const parent = stack.pop();
      if (!parent) {
        throw new Error("Unbalanced '}' in SII file");
      }
      current = parent;
      continue;
    }

    /* --------------------------------------------------------
       Key-value
       -------------------------------------------------------- */
    const kvMatch = /^([\w.]+)(?:\[(\d+)\])?\s*:\s*(.+)$/.exec(line);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const indexRaw = kvMatch[2];
    const rawValue = kvMatch[3];

    if (key === undefined || rawValue === undefined) {
      throw new Error('Invalid key-value format');
    }

    const value = parseValue(rawValue);

    if (indexRaw !== undefined) {
      const index = Number(indexRaw);
      const existing = current[key];

      let array: SiiValue[];
      if (Array.isArray(existing)) {
        array = [...(existing as SiiValue[])];
      } else if (typeof existing === 'number') {
        array = new Array(existing) as SiiValue[];
      } else {
        array = [];
      }

      array[index] = value;
      (current as Record<string, SiiValue>)[key] = array;
    } else {
      (current as Record<string, SiiValue>)[key] = value;
    }
  }

  if (stack.length !== 0) {
    throw new Error("Unbalanced '{' in SII file");
  }

  return root as T;
}

/* ============================================================
   Sugar APIs
   ============================================================ */

/**
 * Parses a `.sii` file from disk (sync).
 *
 * @param filePath - Path to the `.sii` file
 * @returns Parsed SII object
 */
export function parseSiiFileSync(filePath: string): SiiObject;
export function parseSiiFileSync<T>(filePath: string): T;
export function parseSiiFileSync<T = SiiObject>(filePath: string): T {
  const content = readFileSync(filePath, 'utf8');
  return parseSii(content) as T;
}

/**
 * Parses a `.sii` file from disk (async).
 *
 * @param filePath - Path to the `.sii` file
 * @returns Promise resolving to parsed SII object
 */
export async function parseSiiFile(filePath: string): Promise<SiiObject>;
export async function parseSiiFile<T>(filePath: string): Promise<T>;
export async function parseSiiFile<T = SiiObject>(filePath: string): Promise<T> {
  const content = await promises.readFile(filePath, 'utf8');
  return parseSii(content) as T;
}

/* ============================================================
   Value Parser
   ============================================================ */

/**
 * Converts a raw SII value string into a typed value.
 *
 * Rules:
 * - `"string"` → string
 * - `true` / `false` → boolean
 * - `nil` / `null` → null
 * - numeric → number
 * - `0xHEX` → integer (hex)
 * - `&HEX` → float (IEEE 754 big-endian)
 * - `(val, val, ...)` → array (recursive parse)
 * - fallback → string token
 *
 * @param raw - Raw value string
 * @returns Parsed primitive value
 */
function parseValue(raw: string): SiiValue {
  if (raw === 'nil' || raw === 'null') {
    return null;
  }

  if (raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1);
  }

  if (raw === 'true') return true;
  if (raw === 'false') return false;

  if (raw.startsWith('&')) {
    const hex = raw.slice(1).toLowerCase();
    if (hex.length === 8 && /^[0-9a-f]{8}$/.test(hex)) {
      try {
        const buf = Buffer.from(hex, 'hex');
        return buf.readFloatBE(0);
      } catch (e) {
        console.log('Error parsing float:', e);
      }
    }
    return raw;
  }

  if (/^[+-]?0[xX][0-9a-fA-F]+$/.test(raw)) {
    const sign = raw.startsWith('-') ? -1 : 1;
    const hexPart = raw.replace(/^[+-]?0[xX]/, '');
    return sign * parseInt(hexPart, 16);
  }

  const num = Number(raw);
  if (!Number.isNaN(num)) {
    return num;
  }

  // Handle parenthesized values (vectors, quaternions, placements)
  if (raw.startsWith('(') && raw.endsWith(')')) {
    const normalizedRaw = raw.trim().replace(/\s+/g, ' ');
    const tuples = normalizedRaw.match(/\([^()]+\)/g);
    if (tuples && tuples.length > 1) {
      const reconstructed = tuples.join(' ');
      if (reconstructed === normalizedRaw) {
        return tuples.map((t) => parseValue(t));
      }
    }

    // Single tuple: vector or quaternion
    const inner = raw.slice(1, -1).trim().replace(/;/g, ',');
    const parts = inner
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return parts.map((p) => parseValue(p));
  }

  return raw;
}

export function isValidSiiPath(filePath: string): boolean {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    return false;
  }

  const resolvedPath: string = resolve(filePath);

  if (extname(resolvedPath).toLowerCase() !== '.sii') {
    return false;
  }

  try {
    const stats = statSync(resolvedPath);
    if (!stats.isFile()) {
      return false;
    }

    // Check if file content is valid SII format
    const content = readFileSync(resolvedPath, 'utf8');
    return isValidSiiContent(content);
  } catch {
    return false;
  }
}
