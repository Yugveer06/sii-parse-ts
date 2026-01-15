# SII Parse TypeScript

TypeScript library for parsing Euro Truck Simulator 2 and American Truck Simulator `.sii` save files with complete type definitions.

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

## API

### Core Functions

- `parseSii<T>(content: string)` - Parse SII content string
- `parseSiiFile<T>(path: string)` - Parse SII file (async)
- `parseSiiFileSync<T>(path: string)` - Parse SII file (sync)

### Performance-Optimized Functions

- `parseSiiFileStreaming<T>(path: string)` - Parse large SII files (>10MB) with streaming for reduced memory usage
- `parseSiiFileAuto<T>(path: string)` - Automatically choose optimal parsing method based on file size
- `parseSiiChunked<T>(content: string, options?)` - Parse with chunked processing (future-ready API)

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
