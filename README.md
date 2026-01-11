# SII Parse TypeScript

TypeScript library for parsing Euro Truck Simulator 2 and American Truck Simulator `.sii` save files with complete type definitions.

## Installation

```bash
npm install sii-parse-ts
```

## Usage

```typescript
import { parseSii, parseSiiFile, ProfileSii, GameSii } from 'sii-parse-ts';

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

// Parse from file
const profile = await parseSiiFile<ProfileSii>('./profile.sii');
const gameSave = await parseSiiFile<GameSii>('./game.sii');
```

## API

### Functions

- `parseSii<T>(content: string)` - Parse SII content string
- `parseSiiFile<T>(path: string)` - Parse SII file (async)
- `parseSiiFileSync<T>(path: string)` - Parse SII file (sync)
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
