# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-12

### Added

- **`stringifySii()` serializer** — serialize parsed SII objects back to valid SII text format with configurable indentation and line endings
- **Query helpers** — `getBlock()`, `getBlocks()`, and `findBlockById()` for navigating parsed SII structures
- **`@include` directive support** — `parseSiiFileWithIncludes()` resolves include directives recursively
- **`StringifyOptions` interface** for controlling serialization output format

### Changed

- **Eliminated `Buffer` dependency from parser** — IEEE 754 hex float decoding now uses `DataView`/`Uint8Array` instead of `Buffer.from().readFloatBE()`, reducing memory allocations
- **Replaced regex with manual char-level parsers** for the three hot-path patterns (key-value lines, named blocks, standalone identifiers), significantly reducing regex overhead in the parse loop
- **Improved streaming parser** — now reads directly as UTF-8 strings instead of buffering `Buffer` objects and concatenating them
- **Optimized `isValidSiiContent()`** — fast path for `SiiNunit` detection using `indexOf()` before falling back to regex
- **Expanded test suite** — from 18 tests to 39 tests covering serialization round-trips, query helpers, edge cases (nested tuples, IEEE 754 floats, pre-allocated arrays, comments, dotted keys, and more)

## [1.1.0] - 2026-01-16

### Added

- New `parseSiiFileStreaming()` function for parsing large SII files with reduced memory usage
- New `parseSiiFileAuto()` function that automatically selects optimal parsing method based on file size
- New `parseSiiChunked()` function for chunked processing support
- Significantly improved parsing performance with optimized character-level processing
- More efficient content validation with faster format detection

### Changed

- Rewritten parser core with character-level optimizations for better performance
- Reduced memory allocations during parsing operations
- Optimized regex usage with pre-compiled patterns

## [1.0.0] - 2026-01-09

### Added

- Initial release of ETS2/ATS SII Types library
- Complete TypeScript type definitions for:
  - Profile files (`profile.sii`)
  - Game save files (`game.sii`)
  - Controls configuration (`controls.sii`)
  - Save info metadata (`info.sii`)
- SII file parser with support for:
  - Synchronous and asynchronous parsing
  - Proper error handling for malformed files
  - Support for all SII value types (strings, numbers, booleans, arrays, objects)
  - Hex number parsing (`0x` prefix)
  - IEEE 754 float parsing (`&` prefix)
  - Vector/quaternion parsing (parenthesized values)
- File validation utilities
- Comprehensive documentation and examples
- Zero external dependencies
- Node.js compatibility
- Strict TypeScript configuration with comprehensive type checking
- ESLint configuration with type-aware rules

### Removed

- WASM-based decryption support (library now focuses only on plaintext SII files)
- Binary file format support (SCSC, BSII)
- Browser compatibility (Node.js focused)

### Changed

- Library now exclusively handles plaintext SII files (SIIN format)
- Simplified API focused on parsing and typing
- Enhanced type safety with stricter TypeScript and ESLint rules
