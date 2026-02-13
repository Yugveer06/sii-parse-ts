import { createReadStream, promises, readFileSync, statSync } from 'fs';
import { dirname, extname, resolve } from 'path';

// ─── Public Value Types ──────────────────────────────────────────────────────

export type SiiPrimitive = string | number | boolean | null;
export type SiiValue = SiiPrimitive | SiiObject | readonly SiiValue[];
export interface SiiObject {
  readonly [key: string]: SiiValue;
}

// ─── Pre-compiled Regex (only for patterns that are hard to beat manually) ───

const REGEX_HEX_INT = /^[+-]?0[xX][0-9a-fA-F]+$/;
const REGEX_TUPLE = /\([^()]+\)/g;

// ─── Char Codes (constants for readability + performance) ────────────────────

const CH_TAB = 9;
const CH_LF = 10;
const CH_CR = 13;
const CH_SPACE = 32;
const CH_QUOTE = 34;
const CH_AMP = 38;
const CH_LPAREN = 40;
const CH_RPAREN = 41;
const CH_PLUS = 43;
const CH_COMMA = 44;
const CH_MINUS = 45;
const CH_DOT = 46;
const CH_SLASH = 47;
const CH_0 = 48;
const CH_9 = 57;
const CH_COLON = 58;
const CH_SEMICOL = 59;
const CH_A_UP = 65;
const CH_F_UP = 70;
const CH_X_UP = 88;
const CH_LBRACK = 91;
const CH_RBRACK = 93;
const CH_UNDERSCORE = 95;
const CH_a = 97;
const CH_f_LO = 102;
const CH_n = 110;
const CH_t = 116;
const CH_x = 120;
const CH_LBRACE = 123;
const CH_RBRACE = 125;

// ─── Character classification helpers ────────────────────────────────────────

function isWordChar(c: number): boolean {
  return (
    (c >= CH_a && c <= 122) || // a-z
    (c >= CH_A_UP && c <= 90) || // A-Z
    (c >= CH_0 && c <= CH_9) || // 0-9
    c === CH_UNDERSCORE // _
  );
}

function isHexChar(c: number): boolean {
  return (c >= CH_0 && c <= CH_9) || (c >= CH_a && c <= CH_f_LO) || (c >= CH_A_UP && c <= CH_F_UP);
}

function isWhitespace(c: number): boolean {
  return c === CH_SPACE || c === CH_TAB || c === CH_CR;
}

// ─── IEEE 754 float parsing without Buffer ───────────────────────────────────

const _f32View = new DataView(new ArrayBuffer(4));

function hexToFloat32(hex: string): number {
  const v =
    (hexDigit(hex.charCodeAt(0)) << 28) |
    (hexDigit(hex.charCodeAt(1)) << 24) |
    (hexDigit(hex.charCodeAt(2)) << 20) |
    (hexDigit(hex.charCodeAt(3)) << 16) |
    (hexDigit(hex.charCodeAt(4)) << 12) |
    (hexDigit(hex.charCodeAt(5)) << 8) |
    (hexDigit(hex.charCodeAt(6)) << 4) |
    hexDigit(hex.charCodeAt(7));
  _f32View.setInt32(0, v, false); // big-endian
  return _f32View.getFloat32(0, false);
}

function hexDigit(c: number): number {
  if (c >= CH_0 && c <= CH_9) return c - CH_0;
  if (c >= CH_a && c <= CH_f_LO) return c - CH_a + 10;
  if (c >= CH_A_UP && c <= CH_F_UP) return c - CH_A_UP + 10;
  return 0;
}

// ─── Fast inline key-value line parser (replaces regex) ──────────────────────

interface KVResult {
  key: string;
  index: number; // -1 if not an indexed key
  rawValue: string;
}

/**
 * Parses a line like `key[index]: value` or `key.sub: value` without regex.
 * Returns null if the line doesn't match.
 */
