# Contributing

## Bug Reports

Use the GitHub issue tracker and include:

- Problematic SII file content (if possible)
- Expected vs actual behavior
- TypeScript/Node.js version

## Feature Requests

- Check existing issues first
- Describe the use case and benefit
- Consider if it fits the library scope

## Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure `npm run build` and `npm test` pass
6. Submit a pull request

## Development Setup

```bash
git clone https://github.com/your-username/sii-parse-ts.git
cd sii-parse-ts
npm install
npm run build
npm test
```

## Code Style

- Follow existing TypeScript conventions
- Use meaningful names
- Add JSDoc comments for public APIs
- Keep functions focused

## Adding New SII Types

1. Add interfaces in `src/types/`
2. Update parser only if new parsing logic is needed
3. Add examples and update documentation

## Testing

- Add tests for new functionality
- Test with real SII files
- Verify TypeScript compilation

## License

Contributions are licensed under MIT.
