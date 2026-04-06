# Photo Ranker (Node-served static app)

This project runs a browser-based photo ranking app via a Node static server.

## Features preserved in the translated structure

- Multi-photo upload and preview flow (max 20 photos)
- Battle style selection:
  - Head-to-Head
  - Speed Blitz (timer)
  - Vibe Check (swipe-friendly)
  - Boxing Ring
  - Slot Machine
  - Runway
- Adaptive pairwise match selection
- Elo-based scoring updates after each pick
- Confidence meter based on comparison volume
- Results podium (top 3) and full ranking list
- Lightbox image preview
- Reactions/hooks: toasts, streaks, confetti, and lightweight audio beeps
- Mobile-responsive layouts for battle and list views

## Project structure

- `src/server.js` — Express static server
- `public/index.html` — UI structure and semantic sections
- `public/styles.css` — app styling and responsive behavior
- `public/app.js` — ranking logic, modes, timer, interactions

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Translation note

The requested source file path (`/Users/danielxu/Desktop/photo ranker v1.3.html`) was not available in this execution environment, so this implementation was built to preserve the specified product behaviors and mode set from the written requirements.
