# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