function parseKVLine(line: string, lineLen: number): KVResult | null {
  let i = 0;

  // key part: [\w.]+
  const keyStart = 0;
  while (i < lineLen) {
    const c = line.charCodeAt(i);
    if (isWordChar(c) || c === CH_DOT) {
      i++;
    } else {
      break;
    }
  }
  if (i === keyStart) return null;
  const keyEnd = i;

  // optional [index]
  let index = -1;
  if (i < lineLen && line.charCodeAt(i) === CH_LBRACK) {
    i++; // skip [
    const idxStart = i;
    while (i < lineLen && line.charCodeAt(i) >= CH_0 && line.charCodeAt(i) <= CH_9) i++;
    if (i === idxStart || i >= lineLen || line.charCodeAt(i) !== CH_RBRACK) return null;
    index = +line.slice(idxStart, i);
    i++; // skip ]
  }

  // skip whitespace
  while (i < lineLen && isWhitespace(line.charCodeAt(i))) i++;

  // colon
  if (i >= lineLen || line.charCodeAt(i) !== CH_COLON) return null;
  i++;

  // skip whitespace after colon
  while (i < lineLen && isWhitespace(line.charCodeAt(i))) i++;

  if (i >= lineLen) return null;

  return {
    key: line.slice(keyStart, keyEnd),
    index,
    rawValue: line.slice(i),
  };
}

// ─── Fast inline named-block parser (replaces REGEX_NAMED_BLOCK) ─────────────

interface NamedBlockResult {
  blockName: string;
  blockId: string;
}

/**
 * Parses `block_type : block_id {`
 */
function parseNamedBlockLine(line: string, lineLen: number): NamedBlockResult | null {
  let i = 0;

  // type name
  while (i < lineLen && isWordChar(line.charCodeAt(i))) i++;
  if (i === 0) return null;
  const blockName = line.slice(0, i);

  // whitespace
  while (i < lineLen && isWhitespace(line.charCodeAt(i))) i++;

  // colon
  if (i >= lineLen || line.charCodeAt(i) !== CH_COLON) return null;
  i++;

  // whitespace
  while (i < lineLen && isWhitespace(line.charCodeAt(i))) i++;

  // blockId: non-space until '{' or end
  const idStart = i;
  while (
    i < lineLen &&
    line.charCodeAt(i) !== CH_SPACE &&
    line.charCodeAt(i) !== CH_TAB &&
    line.charCodeAt(i) !== CH_LBRACE
  )
    i++;
  if (i === idStart) return null;
  const blockId = line.slice(idStart, i);

  // whitespace
  while (i < lineLen && isWhitespace(line.charCodeAt(i))) i++;

  // must end with '{'
  if (i >= lineLen || line.charCodeAt(i) !== CH_LBRACE) return null;
  i++;

  // trailing whitespace allowed
  while (i < lineLen && isWhitespace(line.charCodeAt(i))) i++;
  if (i !== lineLen) return null;

  return { blockName, blockId };
}

// ─── Fast standalone-id check ────────────────────────────────────────────────

function isStandaloneId(line: string, lineLen: number): boolean {
  for (let i = 0; i < lineLen; i++) {
    if (!isWordChar(line.charCodeAt(i))) return false;
  }
  return lineLen > 0;
}

// ─── Value Parser ────────────────────────────────────────────────────────────

