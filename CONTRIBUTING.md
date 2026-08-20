# Contributing

Thank you for helping improve Photo Ranker.

## Before opening a change

- Search existing issues and open a focused issue for substantial behavior changes.
- Do not commit personal photo libraries, exported rankings, local paths, or private filenames.
- Demo media must have documented provenance and redistribution rights.
- Keep ranking claims precise: Elo and coverage are decision aids, not objective image-quality judgments.

## Development

```bash
npm ci
npm test
npm start
```

A contribution should include tests for ranking or state-management changes and update the README or PRD when user-visible behavior changes.

## Pull requests

Keep pull requests small, explain the user problem, list validation performed, and disclose any privacy or accessibility impact.
