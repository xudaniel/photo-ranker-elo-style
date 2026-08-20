# Photo Ranker — Product Requirements Document

**Product:** Photo Ranker  
**Repository:** `photo-ranker-elo-style`
**Document status:** Draft 1.0  
**Last updated:** 2026-08-06  
**Owner:** Product / Engineering

## 1. Product summary

Photo Ranker is a private, browser-based tool that helps a person order a small collection of photos by repeatedly choosing between two images. It converts simple pairwise choices into an Elo-based ranking, then presents a podium and a complete ordered list.

The experience should feel fast, playful, and low-pressure while producing a ranking the user can understand and trust. Photos remain in the browser for the session and are not uploaded to a server.

## 2. Problem

Choosing the best images from a collection is mentally expensive. Looking at every photo at once creates choice overload, while manually dragging images into order requires the user to understand the whole ranking before making any decision.

Pairwise comparison reduces the decision to one question: **Which of these two photos do I prefer?** The product uses those answers to build an increasingly confident ranking.

## 3. Goals

### Primary goals

1. Let a user begin ranking within 30 seconds of opening the app.
2. Make each comparison understandable and completable with one action.
3. Produce a useful ordered list without requiring every possible pair to be compared.
4. Clearly communicate how reliable the current ranking is.
5. Keep uploaded photos private and local to the browser.

### Secondary goals

- Make repeated decisions enjoyable through distinct visual battle styles.
- Help users find and inspect an uploaded photo during a session.
- Work well on both desktop and mobile browsers.
- Allow a user to finish early without losing the ranking already produced.

### Non-goals for the current release

- Automated aesthetic or identity scoring.
- Cloud photo storage, accounts, or multi-user collaboration.
- Public galleries or social voting.
- Image editing, filters, or retouching.
- Ranking more than 20 photos in one session.
- Claiming that Elo score is an objective measure of image quality.

## 4. Target users and jobs

### Primary user

A creator, photographer, model, marketer, or everyday user who has 2–20 similar photos and wants to identify the strongest ones quickly.

### Core jobs to be done

- “Help me pick the best photo from a group.”
- “Help me create a complete preference order without manually sorting everything.”
- “Let me compare close contenders until I feel confident.”
- “Let me inspect a specific photo without interrupting the ranking session.”

## 5. Product principles

1. **One decision at a time:** keep each round focused on two photos.
2. **User judgment is authoritative:** the app organizes choices; it does not tell the user what is attractive or correct.
3. **Confidence must be honest:** progress represents comparison coverage, not scientific certainty.
4. **Private by default:** image data stays on the user’s device unless a future upload feature is explicitly chosen.
5. **Playfulness supports speed:** animation and themes should reward decisions without obscuring the photos.
6. **Results remain explainable:** show rank, score, wins, and losses in plain language.

## 6. Core user flow

1. The user opens Photo Ranker.
2. The user selects 2–20 local image files.
3. The app displays previews and starts a Head-to-Head session once two photos are available.
4. The user optionally chooses a different battle style.
5. Each round presents two photos.
6. The user chooses a preferred photo or skips the pair.
7. The app updates ratings, win/loss totals, round count, streak, and confidence.
8. The app selects another informative pair.
9. The session finishes automatically at the recommended comparison count, or the user finishes early.
10. The app displays the top three photos and the complete ranking.

## 7. Functional requirements

Status labels:

- **Current:** implemented in the existing app.
- **Required:** expected for the next product-ready release.
- **Later:** valuable follow-up work, outside the next release.

### 7.1 Photo intake and management

| ID | Requirement | Priority | Status |
|---|---|---:|---|
| UP-01 | Accept common browser-supported image formats through a multi-file picker. | P0 | Current |
| UP-02 | Require at least two photos before a ranking can proceed. | P0 | Current |
| UP-03 | Limit a session to 20 photos and explain when excess files are ignored. | P0 | Current |
| UP-04 | Show filename previews and the current photo count. | P0 | Current |
| UP-05 | Allow one photo or the full set to be removed. | P0 | Current |
| UP-06 | Reject unreadable or non-image files with a clear per-file message. | P0 | Required |
| UP-07 | Correct image orientation using available metadata and avoid visible distortion. | P1 | Required |
| UP-08 | Warn before clearing a session that contains completed comparisons. | P1 | Required |
| UP-09 | Support drag-and-drop upload. | P2 | Later |

### 7.2 Finding and inspecting photos

| ID | Requirement | Priority | Status |
|---|---|---:|---|
| FN-01 | Search browser-loaded photos by filename, position, or rounded Elo score. | P1 | Current |
| FN-02 | Show live match counts and an explicit empty state. | P1 | Current |
| FN-03 | Open preview, finder, battle, and result images in a lightbox. | P1 | Current |
| FN-04 | Preserve the current session when the finder is used. | P0 | Current |
| FN-05 | Add keyboard and touch controls for moving between full-size photos. | P2 | Later |

