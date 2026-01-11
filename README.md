# SII Parse TypeScript

TypeScript library for parsing Euro Truck Simulator 2 and American Truck Simulator `.sii` save files with complete type definitions and validation.

## Features

- 🔒 **Encrypted File Detection** - Automatically detects and rejects encrypted/binary SII files
- 🛡️ **Type Safety** - Complete TypeScript interfaces for all SII file formats
- ⚡ **Zero Dependencies** - Lightweight with no external dependencies
- 🧪 **Well Tested** - Comprehensive test suite with 93%+ coverage
- 📝 **Full Documentation** - Complete API documentation and examples
- 🔍 **Content Validation** - Validates SII file format before parsing

## Installation

```bash
npm install sii-parse-ts
```

## Quick Start

```typescript
import { parseSii, parseSiiFile, ProfileSii, GameSii, isValidSiiContent } from 'sii-parse-ts';

// Parse SII content directly with type safety
const siiContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "My Profile"
 company_name: "My Company"
}
}`;

// Validate content first (detects encrypted files)
if (isValidSiiContent(siiContent)) {
  const parsed = parseSii<ProfileSii>(siiContent);
  console.log(parsed.SiiNunit.user_profile[0].profile_name); // "My Profile"
}

// Parse from file with type safety
const profile = await parseSiiFile<ProfileSii>('./profile.sii');
console.log(profile.SiiNunit.user_profile[0].company_name);

// Parse game save
const gameSave = await parseSiiFile<GameSii>('./game.sii');
console.log(gameSave.SiiNunit.economy[0].bank);
```

## API

### Core Functions

- `parseSii<T>(content: string)` - Parse SII content string with optional type
- `parseSiiFile<T>(path: string)` - Parse SII file (async) with optional type
- `parseSiiFileSync<T>(path: string)` - Parse SII file (sync) with optional type
- `parseSiiFileAs<T>(path: string)` - Parse SII file with explicit type assertion

### Validation Functions

- `isValidSiiContent(content: string)` - Validate SII content format
- `isValidSiiPath(path: string)` - Validate SII file path and content

### Type Definitions

The library exports TypeScript interfaces for:

- `ProfileSii` - Player profile data
- `GameSii` - Game save state
- `ControlsSii` - Input configuration
- `InfoSii` - Save metadata

## Supported Formats

✅ **Plaintext SII files** (SIIN format) - Fully supported
❌ **Encrypted SII files** (SCSC format) - Detected and rejected with clear error
❌ **Binary SII files** (BSII format) - Detected and rejected with clear error

## Error Handling

The library provides clear error messages for common issues:

```typescript
try {
  const result = parseSii(encryptedContent);
} catch (error) {
  // "Invalid SII content: File may be encrypted, corrupted, or not a valid SII file"
}
```

## Examples

See the `examples/` directory for comprehensive usage examples:

- `basic-usage.js` - JavaScript examples with validation
- `typescript-usage.ts` - TypeScript examples with type safety
- Run examples: `npm run example` or `npm run example:ts`

## Use Cases

- **Save Game Managers** - Backup and organize profiles
- **Statistics Dashboards** - Track driving performance
- **Fleet Management** - Monitor truck fleets
- **Modding Tools** - Automated save file processing

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint
```

## License

MIT - see [LICENSE](LICENSE) file.