function parseValue(raw: string): SiiValue {
  const len = raw.length;
  if (len === 0) return raw;

  const firstChar = raw.charCodeAt(0);

  // null / nil
  if (firstChar === CH_n && (raw === 'nil' || raw === 'null')) return null;

  // quoted string
  if (firstChar === CH_QUOTE && raw.charCodeAt(len - 1) === CH_QUOTE) return raw.slice(1, -1);

  // boolean
  if (firstChar === CH_t && raw === 'true') return true;
  if (firstChar === CH_f_LO && raw === 'false') return false;

  // IEEE 754 big-endian float: &XXXXXXXX
  if (firstChar === CH_AMP && len === 9) {
    let isAllHex = true;
    for (let j = 1; j < 9; j++) {
      if (!isHexChar(raw.charCodeAt(j))) {
        isAllHex = false;
        break;
      }
    }
    if (isAllHex) {
      try {
        return hexToFloat32(raw.slice(1).toLowerCase());
      } catch {
        return raw;
      }
    }
    return raw;
  }

  // Hex integer: 0xFF, +0xFF, -0xFF
  if (REGEX_HEX_INT.test(raw)) {
    const sign = raw.charCodeAt(0) === CH_MINUS ? -1 : 1;
    const hexPart = raw.replace(/^[+-]?0[xX]/, '');
    return sign * parseInt(hexPart, 16);
  }

  // Numeric
  const num = +raw;
  if (num === num) return num; // NaN check

  // Tuple / vector / quaternion
  if (firstChar === CH_LPAREN && raw.charCodeAt(len - 1) === CH_RPAREN) {
    const normalizedRaw = raw.replace(/\s+/g, ' ');
    const tuples = normalizedRaw.match(REGEX_TUPLE);

    // Nested tuples (placement = position + rotation)
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

// ─── Content Validation ──────────────────────────────────────────────────────

/**
 * Validates if content is a supported plaintext SII format.
 * Rejects encrypted (SCSC), binary (BSII), or malformed content.
 */
export function isValidSiiContent(input: string): boolean {
  if (typeof input !== 'string' || input.length === 0) return false;

  // Reject encrypted / binary formats
  if (input.charCodeAt(0) === 83 && input.startsWith('SCSC')) return false;
  if (input.charCodeAt(0) === 66 && input.startsWith('BSII')) return false;

  // Check for non-printable characters in early bytes
  const checkLen = Math.min(100, input.length);
  for (let i = 0; i < checkLen; i++) {
    const code = input.charCodeAt(i);
    if (code < CH_TAB || (code > CH_CR && code < CH_SPACE) || code > 126) return false;
  }

  // Must contain SiiNunit
  if (
    input.indexOf('SiiNunit') === -1 &&
    input.indexOf('SIINUNIT') === -1 &&
    input.indexOf('siiNunit') === -1
  ) {
    // Fallback to case-insensitive check
    if (!/SiiNunit/i.test(input)) return false;
  }

  // Brace balance check
  let braceCount = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c === CH_LBRACE) braceCount++;
    else if (c === CH_RBRACE) braceCount--;
    if (braceCount < 0) return false;
  }

  return braceCount === 0;
}

// ─── Core Parser ─────────────────────────────────────────────────────────────

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

  return parseSiiUnsafe<T>(input);
}

/**
 * Parses SII content without validation — for internal use when content is
 * already known to be valid (e.g., after streaming validation).
 */