### 7.3 Battle and voting

| ID | Requirement | Priority | Status |
|---|---|---:|---|
| BT-01 | Present exactly two candidates per standard round. | P0 | Current |
| BT-02 | Register a winner with one click or tap and immediately update both ratings. | P0 | Current |
| BT-03 | Prevent duplicate votes while a round transition is in progress. | P0 | Current |
| BT-04 | Allow the user to skip a pair without changing either rating. | P0 | Current |
| BT-05 | Prefer under-compared photos and similarly rated opponents when selecting pairs. | P0 | Current |
| BT-06 | Avoid presenting the identical pair in consecutive rounds when another useful pair exists. | P1 | Current |
| BT-07 | Support keyboard voting: left arrow, right arrow, and `S` to skip. | P1 | Current |
| BT-08 | Give the user an undo action for the most recent vote. | P1 | Current |
| BT-09 | Let the user finish at any time after at least one valid comparison. | P0 | Current |

### 7.4 Battle styles

| Mode | Required behavior | Status |
|---|---|---|
| Head-to-Head | Default, untimed two-photo comparison. | Current |
| Speed Blitz | User-configurable 5–20 second timer; timeout skips the pair. | Current |
| Vibe Check | Supports tap and horizontal swipe selection. | Current |
| Boxing Ring | Uses competitive ring presentation without changing scoring. | Current |
| Slot Machine | Uses a short reveal animation before voting. | Current |
| Runway | Uses a sequential entrance treatment without changing scoring. | Current |

All modes must produce equivalent ranking semantics. Visual modes may alter pacing and interaction, but they must not secretly alter the value of a vote.

### 7.5 Ranking and confidence

| ID | Requirement | Priority | Status |
|---|---|---:|---|
| RK-01 | Initialize every photo at an Elo score of 1200. | P0 | Current |
| RK-02 | Update ratings with a K-factor of 24 after each valid vote. | P0 | Current |
| RK-03 | Track wins, losses, and number of comparisons per photo. | P0 | Current |
| RK-04 | Recommend at least `max(12, photo count × 4)` rounds. | P0 | Current |
| RK-05 | Display a confidence/progress percentage based on completed comparison coverage. | P0 | Current |
| RK-06 | Label the metric as “ranking confidence” and explain that it is an estimate. | P1 | Current |
| RK-07 | Reduce or flag ties when photos have insufficient or indistinguishable evidence. | P1 | Current |
| RK-08 | Run deterministic unit tests for rating updates, pair selection, and progress calculation. | P0 | Current |

### 7.6 Results

| ID | Requirement | Priority | Status |
|---|---|---:|---|
| RS-01 | Show a first-, second-, and third-place podium. | P0 | Current |
| RS-02 | Show every photo in descending Elo order. | P0 | Current |
| RS-03 | Display score, wins, and losses for every result. | P1 | Current |
| RS-04 | Allow result images to be enlarged. | P1 | Current |
| RS-05 | Export the ranking as JSON and CSV without uploading images. | P1 | Required |
| RS-06 | Export a shareable results image containing thumbnails and ranks only after user action. | P2 | Later |
| RS-07 | Allow a finished session to resume for additional tie-break comparisons. | P1 | Required |

### 7.7 Session continuity

| ID | Requirement | Priority | Status |
|---|---|---:|---|
| SS-01 | Keep session state in memory while the page remains open. | P0 | Current |
| SS-02 | Clearly warn that refreshing currently clears the session. | P0 | Required |
| SS-03 | Offer explicit local-only session save and restore using IndexedDB. | P1 | Later |
| SS-04 | Never persist photos or rankings remotely without explicit user consent. | P0 | Required |

## 8. Ranking model

### Current algorithm

- Every photo begins at 1200 Elo.
- Each selection is treated as a win for one photo and a loss for the other.
- Ratings update with a K-factor of 24.
- Pair selection first favors photos with fewer comparisons, then balanced records, then ratings closest to the initial score.
- A session recommends four rounds per photo, with a minimum of 12 rounds.

### Interpretation

The result is a model of the user’s expressed preferences during that session. It is not a universal quality score. Rankings with low comparison coverage must be presented as provisional.

### Future evaluation

Before changing the ranking model, test alternatives against simulated preference orders and structured user sessions. Evaluate:

- top-three accuracy;
- full-order correlation with a longer reference session;
- repeated-pair rate;
- comparisons required to reach a stable top choice;
- sensitivity to contradictory votes.

## 9. UX and accessibility requirements

- All core actions must work with mouse, touch, and keyboard.
- Interactive elements must have visible focus states and accessible names.
- Photo selection cannot rely on color alone.
- Results must remain readable at 200% zoom.
- The interface must support viewport widths from 320 px upward.
- Motion must respect `prefers-reduced-motion`.
- Sound must default to a safe level and have a visible mute control.
- Every uploaded image must use its filename as fallback alternative text.
- Error, empty, progress, and completion states must be announced appropriately to assistive technology.
- Text and controls should meet WCAG 2.2 AA contrast targets.

