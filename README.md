# SII Parse TypeScript

TypeScript library for parsing and serializing Euro Truck Simulator 2 and American Truck Simulator `.sii` save files with complete type definitions.

## Installation

```bash
npm install sii-parse-ts
```

## Usage

```typescript
import {
  parseSii,
  parseSiiFile,
  parseSiiFileAuto,
  parseSiiFileStreaming,
  stringifySii,
  getBlock,
  getBlocks,
  findBlockById,
  ProfileSii,
  GameSii,
} from 'sii-parse-ts';

// Parse SII content string
const siiContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "My Profile"
 company_name: "My Company"
}
}`;

const parsed = parseSii<ProfileSii>(siiContent);
console.log(parsed.SiiNunit.user_profile[0].profile_name);

// Parse from file (standard)
const profile = await parseSiiFile<ProfileSii>('./profile.sii');

// Parse with automatic optimization (recommended for unknown file sizes)
const gameSave = await parseSiiFileAuto<GameSii>('./game.sii');

// Parse large files with streaming (>10MB files)
const largeSave = await parseSiiFileStreaming<GameSii>('./large-save.sii');
```

## Performance Features

### Zero-Regex Hot Paths

The parser uses hand-written character-level scanners for all hot-path operations (key-value parsing, block detection, identifier matching), eliminating regex overhead in the main parse loop. Only rarely-used patterns (hex integer detection, tuple matching) use pre-compiled regex.

### Buffer-Free Float Decoding

IEEE 754 hex float values (`&XXXXXXXX`) are decoded using `DataView` instead of Node.js `Buffer`, reducing memory allocations and improving performance.

### Automatic Optimization

The library automatically chooses the best parsing method:

```typescript
// Automatically uses streaming for files >10MB, standard parsing otherwise
const result = await parseSiiFileAuto('./unknown-size-file.sii');
```

### Large File Support

For very large SII files, use streaming to reduce memory usage:

```typescript
// Recommended for files >10MB
const result = await parseSiiFileStreaming('./large-save-file.sii');
```

## Serialization (Write Back)

Convert parsed SII objects back to valid SII text format:

```typescript
import { parseSii, stringifySii, GameSii } from 'sii-parse-ts';

const parsed = parseSii<GameSii>(content);

// ... modify the parsed data ...

// Serialize back to SII format
const output = stringifySii(parsed);

// With custom options
const formatted = stringifySii(parsed, {
  indent: '  ', // Two-space indent
  lineEnding: '\r\n', // Windows line endings
});
```

## Query Helpers

Navigate parsed SII data with type-safe helper functions:

```typescript
import { parseSii, getBlock, getBlocks, findBlockById, GameSii } from 'sii-parse-ts';

const data = parseSii(content);

// Get the first block of a type
const economy = getBlock(data, 'SiiNunit', 'economy');

// Get all blocks of a type
const vehicles = getBlocks(data, 'SiiNunit', 'vehicle');

// Find a specific block by its ID
const truck = findBlockById(data, 'vehicle', 'truck.my_truck');
```

## Include File Resolution

For SII files that use `@include` directives:

```typescript
import { parseSiiFileWithIncludes } from 'sii-parse-ts';

// Automatically resolves @include "path/to/other.sii" directives
const result = await parseSiiFileWithIncludes('./game.sii');
```

## API

### Core Functions

- `parseSii<T>(content: string)` - Parse SII content string
- `parseSiiFile<T>(path: string)` - Parse SII file (async)
- `parseSiiFileSync<T>(path: string)` - Parse SII file (sync)

### Performance-Optimized Functions

- `parseSiiFileStreaming<T>(path: string)` - Parse large SII files (>10MB) with streaming for reduced memory usage
- `parseSiiFileAuto<T>(path: string)` - Automatically choose optimal parsing method based on file size
- `parseSiiChunked<T>(content: string, options?)` - Parse with chunked processing

### Serialization

- `stringifySii(data, options?)` - Serialize parsed SII object back to SII text format

### Query Helpers

- `getBlock<T>(data, ...path)` - Get the first block at a path
- `getBlocks<T>(data, ...path)` - Get all blocks at a path
- `findBlockById<T>(data, blockType, id)` - Find a specific block by its ID

### Include Resolution

- `parseSiiFileWithIncludes<T>(path: string)` - Parse SII file resolving `@include` directives

### Type-Safe Helpers

- `parseSiiAs<T>(content: string)` - Parse SII content with type assertion
- `parseSiiFileAs<T>(path: string)` - Parse SII file with type assertion (async)
- `parseSiiFileSyncAs<T>(path: string)` - Parse SII file with type assertion (sync)

### Validation Functions

- `isValidSiiContent(content: string)` - Validate SII content format
- `isValidSiiPath(path: string)` - Validate SII file path

### Types

- `ProfileSii` - Player profile data
- `GameSii` - Game save state
- `ControlsSii` - Input configuration
- `InfoSii` - Save metadata
- `SiiObject` - Generic parsed SII object
- `SiiValue` - Union of all possible SII values
- `SiiPrimitive` - Primitive SII values (string | number | boolean | null)
- `StringifyOptions` - Options for `stringifySii()`

## Supported Formats

Only plaintext SII files (SIIN format) are supported. Encrypted (SCSC) and binary (BSII) formats will throw an error with a clear message.

## Error Handling

```typescript
import { isValidSiiContent, parseSii } from 'sii-parse-ts';

if (isValidSiiContent(content)) {
  const result = parseSii(content);
} else {
  console.log('Invalid or encrypted SII file');
}
```

## Examples

See the `examples/` directory for complete usage examples:

```bash
npm run example      # JavaScript examples
npm run example:ts   # TypeScript examples
```

## License

MIT