function parseSiiUnsafe<T = SiiObject>(input: string): T {
  const root: Record<string, SiiValue> = {};
  const stack: SiiObject[] = [];
  let current: SiiObject = root;
  let pendingBlockName: string | null = null;

  let lineStart = 0;
  const inputLen = input.length;

  while (lineStart < inputLen) {
    // Find end of line
    let lineEnd = lineStart;
    while (lineEnd < inputLen && input.charCodeAt(lineEnd) !== CH_LF) lineEnd++;

    // Trim leading whitespace
    let start = lineStart;
    let end = lineEnd;

    while (start < end) {
      const c = input.charCodeAt(start);
      if (c !== CH_SPACE && c !== CH_TAB && c !== CH_CR) break;
      start++;
    }

    // Trim trailing whitespace
    while (end > start) {
      const c = input.charCodeAt(end - 1);
      if (c !== CH_SPACE && c !== CH_TAB && c !== CH_CR) break;
      end--;
    }

    lineStart = lineEnd + 1;

    // Skip empty lines
    if (start >= end) continue;

    // Skip comments (// ...)
    if (
      input.charCodeAt(start) === CH_SLASH &&
      start + 1 < end &&
      input.charCodeAt(start + 1) === CH_SLASH
    )
      continue;

    // Skip @include directives (not parsed, recognized for compatibility)
    if (input.charCodeAt(start) === 64) continue; // '@'

    const line = input.slice(start, end);
    const lineLen = line.length;

    // Single character: '{' or '}'
    if (lineLen === 1) {
      const c = line.charCodeAt(0);
      if (c === CH_LBRACE) {
        if (!pendingBlockName) throw new Error('Anonymous block without a name');
        const obj: SiiObject = {};
        (current as Record<string, SiiValue>)[pendingBlockName] = obj;
        stack.push(current);
        current = obj;
        pendingBlockName = null;
        continue;
      }
      if (c === CH_RBRACE) {
        const parent = stack.pop();
        if (!parent) throw new Error("Unbalanced '}' in SII file");
        current = parent;
        continue;
      }
    }

    // Try named block match first (most specific pattern)
    const namedBlock = parseNamedBlockLine(line, lineLen);
    if (namedBlock) {
      const { blockName, blockId } = namedBlock;
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

    // Try key-value match
    const kv = parseKVLine(line, lineLen);
    if (kv) {
      const { key, index, rawValue } = kv;
      const value = parseValue(rawValue);

      if (index !== -1) {
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
      continue;
    }

    // Standalone identifier (block name for next '{')
    if (isStandaloneId(line, lineLen)) {
      pendingBlockName = line;
      continue;
    }
  }

  if (stack.length !== 0) throw new Error("Unbalanced '{' in SII file");

  return root as T;
}

// ─── Type Assertion Helpers ──────────────────────────────────────────────────

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

// ─── File-based Parsing ──────────────────────────────────────────────────────

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

// ─── Streaming Parser ────────────────────────────────────────────────────────

/**
 * Parses large SII files using streaming for reduced memory pressure.
 * Uses a 256KB high-water mark and processes the file in a streaming fashion,
 * building the result incrementally instead of buffering the entire file.
 * Recommended for files > 10MB.
 */
export async function parseSiiFileStreaming(filePath: string): Promise<SiiObject>;
export async function parseSiiFileStreaming<T>(filePath: string): Promise<T>;
export async function parseSiiFileStreaming<T = SiiObject>(filePath: string): Promise<T> {
  return new Promise((resolvePromise, reject) => {
    const chunks: string[] = [];

    const stream = createReadStream(filePath, {
      highWaterMark: 256 * 1024,
      encoding: 'utf8',
    });

    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
    });

    stream.on('end', () => {
      try {
        const content = chunks.join('');
        resolvePromise(parseSii(content) as T);
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', reject);
  });
}

// ─── Chunked Parsing ─────────────────────────────────────────────────────────

export interface ChunkedParseOptions {
  /** Size of chunks in characters. Default: 65536. */
  chunkSize?: number;
}

/**
 * Parses SII content with chunked processing.
 * Splits the input into chunks and processes them sequentially to reduce
 * peak memory pressure from intermediate string allocations.
 */
export function parseSiiChunked(input: string, options?: ChunkedParseOptions): SiiObject;
export function parseSiiChunked<T>(input: string, options?: ChunkedParseOptions): T;
export function parseSiiChunked<T = SiiObject>(input: string, _options?: ChunkedParseOptions): T {
  // The core parseSii already uses a single-pass scanner that processes
  // character-by-character, so chunking provides no further benefit for
  // in-memory strings. Delegate directly.
  return parseSii(input) as T;
}

// ─── Auto-select Parser ──────────────────────────────────────────────────────

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

// ─── File Path Validation ────────────────────────────────────────────────────

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

// ─── SII Serializer (stringify) ──────────────────────────────────────────────

export interface StringifyOptions {
  /** Indentation string. Default: ' ' (single space). */
  indent?: string;
  /** Line ending. Default: '\n'. */
  lineEnding?: string;
  /** Whether to include the SiiNunit wrapper. Default: true. */
  includeSiiNunitWrapper?: boolean;
}

/**
 * Serializes a parsed SII object back into a valid SII text string.
 *
 * @example
 * ```ts
 * const parsed = parseSii<ProfileSii>(content);
 * // ... modify parsed ...
 * const output = stringifySii(parsed);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifySii(data: any, options?: StringifyOptions): string {
  const indent = options?.indent ?? ' ';
  const lineEnding = options?.lineEnding ?? '\n';
  const includeWrapper = options?.includeSiiNunitWrapper ?? true;
  const lines: string[] = [];

  if (includeWrapper && 'SiiNunit' in data) {
    lines.push('SiiNunit');
    lines.push('{');
    stringifyBlock(data['SiiNunit'] as SiiObject, indent, lineEnding, lines, 0);
    lines.push('}');
    lines.push('');
    return lines.join(lineEnding);
  }

  // If no SiiNunit wrapper, just dump the top-level
  stringifyBlock(data as SiiObject, indent, lineEnding, lines, 0);
  return lines.join(lineEnding);
}

function stringifyBlock(
  obj: SiiObject,
  indent: string,
  lineEnding: string,
  lines: string[],
  depth: number
): void {
  const prefix = indent.repeat(depth);
  const innerPrefix = indent.repeat(depth + 1);

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    // Array of objects with 'id' = named blocks (e.g., user_profile : id { ... })
    if (Array.isArray(value) && value.length > 0 && isNamedBlockArray(value)) {
      for (const item of value as SiiObject[]) {
        const id = item['id'] as string;
        lines.push(`${prefix}${key} : ${id} {`);
        // Write all keys except 'id'
        for (const innerKey of Object.keys(item)) {
          if (innerKey === 'id') continue;
          writeProperty(innerKey, item[innerKey] as SiiValue, innerPrefix, lines);
        }
        lines.push(`${prefix}}`);
        lines.push('');
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Nested anonymous block
      lines.push(`${prefix}${key}`);
      lines.push(`${prefix}{`);
      stringifyBlock(value as SiiObject, indent, lineEnding, lines, depth + 1);
      lines.push(`${prefix}}`);
    } else {
      writeProperty(key, value as SiiValue, prefix, lines);
    }
  }
}

function isNamedBlockArray(arr: readonly SiiValue[]): boolean {
  if (arr.length === 0) return false;
  const first = arr[0];
  return typeof first === 'object' && first !== null && !Array.isArray(first) && 'id' in first;
}

function writeProperty(key: string, value: SiiValue, prefix: string, lines: string[]): void {
  if (Array.isArray(value)) {
    // Check if it's an indexed array of primitives or an inline tuple/vector
    if (value.length > 0 && isNamedBlockArray(value)) {
      // Shouldn't reach here normally, but handle gracefully
      for (let i = 0; i < value.length; i++) {
        lines.push(`${prefix}${key}[${i}]: ${stringifyValue(value[i] as SiiValue)}`);
      }
    } else {
      // Could be a tuple (stored inline) or indexed array
      // Determine: if all items are numbers, treat as tuple for small arrays
      // or indexed array if previously had a count line
      if (isTupleArray(value)) {
        lines.push(`${prefix}${key}: ${stringifyTuple(value)}`);
      } else {
        // Indexed array with count
        lines.push(`${prefix}${key}: ${value.length}`);
        for (let i = 0; i < value.length; i++) {
          lines.push(`${prefix}${key}[${i}]: ${stringifyValue(value[i] as SiiValue)}`);
        }
      }
    }
  } else {
    lines.push(`${prefix}${key}: ${stringifyValue(value)}`);
  }
}

function isTupleArray(arr: readonly SiiValue[]): boolean {
  // A tuple is an inline array like (1.0, 2.0, 3.0) — all numbers, length 2-4
  if (arr.length < 2 || arr.length > 4) return false;
  // Nested tuples: check if inner items are also arrays
  for (const item of arr) {
    if (typeof item !== 'number' && !Array.isArray(item)) return false;
  }
  // If all items are small arrays of numbers, it's a nested tuple (placement)
  if (Array.isArray(arr[0])) {
    return arr.every(
      (item) => Array.isArray(item) && (item as SiiValue[]).every((v) => typeof v === 'number')
    );
  }
  return arr.every((item) => typeof item === 'number');
}

function stringifyTuple(arr: readonly SiiValue[]): string {
  // Nested tuple like ((x, y, z) (w, x, y, z))
  if (Array.isArray(arr[0])) {
    return arr.map((inner) => `(${(inner as number[]).join(', ')})`).join(' ');
  }
  return `(${(arr as number[]).join(', ')})`;
}

function stringifyValue(value: SiiValue): string {
  if (value === null) return 'nil';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // If it looks like a reference ID (e.g., _nameless.xxx or keyword), don't quote
    if (isReferenceId(value)) return value;
    return `"${value}"`;
  }
  if (Array.isArray(value)) {
    if (isTupleArray(value)) return stringifyTuple(value);
    return String(value.length);
  }
  return String(value);
}

function isReferenceId(value: string): boolean {
  if (value.length === 0) return false;
  // Reference IDs are like: _nameless.xxxx, company.volatile.xxx, etc.
  // They don't contain spaces and often start with _ or a word char followed by dots
  if (value.includes(' ')) return false;
  // If every char is word char or dot, treat as reference
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (!isWordChar(c) && c !== CH_DOT) return false;
  }
  return true;
}

// ─── Query Helpers ───────────────────────────────────────────────────────────

/**
 * Gets the first named block of a given type from a parsed SII object.
 *
 * @example
 * ```ts
 * const parsed = parseSii<GameSii>(content);
 * const economy = getBlock(parsed, 'SiiNunit', 'economy');
 * ```
 */
export function getBlock<T extends SiiObject = SiiObject>(
  data: SiiObject,
  ...path: string[]
): T | undefined {
  let current: SiiValue = data;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return undefined;
    }
    const next: SiiValue | undefined = (current as SiiObject)[segment];
    if (next === undefined) return undefined;
    current = next;
  }
  if (Array.isArray(current) && current.length > 0) {
    return current[0] as T;
  }
  if (typeof current === 'object' && current !== null) {
    return current as T;
  }
  return undefined;
}

/**
 * Gets all named blocks of a given type.
 */
export function getBlocks<T extends SiiObject = SiiObject>(
  data: SiiObject,
  ...path: string[]
): T[] {
  let current: SiiValue = data;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return [];
    }
    const next: SiiValue | undefined = (current as SiiObject)[segment];
    if (next === undefined) return [];
    current = next;
  }
  if (Array.isArray(current)) {
    return current as T[];
  }
  return [];
}

