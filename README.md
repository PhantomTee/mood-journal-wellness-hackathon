# Mood Journal

A private, on-device mood journal built for the **CS Girlies Technology For Wellness Hackathon** — **Wellness track**.

Log how you're feeling, jot a quick note, and get a gentle AI-generated reflection — all running locally in your browser. No account, no server, no data leaving your device.

## Design

The visual identity is built around the **mood ring**: 1970s thermochromic jewelry that mapped color directly to feeling. Instead of generic emoji, moods are five named stones — Onyx, Smoky Quartz, Citrine, Emerald, Sapphire — each with its own hue and a one-word feeling, presented as a literal color legend (see `js/gems.js`). The centerpiece is a living CSS gemstone that shifts color as you choose your mood and settles with a soft pulse when you save — no images, pure layered gradients. The AI panel is named **Refraction**, since it's reading finer color out of what you wrote. Dark "jewelry case" background, brass metal accents, Fraunces/Jost/Space Mono type system.

## Features

- **Mood check-in** — 5-stone mood-ring scale + quick feeling tags (Anxious, Grateful, Tired, Stressed, etc.)
- **Journal entry** with a shuffled reflection prompt to help you get started
- **On-device AI insight** — a small emotion-classification model runs entirely in the browser (via [Transformers.js](https://github.com/xenova/transformers.js)) to label the entry's emotion and surface a supportive, pre-written note. If the model can't load (no internet, first-load still downloading), a lightweight keyword-based classifier steps in automatically so the feature never breaks.
- **14-day mood trend chart** (custom SVG, no chart library)
- **Streak tracker** for consecutive days journaled
- **Local history** with delete
- Everything persists in `localStorage` — nothing is sent to a server, ever

## Why on-device AI

Mood journals deal with sensitive personal data, and mood-support chatbots can be vulnerable to being steered toward harmful responses by negative input. This app avoids both problems:

- **Privacy** — the AI model (`Xenova/distilbert-base-uncased-emotion`, running via Transformers.js/WASM) downloads once and runs fully client-side. Journal text never leaves the browser.
- **Safety** — the model only ever outputs an emotion *label*, never free text. The actual message shown to the user always comes from a small set of curated, human-written care notes (see `js/prompts.js`), so there's no way for adversarial or distressing journal input to make the app generate something unsafe.
- **Free** — no API key, no account, no usage limits, no cost.

## Tech stack

- Vanilla HTML/CSS/JS (ES modules), no build step
- [`@xenova/transformers`](https://www.npmjs.com/package/@xenova/transformers) loaded from CDN for on-device inference
- `localStorage` for persistence

## Project structure

```
index.html          Page structure
css/style.css        Styling
js/storage.js         localStorage CRUD + streak calculation
js/chart.js            SVG mood trend chart
js/ai.js                On-device emotion classification (+ keyword fallback)
js/prompts.js          Reflection prompts + curated care-note templates
js/app.js               UI wiring / event handlers
```

## Running locally

No build step needed — just serve the folder over HTTP (ES modules require a server, not `file://`):

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Track

Submitting to the **Wellness** track. Optionally eligible for **Best Use of AI** — see `js/ai.js` for the on-device inference approach.