## 10. Privacy and security

1. Photos are read locally using browser APIs and are not sent to the Node server.
2. The UI must state “Your photos stay in this browser session” near upload.
3. Analytics, if added, may capture aggregate events such as session start, photo count bucket, comparison count, mode, export action, and completion. It must not capture images, filenames, file paths, search queries, or generated image data.
4. Object URLs or in-memory image data must be released when photos are removed or the session is cleared.
5. User-controlled filenames must always be escaped before insertion into HTML.
6. The static server must prevent directory traversal and serve only files from `public/`.
7. A deployed version must use HTTPS and a restrictive Content Security Policy.

## 11. Performance requirements

- Initial app shell should load in under 1 second on a typical broadband connection, excluding user images.
- A vote should show feedback within 100 ms on a mid-range device.
- The next pair should be interactive within 300 ms, excluding intentionally configured animation.
- Twenty reasonably sized photos should not freeze the UI during intake.
- Large source images should be decoded into bounded display thumbnails to control memory use.
- The app should remain responsive for a complete recommended session on current Chrome, Safari, Firefox, and Edge releases.

## 12. Success metrics

### North-star metric

**Completed ranking sessions:** sessions with at least two photos, at least one vote, and a viewed results list.

### Supporting metrics

- Upload-to-first-vote conversion.
- Median time from upload completion to first vote.
- Ranking completion rate.
- Median comparisons per photo.
- Percentage of sessions reaching 80% ranking confidence.
- Early-finish rate.
- Skip rate and repeated-pair rate.
- Export rate once export is available.
- Error-free session rate.

### Guardrail metrics

- Client error rate.
- Median and p95 vote-to-next-pair latency.
- Sessions abandoned after an unreadable-file or memory error.
- Accessibility defects in automated and manual testing.
- Any evidence that photo or filename data leaves the browser unexpectedly.

## 13. Acceptance criteria for the next release

The next release is product-ready when:

1. A user can upload 2–20 valid photos and receive clear feedback for invalid files.
2. The user can complete the full ranking loop using only keyboard controls.
3. Consecutive duplicate pairs are avoided when at least three eligible photos exist.
4. Undo correctly reverses the most recent vote’s ratings and counters.
5. Confidence is labeled and explained as an estimate.
6. The result can be exported to valid JSON and CSV without including image data.
7. A user can resume comparisons after viewing results.
8. Reduced-motion mode disables nonessential animations.
9. Automated tests cover Elo updates, pair selection, confidence, upload limits, and export formatting.
10. Manual verification passes on a desktop and mobile-sized viewport with no photo data transmitted over the network.

## 14. Delivery plan

### Milestone 1 — Reliability and clarity

- Invalid-file handling.
- Consecutive-pair prevention.
- Ranking-confidence explanation.
- Refresh/session-loss warning.
- Unit tests for ranking logic.

### Milestone 2 — Control and accessibility

- Keyboard voting.
- Undo last vote.
- Reduced-motion support.
- Sound control.
- Accessibility audit and fixes.

### Milestone 3 — Useful output

- JSON and CSV export.
- Resume after results.
- Better tie and low-evidence presentation.

### Milestone 4 — Optional continuity

- Explicit local session save/restore.
- Drag-and-drop intake.
- Shareable results graphic.

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Users interpret confidence as objective certainty. | Loss of trust. | Explain the metric and call low-coverage rankings provisional. |
| Early Elo volatility produces unstable results. | Poor top choices. | Balance comparison coverage and prioritize close contenders. |
| Large images exhaust browser memory. | Crashes or frozen UI. | Generate bounded thumbnails and release unused image resources. |
| Visual effects distract from comparison. | Slower or biased voting. | Keep Head-to-Head neutral and provide reduced-motion controls. |
| Accidental refresh destroys work. | Session loss. | Warn before unload; later add explicit local save/restore. |
| Filename rendering introduces HTML injection. | Security issue. | Escape all user-controlled strings and enforce CSP in deployment. |

## 16. Open questions

1. Should the default stopping point optimize for a stable winner, a stable top three, or the full ordering?
2. Should skipped pairs be deprioritized permanently or allowed to return after other comparisons?
3. Should ties be displayed as shared ranks or as low-confidence neighboring positions?
4. Is 20 the right maximum after thumbnail memory optimization?
5. Should battle styles remain purely visual, or should some modes intentionally use different session lengths?
6. Which export fields are useful beyond rank, filename, Elo, wins, losses, and comparisons?

## 17. Current technical shape

- `src/server.js` — minimal Node static-file server.
- `public/index.html` — application structure.
- `public/styles.css` — visual system and responsive layout.
- `public/app.js` — browser state, upload handling, pair selection, Elo updates, modes, results, and effects.

The current framework-free architecture is appropriate for the product’s size. Ranking logic should be extracted into testable modules before adding persistence or materially expanding the feature set.