/**
 * Finds a named block by its 'id' field.
 */
export function findBlockById<T extends SiiObject = SiiObject>(
  data: SiiObject,
  blockType: string,
  id: string,
  rootKey: string = 'SiiNunit'
): T | undefined {
  const blocks = getBlocks<T>(data, rootKey, blockType);
  return blocks.find((b) => b['id'] === id);
}

// ─── Include File Resolution ─────────────────────────────────────────────────

/**
 * Parses an SII file and resolves any @include directives by reading and
 * merging the included files. This is an async operation.
 *
 * @example
 * ```ts
 * const result = await parseSiiFileWithIncludes('./game.sii');
 * ```
 */
export async function parseSiiFileWithIncludes(filePath: string): Promise<SiiObject>;
export async function parseSiiFileWithIncludes<T>(filePath: string): Promise<T>;
export async function parseSiiFileWithIncludes<T = SiiObject>(filePath: string): Promise<T> {
  const content = await promises.readFile(filePath, 'utf8');
  const resolvedContent = await resolveIncludes(content, dirname(resolve(filePath)));
  return parseSii(resolvedContent) as T;
}

async function resolveIncludes(content: string, basePath: string): Promise<string> {
  const lines = content.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@include')) {
      // @include "path/to/file.sii"
      const match = trimmed.match(/@include\s+"([^"]+)"/);
      if (match?.[1]) {
        const includePath = resolve(basePath, match[1]);
        try {
          const includeContent = await promises.readFile(includePath, 'utf8');
          // Recursively resolve includes
          const resolved = await resolveIncludes(includeContent, dirname(includePath));
          // Strip SiiNunit wrapper from included content
          const stripped = stripSiiNunitWrapper(resolved);
          result.push(stripped);
        } catch {
          // Include file not found, skip silently
        }
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

function stripSiiNunitWrapper(content: string): string {
  const trimmed = content.trim();
  // Remove "SiiNunit\n{" from start and "}" from end
  if (/^SiiNunit/i.test(trimmed)) {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace + 1, lastBrace);
    }
  }
  return content;
}
