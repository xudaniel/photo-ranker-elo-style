# Photo Ranker Release Notes

## v1.1.0 — Decision Stage (2026-08-06)

This release transforms Photo Ranker into a focused, full-screen decision experience. The ranking engine remains familiar, but the surrounding interface is faster to understand, easier to navigate, and better suited to repeated photo comparisons.

### Highlights

- Introduced the new **Decision Stage**: two large photos share the screen so each choice stays visually focused.
- Added a slide-out collection drawer for uploading, searching, removing, and reviewing photos without leaving the ranking session.
- Added a vertical desktop photo rail that becomes a horizontal rail on mobile.
- Added a six-photo demo collection so the complete ranking flow can be explored immediately.
- Reworked the results experience with a podium, complete ranking list, session summary, and clear Continue and Done actions.
- Added compact round and confidence indicators that always reflect the current ranking state.

### Interaction improvements

- Added a persistent action dock for **Undo**, **Skip**, and **Finish**.
- Preserved keyboard controls: arrow keys choose a photo, `S` skips, `U` undoes, and `Escape` closes the active overlay or drawer.
- Added collection search by filename, position, or Elo rating.
- Made the demo opening pair deterministic so demos and visual checks are repeatable.
- Improved empty, provisional, active-ranking, and completed-ranking states.

### Design and accessibility

- Added locally served Inter Variable typography and Phosphor icons.
- Introduced a dark editorial interface with clearer hierarchy and stronger photo emphasis.
- Added visible keyboard focus states, semantic progress information, accessible control names, and reduced-motion support.
- Added a dedicated mobile layout that keeps both choices and the primary controls reachable within the viewport.

### Technical changes

- Added local server support for font and icon assets.
- Added optimized bundled demo portraits.
- Added a package lockfile for reproducible dependency installation.
- Added a documented visual QA record in [`design-qa.md`](design-qa.md).

### Validation

- All seven automated ranking tests pass.
- JavaScript syntax checks pass for the application, ranking engine, and server.
- Desktop and mobile interaction checks pass with no browser console errors or warnings.

### Known limitations

- Photos and ranking progress remain local to the current browser session and are not synchronized between devices.
- Uploaded photos are not restored after the page is reloaded.
- The app does not yet support exporting or importing a ranking session.
