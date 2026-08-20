# Photo Ranker

Photo Ranker is a private, browser-based app for turning a small collection of photos into a preference ranking. Instead of asking you to sort every image at once, it presents two photos at a time [...]

An adaptive pairing system and Elo ratings turn those choices into a top-three podium and a complete ordered list. The experience is designed to be quick, playful, explainable, and local-first.

> **Privacy:** Photos are loaded into browser memory for the current session. The app does not upload them to the Node server or a cloud service.

For detailed requirements and acceptance criteria, see [PRD.md](./PRD.md).

## Why Photo Ranker?

Choosing the strongest photos from a similar set is difficult because comparing the whole collection at once creates choice overload. Pairwise ranking breaks the task into small decisions, then us[...]

Photo Ranker is useful for:

- selecting a profile or portfolio image;
- ordering campaign, product, travel, or event photos;
- narrowing a photoshoot into a shortlist;
- comparing visual concepts or creative treatments;
- identifying a top choice without manually dragging every image into order.

The result represents the user's preferences during that session. Elo is an organization tool, not an objective judgment of image quality.

## Current feature set

### Photo intake and management

- Load up to 20 browser-supported images at once.
- Add more photos until the session reaches the 20-photo limit.
- Preview uploaded photos with their filenames.
- Remove individual photos or clear the entire collection.
- Open a photo in a larger lightbox view.
- Automatically begin ranking as soon as two photos are available.

### Pairwise ranking

- Compare exactly two candidates at a time.
- Click or tap the preferred photo to register a vote.
- Skip a pair when there is no clear choice.
- Track each photo's Elo rating, wins, losses, and comparison count.
- Prioritize photos with fewer comparisons.
- Focus on similarly rated top contenders after coverage is balanced.
- Avoid showing the identical pair in consecutive rounds when another pairing exists.
- Prevent double-voting while the next round is loading.
- Undo the most recent vote, restoring ratings, counters, streak, round, and pair.
- Vote with left/right arrow keys, skip with `S`, and undo with `U` or `Cmd/Ctrl+Z`.
- Finish early and view the current ranking at any time.

### Confidence and progress

- Show the current round and consecutive-decision streak.
- Estimate comparison coverage with a confidence progress bar.
- Recommend `max(12, number of photos × 4)` rounds.
- Automatically reveal results after the recommended number of rounds.

The confidence percentage combines overall comparison coverage with coverage balance across the full collection. Repeatedly comparing only a few photos cannot produce a high score. Confidence does[...]

### Results

- Display first, second, and third place on a podium.
- Show the complete ranking in descending Elo order.
- Include Elo score and win/loss record for every photo.
- Assign shared ranks to photos within the current close-score threshold.
- Summarize rounds, confidence, and whether ties were detected.
- Open ranked photos in the lightbox for closer inspection.

### Pic Finder

The Pic Finder helps locate a browser-loaded image before, during, or after ranking without resetting the session.

- Search by full or partial filename.
- Search by visible position such as `#3`.
- Search by a rounded Elo value.
- See live match counts.
- Open any match in the lightbox.
- Reset the search independently of the ranking.

## Battle styles

Every battle style uses the same underlying vote and Elo semantics. Modes change presentation or pacing, not the value of a selection.

| Mode | Experience | Special interaction |
|---|---|---|
| **Head-to-Head** | Neutral default comparison | Click or tap a winner |
| **Speed Blitz** | Timed rapid decisions | Configurable 5–20 second timer; timeout skips |
| **Vibe Check** | Instinctive, gesture-friendly choice | Click, tap, or horizontal swipe |
| **Boxing Ring** | Competitive red-corner/blue-corner presentation | Ring-style feedback |
| **Slot Machine** | Short randomized reveal treatment | Spin animation before selection |
| **Runway** | Sequential visual entrance | Runway-style reveal animation |

## How to play

1. Select **Choose Files** and add 2–20 photos.
2. Choose a battle style. Head-to-Head is the simplest place to start.
3. When two photos appear, click or tap the one you prefer.
4. Continue choosing while the confidence bar rises.
5. Select **Skip Pair** if you cannot decide.
6. Use **Undo Last Vote** or press `U` if you make a mistake.
7. Select **Finish Ranking** at any time, or let the recommended session complete automatically.
8. Review the podium, shared ranks, and complete ranked list.

Use the left and right arrow keys to choose the matching side, `S` to skip, and `U` or `Cmd/Ctrl+Z` to undo. Double-click a battle image to inspect it at full size. In Vibe Check, a horizontal sw[...]

## How ranking works

### Elo ratings

Each photo starts with an Elo rating of `1200`. When the user selects a winner:

1. The app estimates the expected result from the two current ratings.
2. The winner gains rating points.
3. The other photo loses rating points.
4. Both comparison totals and the win/loss records update.

The current K-factor is `24`. An upset against a highly rated photo therefore moves the ratings more than an expected win against a lower-rated photo.

### Adaptive pair selection

The next pair is chosen to build useful evidence efficiently:

