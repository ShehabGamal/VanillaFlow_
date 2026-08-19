# VanillaFlow_

A vanilla JavaScript todo list app — no frameworks, no libraries, just HTML, CSS, and the DOM.

## About

This started as a simple `localStorage` todo list and grew, feature by feature, into a small but complete productivity app. It was my first project of this kind, and I used it deliberately to practice patterns that come up constantly in real front-end/app development work — full CRUD, drag-and-drop, debounced search, theming, and UX details like undo.

I built this collaboratively with **Claude (Anthropic's Sonnet 5 model)**, which helped me implement trickier pieces — native drag-and-drop reordering, a debounced live search that plays nicely with an existing filter system, timezone-safe date handling, CSS custom-property theming — and explained the reasoning behind each pattern rather than just handing over code. It caught a couple of real bugs from my original version too (a duplicate-rendering bug and a classic date-timezone off-by-one). Genuinely useful way to learn while shipping something real.

## Features

- **Add, edit, delete tasks** — double-click a task or use the pencil icon to edit it in place
- **Mark complete** — toggled with color and strikethrough feedback
- **Drag-and-drop reordering** — native HTML5 Drag and Drop API, plus ▲ / ▼ buttons as a keyboard- and touch-accessible fallback
- **Categories with auto-generated colors** — no manual color picking; each category name is hashed into a consistent color
- **Spotlight filtering** — clicking a category dims non-matching tasks in place instead of hiding or reflowing the list
- **Live search** — debounced, highlights the matched text inline, and combines with the active category filter instead of overriding it
- **Due dates** — with overdue / due-today / upcoming badges, using timezone-safe date parsing
- **Animated progress bar** — "X of Y done," color-shifts from red to green as completion increases
- **Undo delete** — a toast with a 5-second countdown to restore a deleted task
- **Dark mode** — toggle persisted to `localStorage`, built entirely on CSS custom properties
- All state lives in `localStorage` — no backend, no build step

## Tech Stack

- HTML5
- CSS3 — custom properties for theming, flexbox layout, keyframe animations, no framework
- Vanilla JavaScript (ES6+) — no libraries, no bundler

## Getting Started

```bash
git clone <repo-url>
cd todo-app
```

Then just open `Index.html` in a browser — no server, no install, no build step.

## Project Structure

```
.
├── Index.html   # Markup
├── Style.css     # Styling, theming (CSS variables), animations
├── Main.js      # App logic: state, rendering, all interactions
└── README.md
```

## What I Practiced

- DOM manipulation without a framework — a full render cycle: read state → rebuild DOM → reattach listeners
- `localStorage` as a lightweight persistence layer
- The native HTML5 Drag and Drop API
- Debouncing user input
- Deterministic color generation from strings (hashing a name into a consistent HSL color)
- CSS custom properties for app-wide theming
- Timezone pitfalls in date parsing (`new Date("YYYY-MM-DD")` vs. local time)
- Progressive enhancement — pairing drag-and-drop with a button-based fallback for accessibility and mobile
- Basic HTML escaping when injecting user text via `innerHTML`

## Credits

Built by Shehab Gamal. Expanded and refined with the help of **Claude (Anthropic, Sonnet 5)**.

## License

MIT — feel free to fork and build on it.
