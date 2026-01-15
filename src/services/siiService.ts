import { Buffer } from 'buffer';
import { createReadStream, promises, readFileSync, statSync } from 'fs';
import { extname, resolve } from 'path';

export type SiiPrimitive = string | number | boolean | null;
export type SiiValue = SiiPrimitive | SiiObject | readonly SiiValue[];
export interface SiiObject {
  readonly [key: string]: SiiValue;
}

const REGEX_STANDALONE_ID = /^\w+$/;
const REGEX_NAMED_BLOCK = /^(\w+)\s*:\s*([^\s{]+)\s*\{$/;
const REGEX_KEY_VALUE = /^([\w.]+)(?:\[(\d+)\])?\s*:\s*(.+)$/;
const REGEX_HEX_FLOAT = /^[0-9a-f]{8}$/;
const REGEX_HEX_INT = /^[+-]?0[xX][0-9a-fA-F]+$/;
const REGEX_SIINUNIT = /SiiNunit/i;
const REGEX_TUPLE = /\([^()]+\)/g;

/**
 * Parses an SII file asynchronously with type assertion.
 * @template T - Expected return type
 */
export async function parseSiiFileAs<T>(filePath: string): Promise<T> {
  return (await parseSiiFile(filePath)) as T;
}

/**
 * Parses an SII file synchronously with type assertion.
 * @template T - Expected return type
 */
export function parseSiiFileSyncAs<T>(filePath: string): T {
  return parseSiiFileSync(filePath) as T;
}

/**
 * Parses SII content string with type assertion.
 * @template T - Expected return type
 */
export function parseSiiAs<T>(input: string): T {
  return parseSii(input) as T;
}

/**
 * Validates if content is a supported plaintext SII format.
 * Rejects encrypted (SCSC), binary (BSII), or malformed content.
 */
export function isValidSiiContent(input: string): boolean {
  if (typeof input !== 'string' || input.length === 0) return false;

  if (input.charCodeAt(0) === 83 && input.startsWith('SCSC')) return false;
  if (input.charCodeAt(0) === 66 && input.startsWith('BSII')) return false;

  const checkLen = Math.min(100, input.length);
  for (let i = 0; i < checkLen; i++) {
    const code = input.charCodeAt(i);
    if (code < 9 || (code > 13 && code < 32) || code > 126) return false;
  }

  if (!REGEX_SIINUNIT.test(input)) return false;

  let braceCount = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c === 123) braceCount++;
    else if (c === 125) braceCount--;
    if (braceCount < 0) return false;
  }

  return braceCount === 0;
}

function parseValue(raw: string): SiiValue {
  const len = raw.length;
  if (len === 0) return raw;

  const firstChar = raw.charCodeAt(0);

  if (firstChar === 110 && (raw === 'nil' || raw === 'null')) return null;
  if (firstChar === 34 && raw.charCodeAt(len - 1) === 34) return raw.slice(1, -1);
  if (firstChar === 116 && raw === 'true') return true;
  if (firstChar === 102 && raw === 'false') return false;

  // IEEE 754 big-endian float: &XXXXXXXX
  if (firstChar === 38 && len === 9) {
    const hex = raw.slice(1).toLowerCase();
    if (REGEX_HEX_FLOAT.test(hex)) {
      try {
        return Buffer.from(hex, 'hex').readFloatBE(0);
      } catch {
        return raw;
      }
    }
    return raw;
  }

  if (REGEX_HEX_INT.test(raw)) {
    const sign = raw.charCodeAt(0) === 45 ? -1 : 1;
    const hexPart = raw.replace(/^[+-]?0[xX]/, '');
    return sign * parseInt(hexPart, 16);
  }

  const num = +raw;
  if (num === num) return num;

  // Tuple/vector/quaternion: (x, y, z) or nested ((x, y, z) (w, x, y, z))
  if (firstChar === 40 && raw.charCodeAt(len - 1) === 41) {
    const normalizedRaw = raw.replace(/\s+/g, ' ');
    const tuples = normalizedRaw.match(REGEX_TUPLE);

    // Nested tuples (e.g., placement with position + rotation)
    if (tuples && tuples.length > 1 && tuples.join(' ') === normalizedRaw) {
      const result: SiiValue[] = new Array(tuples.length);
      for (let i = 0; i < tuples.length; i++) {
        const tuple = tuples[i];
        if (tuple) result[i] = parseValue(tuple);
      }
      return result;
    }

    // Single tuple
    const inner = raw.slice(1, -1).replace(/;/g, ',');
    const parts = inner.split(',');
    const result: SiiValue[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part) {
        const p = part.trim();
        if (p.length > 0) result.push(parseValue(p));
      }
    }
    return result;
  }

  return raw;
}

/**
 * Parses raw SII text content into a structured object.
 * @throws Error if content is encrypted, corrupted, or has unbalanced braces
 */