1. Favor photos with the fewest comparisons.
2. Favor photos whose win/loss records remain balanced.
3. Pair the selected photo with an opponent whose rating is nearby.
4. Add extra priority to close top contenders once coverage is balanced.
5. Exclude the immediately previous pair whenever another useful pair exists.

This is more useful than purely random pairing because it improves coverage while spending more comparisons on close contenders.

### Confidence

The app measures each photo's comparison coverage against the target implied by the recommended round count. It combines average coverage with the coverage of the least-compared photo. Confiden[...]

Current limitations:

- confidence measures coverage, not statistical certainty;
- early Elo scores can move substantially;
- contradictory preferences can produce unstable neighbors;
- shared ranks use a fixed close-score threshold and do not yet model statistical uncertainty.

These weaknesses are addressed in the roadmap below.

## Run locally

### Requirements

- Node.js 18 or newer recommended
- A current desktop or mobile browser

No third-party packages are required.

### Start the app

```bash
git clone https://github.com/xudaniel/photos-ranker-v202604.git
cd photos-ranker-v202604
npm start
```

Open [http://localhost:3000](http://localhost:3000).

To use a different port:

```bash
PORT=8080 npm start
```

## Architecture

Photo Ranker intentionally uses a small, framework-free architecture.

```text
photos-ranker-v202604/
├── PRD.md
├── README.md
├── package.json
├── public/
│   ├── app.js          Browser state, ranking, interactions, and effects
│   ├── index.html      Application structure and controls
│   ├── ranking.js      Testable Elo, pairing, confidence, and tie logic
│   └── styles.css      Visual system and responsive layout
├── src/
│   └── server.js       Minimal Node static-file server
└── test/
    └── ranking.test.js Ranking-engine unit tests
```

The server only serves files from `public/`. Upload selection, image decoding, ranking state, and results remain in the browser.

### Important constants

| Constant | Current value | Purpose |
|---|---:|---|
| `MAX_PHOTOS` | 20 | Maximum images in one session |
| `BASE_ELO` | 1200 | Initial rating for each photo |
| `ELO_K` | 24 | Rating responsiveness per vote |
| Recommended rounds | `max(12, photos × 4)` | Current completion target |

## Privacy and security model

- Images are opened through the browser's file picker and converted to in-memory data URLs.
- Image content is not included in requests to the local Node server.
- There are no accounts, remote storage, trackers, or analytics in the current app.
- Refreshing or closing the page clears the browser-memory session.
- User-controlled filenames are escaped before being inserted into rendered HTML.
- The server normalizes paths and limits responses to the public asset directory.

Before public deployment, the project should add a restrictive Content Security Policy, HTTPS, explicit privacy copy near upload, and automated checks confirming that image and filename data neve[...]

## Roadmap

The roadmap prioritizes reliability and trust before expanding the visual experience. Status and detailed acceptance criteria live in [PRD.md](./PRD.md).

### Milestone 1 — Ranking reliability and clarity *(in progress)*

**Goal:** Make the current session dependable and make its outputs easier to interpret.

- Validate every selected file and report unreadable or unsupported images individually.
- Correct visible orientation issues using available image metadata.
- ✅ Prevent the identical pair from appearing in consecutive rounds when alternatives exist.
- ✅ Add deterministic tests for Elo updates, adaptive pair selection, and confidence calculation.
- ⏳ Add upload-limit and invalid-file test coverage.
- ✅ Rename and explain the confidence metric as an estimate of ranking coverage.
- ✅ Distinguish strong coverage from a provisional, low-evidence order.
- Warn before clearing a session after comparisons have been recorded.
- Warn that refreshing or leaving the page will lose the current session.
- Add structured empty, loading, error, and completion states.

**Exit criteria:** Core ranking logic has automated coverage, invalid files cannot silently fail, and users understand what confidence does and does not mean.

### Milestone 2 — User control and accessibility *(in progress)*

**Goal:** Make the complete experience operable without a mouse and safer to correct.

- ✅ Add keyboard voting with left arrow, right arrow, and `S` to skip.
- ✅ Add **Undo last vote**, including reversal of Elo, counters, streak, round, and pair.
- ✅ Support `U` and `Cmd/Ctrl+Z` as undo shortcuts.
- Add a visible mute control and remember its local session preference.
- ✅ Respect `prefers-reduced-motion` for confetti, slot, runway, and winner animations.
- ✅ Add high-visibility focus states to controls and selectable photos.
- Announce round changes, errors, progress, and results to assistive technologies.
- Confirm color contrast and behavior at 200% browser zoom.
- Improve touch targets and one-handed mobile layouts.
- Add full-size lightbox navigation by keyboard and touch.

**Exit criteria:** A user can upload, rank, correct a vote, finish, and inspect results using keyboard controls alone; reduced-motion users receive no unnecessary animation.

### Milestone 3 — Results, exports, and tie-breaking

**Goal:** Turn a completed ranking into a reusable output.

- Export rank, filename, Elo, wins, losses, and comparison count as JSON.
- Export the same structured results as CSV.
- Exclude image data and local paths from structured exports.
- Add **Continue ranking** after results so users can resolve close contenders.
- Identify rating neighbors with insufficient evidence.
- Present ties or low-confidence rank groups explicitly.
- Offer targeted tie-break rounds between close candidates.
- Show a concise session summary: photo count, comparisons, skips, and confidence.
- Add a copyable text ranking.

**Exit criteria:** Rankings can leave the app in useful, privacy-preserving formats, and close results can be refined without restarting.

### Milestone 4 — Performance and local continuity

**Goal:** Support longer sessions without browser-memory or accidental-loss problems.

- Decode large sources into bounded display thumbnails.
- Release object URLs and in-memory image resources as soon as they are unused.
- Move expensive decode work away from the main interaction path where supported.
- Add explicit local-only session save and restore with IndexedDB.
- Make persistence opt-in and label exactly what remains on the device.
- Add a session manager for resuming or deleting locally saved rankings.
- Add drag-and-drop intake.
- Measure and enforce vote-to-next-pair latency targets.
- Evaluate whether the 20-photo limit can safely increase after memory optimization.

**Exit criteria:** Large-image sessions stay responsive, memory use remains bounded, and a user can intentionally resume work after closing the page.

### Milestone 5 — Ranking quality and evaluation

**Goal:** Improve convergence using evidence rather than intuition.

- Build simulated preference-order tests for ranking algorithms.
- Measure top-one, top-three, and full-order accuracy against longer reference sessions.
- Compare the current adaptive Elo approach with Swiss-style pairing, Bradley–Terry, and uncertainty-aware alternatives.
- Reduce repeated-pair rate while retaining important rematches.
- Detect contradictory voting patterns and lower confidence appropriately.
- Evaluate stopping rules for stable winner, stable podium, and stable full order.
- Make ranking parameters configurable in test fixtures rather than user-facing settings.
- Document algorithm changes and migration implications.

**Exit criteria:** The recommended stopping rule and pairing strategy have measurable accuracy targets and reproducible evaluation results.

### Milestone 6 — Optional creative and sharing tools

**Goal:** Expand the product after privacy, reliability, and accessibility are established.

- Generate an optional shareable results graphic from chosen thumbnails.
- Require an explicit action before any image-containing export.
- Add custom session titles and evaluation prompts such as "best profile photo" or "strongest campaign image."
- Add neutral tags or notes that stay local to the session.
- Offer a distraction-free professional mode with sound and effects disabled.
- Offer reusable, user-defined battle-style themes without changing vote semantics.
- Explore local comparison history visualization.

**Exit criteria:** Creative additions remain optional, do not weaken privacy, and do not alter ranking semantics without clear disclosure.

## Feature backlog

| Feature | Priority | Target | Status |
|---|---:|---:|---|
| Invalid-file reporting | P0 | 1 | Planned |
| Consecutive-pair prevention | P0 | 1 | Implemented |
| Ranking-engine tests | P0 | 1 | Implemented |
| Confidence explanation | P1 | 1 | Implemented |
| Balanced confidence calculation | P1 | 1 | Implemented |
| Close-score shared ranks | P1 | 1 | Implemented |
| Keyboard voting | P1 | 2 | Implemented |
| Undo last vote | P1 | 2 | Implemented |
| Reduced-motion support | P1 | 2 | Implemented |
| JSON and CSV export | P1 | 3 | Planned |
| Continue after results | P1 | 3 | Planned |
| Targeted tie-break rounds | P1 | 3 | Planned |
| Bounded thumbnails | P1 | 4 | Planned |
| Local session restore | P1 | 4 | Planned |
| Ranking evaluation harness | P1 | 5 | Planned |
| Shareable results graphic | P2 | 6 | Planned |

## Quality targets

- First useful interaction within one second after the app shell loads, excluding image decoding.
- Vote feedback visible within 100 ms on a mid-range device.
- Next pair interactive within 300 ms, excluding intentional presentation effects.
- Functional layouts from 320 px viewport width upward.
- Current Chrome, Safari, Firefox, and Edge support.
- WCAG 2.2 AA contrast and keyboard-operation targets.
- No photo, filename, local path, or search-query data transmitted without explicit user action.

## Known limitations

- Session state exists only in browser memory and disappears on refresh.
- Confidence reflects comparison coverage rather than statistical certainty.
- Results cannot yet be exported.
- Close-score ties use a fixed threshold rather than a statistical uncertainty model.
- Very large photos can consume substantial browser memory.
- Automated tests have not yet been added.

## Contributing

When changing ranking behavior:

1. Keep Head-to-Head semantics as the reference behavior.
2. Do not make visual modes silently weight votes differently.
3. Preserve the local-only privacy model.
4. Extract ranking logic into testable functions before increasing complexity.
5. Add or update acceptance criteria in [PRD.md](./PRD.md).
6. Test with small, tied, contradictory, and maximum-size photo sets.

## Product documents

- [Product Requirements Document](./PRD.md)
- [Application interface](./public/index.html)
- [Ranking and interaction logic](./public/app.js)
- [Static server](./src/server.js)

## License

Copyright © 2024 DANIEL XU

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
