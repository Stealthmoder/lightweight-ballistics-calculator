# Contributing

Thank you for your interest in the project!


## Before opening a PR

Run the custom validation scripts below.

Required (matches CI: lint + tests + production build):

```bash
npm run verify
```

Recommended before opening a PR (includes audit):

```bash
npm run verify:all
```

Additional audit commands:

```bash
npm run audit:check
```

Production dependencies only:

```bash
npm run audit:prod
```

Everything above plus audit:

```bash
npm run verify:all
```

## Guidelines

- Keep changes focused and minimal.
- Preserve existing behavior unless the PR clearly documents a change.
- Add tests for non-trivial logic changes.
- Update docs (`README.md`) when behavior or setup changes.
- Do not commit generated artifacts (for example `.next/` output).