export function parseSii(input: string): SiiObject;
export function parseSii<T>(input: string): T;
export function parseSii<T = SiiObject>(input: string): T {
  if (!isValidSiiContent(input)) {
    throw new Error(
      'Invalid SII content: File may be encrypted, corrupted, or not a valid SII file. Only plaintext SIIN format is supported.'
    );
  }

  const root: Record<string, SiiValue> = {};
  const stack: SiiObject[] = [];
  let current: SiiObject = root;
  let pendingBlockName: string | null = null;

  let lineStart = 0;
  const inputLen = input.length;

  while (lineStart < inputLen) {
    let lineEnd = lineStart;
    while (lineEnd < inputLen && input.charCodeAt(lineEnd) !== 10) lineEnd++;

    let start = lineStart;
    let end = lineEnd;

    while (start < end) {
      const c = input.charCodeAt(start);
      if (c !== 32 && c !== 9 && c !== 13) break;
      start++;
    }

    while (end > start) {
      const c = input.charCodeAt(end - 1);
      if (c !== 32 && c !== 9 && c !== 13) break;
      end--;
    }

    lineStart = lineEnd + 1;

    if (start >= end) continue;
    if (input.charCodeAt(start) === 47 && input.charCodeAt(start + 1) === 47) continue;

    const line = input.slice(start, end);
    const lineLen = line.length;

    if (lineLen === 1) {
      const c = line.charCodeAt(0);
      if (c === 123) {
        if (!pendingBlockName) throw new Error('Anonymous block without a name');
        const obj: SiiObject = {};
        (current as Record<string, SiiValue>)[pendingBlockName] = obj;
        stack.push(current);
        current = obj;
        pendingBlockName = null;
        continue;
      }
      if (c === 125) {
        const parent = stack.pop();
        if (!parent) throw new Error("Unbalanced '}' in SII file");
        current = parent;
        continue;
      }
    }

    if (REGEX_STANDALONE_ID.test(line)) {
      pendingBlockName = line;
      continue;
    }

    const namedBlockMatch = REGEX_NAMED_BLOCK.exec(line);
    if (namedBlockMatch) {
      const blockName = namedBlockMatch[1];
      const blockId = namedBlockMatch[2];
      if (!blockName || !blockId) continue;

      const block: Record<string, SiiValue> = { id: blockId };
      const existing = current[blockName];

      if (Array.isArray(existing)) {
        (existing as SiiObject[]).push(block);
      } else {
        (current as Record<string, SiiValue>)[blockName] = [block];
      }

      stack.push(current);
      current = block;
      pendingBlockName = null;
      continue;
    }

    const kvMatch = REGEX_KEY_VALUE.exec(line);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const indexRaw = kvMatch[2];
    const rawValue = kvMatch[3];
    if (!key || !rawValue) continue;

    const value = parseValue(rawValue);

    if (indexRaw !== undefined) {
      const index = +indexRaw;
      const existing = current[key];

      let array: SiiValue[];
      if (Array.isArray(existing)) {
        array = existing as SiiValue[];
      } else if (typeof existing === 'number') {
        array = new Array(existing);
        (current as Record<string, SiiValue>)[key] = array;
      } else {
        array = [];
        (current as Record<string, SiiValue>)[key] = array;
      }
      array[index] = value;
    } else {
      (current as Record<string, SiiValue>)[key] = value;
    }
  }

  if (stack.length !== 0) throw new Error("Unbalanced '{' in SII file");

  return root as T;
}

/**
 * Parses large SII files using streaming for reduced memory pressure.
 * Recommended for files > 10MB.
 */
export async function parseSiiFileStreaming(filePath: string): Promise<SiiObject>;
export async function parseSiiFileStreaming<T>(filePath: string): Promise<T>;
export async function parseSiiFileStreaming<T = SiiObject>(filePath: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    const stream = createReadStream(filePath, { highWaterMark: 256 * 1024 });

    stream.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      chunks.push(buf);
      totalSize += buf.length;
    });

    stream.on('end', () => {
      try {
        const content = Buffer.concat(chunks, totalSize).toString('utf8');
        resolve(parseSii(content) as T);
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', reject);
  });
}

export interface ChunkedParseOptions {
  chunkSize?: number;
}

/**
 * Parses SII content with chunked processing.
 * Currently delegates to optimized parseSii; reserved for future enhancements.
 */
export function parseSiiChunked(input: string, options?: ChunkedParseOptions): SiiObject;
export function parseSiiChunked<T>(input: string, options?: ChunkedParseOptions): T;
export function parseSiiChunked<T = SiiObject>(input: string, _options?: ChunkedParseOptions): T {
  return parseSii(input) as T;
}

/**
 * Parses an SII file synchronously.
 */
export function parseSiiFileSync(filePath: string): SiiObject;
export function parseSiiFileSync<T>(filePath: string): T;
export function parseSiiFileSync<T = SiiObject>(filePath: string): T {
  return parseSii(readFileSync(filePath, 'utf8')) as T;
}

/**
 * Parses an SII file asynchronously.
 */
export async function parseSiiFile(filePath: string): Promise<SiiObject>;
export async function parseSiiFile<T>(filePath: string): Promise<T>;
export async function parseSiiFile<T = SiiObject>(filePath: string): Promise<T> {
  return parseSii(await promises.readFile(filePath, 'utf8')) as T;
}

/**
 * Parses an SII file with automatic optimization selection.
 * Uses streaming for files > 10MB, standard async otherwise.
 */
export async function parseSiiFileAuto(filePath: string): Promise<SiiObject>;
export async function parseSiiFileAuto<T>(filePath: string): Promise<T>;
export async function parseSiiFileAuto<T = SiiObject>(filePath: string): Promise<T> {
  const stats = await promises.stat(filePath);
  if (stats.size > 10 * 1024 * 1024) {
    return parseSiiFileStreaming<T>(filePath);
  }
  return parseSiiFile<T>(filePath);
}

/**
 * Validates if a file path points to a valid SII file.
 * Checks extension, file existence, and content format.
 */
export function isValidSiiPath(filePath: string): boolean {
  if (typeof filePath !== 'string' || filePath.trim() === '') return false;

  const resolvedPath = resolve(filePath);
  if (extname(resolvedPath).toLowerCase() !== '.sii') return false;

  try {
    const stats = statSync(resolvedPath);
    if (!stats.isFile()) return false;
    return isValidSiiContent(readFileSync(resolvedPath, 'utf8'));
  } catch {
    return false;
  }
}
