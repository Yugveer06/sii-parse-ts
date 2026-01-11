# Examples

This directory contains usage examples for the SII Parse TypeScript library.

## Running Examples

### JavaScript Example

```bash
npm run example
```

### TypeScript Example

```bash
npm run example:ts
```

## Examples Included

### 1. `basic-usage.js`

- Basic SII content parsing
- Content validation
- File path validation
- Different value types (strings, numbers, booleans, arrays, vectors)

### 2. `typescript-usage.ts`

- Type-safe parsing with TypeScript interfaces
- Profile and game save parsing
- Error handling for encrypted/binary files
- Async file parsing patterns

## Key Features Demonstrated

- **Type Safety**: Using TypeScript interfaces for structured data
- **Validation**: Checking if content is valid plaintext SII format
- **Error Handling**: Proper handling of encrypted or corrupted files
- **Value Types**: Parsing different SII value formats
- **Async Operations**: File-based parsing with promises

## Common Use Cases

1. **Save Game Analysis**: Parse player profiles and game saves
2. **Modding Tools**: Extract and modify game data
3. **Statistics Tracking**: Monitor player progress and achievements
4. **Backup Management**: Validate and organize save files
