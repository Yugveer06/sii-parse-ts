# Contributing to ETS2/ATS SII Types

Thank you for your interest in contributing! This library helps developers work with ETS2 and ATS save files, and community contributions are essential for keeping it comprehensive and up-to-date.

## How to Contribute

### 🐛 Bug Reports

- Use the GitHub issue tracker
- Include the problematic `.sii` file content (if possible)
- Describe expected vs actual behavior
- Include your TypeScript/Node.js version

### 💡 Feature Requests

- Check existing issues first
- Describe the use case and benefit
- Consider if it fits the library's scope

### 🔧 Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests if applicable
5. Ensure `npm run build` passes
6. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/ets2-ats-sii-types.git
cd ets2-ats-sii-types

# Install dependencies
npm install

# Build the project
npm run build
```

## Code Style

- Follow existing TypeScript conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose

## Adding New SII File Types

If you discover new SII file structures:

1. **Create Type Definitions**:

   - Add interfaces in appropriate files under `src/types/`
   - Use descriptive names matching SII field names
   - Include JSDoc comments for complex fields

2. **Update Parser** (if needed):

   - Most SII files should work with the existing parser
   - Only modify `siiService.ts` if new parsing logic is required

3. **Add Examples**:
   - Create example usage in the `examples/` directory
   - Update README with new use cases

## Testing

While we don't have automated tests yet, please:

- Test your changes with real SII files
- Verify TypeScript compilation: `npm run build`
- Check that examples still work

## Documentation

- Update README.md for new features
- Add entries to CHANGELOG.md
- Include code examples for new functionality

## SII File Structure Notes

For contributors working with SII files:

- **Profile files** (`profile.sii`): Player profile data, company info
- **Game saves** (`game.sii`): Complete game state, economy, vehicles
- **Controls** (`controls.sii`): Input configuration and key bindings
- **Info files** (`info.sii`): Save metadata and summary statistics

## Questions?

- Open a GitHub issue for questions
- Check existing issues and discussions
- Review the README and examples first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
