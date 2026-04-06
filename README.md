# Photo Ranker (Node-served static app)

This project serves a vanilla HTML/CSS/JS photo ranking app from a Node HTTP server.

## Run locally

```bash
npm start
```

Open <http://localhost:3000>.

## Structure

- `src/server.js`: static file server for `public/`
- `public/index.html`: app structure
- `public/styles.css`: app styling and responsive layout
- `public/app.js`: upload, battle modes, Elo ranking, confidence meter, podium, lightbox, reactions/toasts/confetti/audio hooks

## Product behavior preserved in translation

- Upload + preview flow with max 20 photos
- Mode selector with:
  - Head-to-head
  - Speed blitz (timer)
  - Vibe check
  - Boxing ring
  - Slot machine
  - Runway
- Adaptive pair selection for pairwise ranking
- Elo-based updates per battle
- Confidence progress meter
- Results podium + full ranking list
- Lightbox on image interaction
- Reactions, streaks, toast feedback, confetti, and browser-audio hook

## Notes

The translation is intentionally framework-free and optimized for maintainability by splitting markup, styles, and logic into separate files.
