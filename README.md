# Abhishek Mishra — Portfolio

A hand-built portfolio site: zero dependencies, zero build step. Ships as three files,
runs the same on a static host as it does off `file://`.

## What's inside

- **Live GitHub integration** — repositories, languages and stats pulled from the
  public GitHub API with stale-while-revalidate caching (15 min TTL) so repeat
  visits paint instantly.
- **Aurora aesthetic** — animated gradient blobs, a canvas constellation that
  reacts to the cursor, and a scanning code card that types itself out.
- **Motion, done carefully** — magnetic buttons, tilt cards, gradient scroll
  progress, and a fully honoured `prefers-reduced-motion` fallback.
- **Custom smooth scroll** — RAF-driven, easing curve, cancels the moment the
  user touches the wheel or a key.
- **Dark + light theme** — persisted in `localStorage`.

## Stack

Vanilla HTML, CSS and JavaScript. Nothing else.

## Local preview

Open `index.html` directly in a browser — that's it. For a proper local server:

```bash
python -m http.server 5173
# then visit http://localhost:5173
```

## Deploy

The site is hosted on GitHub Pages from the `main` branch. Any push to `main`
publishes automatically.

## Contact

- Email: [abhishekmishra08195@gmail.com](mailto:abhishekmishra08195@gmail.com)
- GitHub: [@Abhimishra68](https://github.com/Abhimishra68)
- LinkedIn: [abhishek-mishra-48a8bb2a7](https://www.linkedin.com/in/abhishek-mishra-48a8bb2a7/)
