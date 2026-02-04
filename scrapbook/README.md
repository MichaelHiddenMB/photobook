# Scrapbook App (Vite + React + TypeScript)

This project is a “scrapbook” single‑page app that lets users drop in photos and jot quick notes. Everything runs purely in the browser (no backend), making it a good learning demo for local file handling and state management.

## What you’ll build
- Upload an image (using the native file picker) and preview it instantly via a base64 data URL.
- Add a title, note, mood tag, and date; then store that page in local state.
- View pages in a masonry-like grid with tape/paper styling; delete any page inline.
- See small stats (page count, unique moods) computed from state with `useMemo`.

## Tech decisions
- **Vite + React + TS** for fast dev and type safety.
- **Client-only storage**: images and text live in React state (memory). Easy to extend to `localStorage` later.
- **Data URLs**: `FileReader.readAsDataURL` converts the image to base64; perfect for quick prototypes without uploads.
- **No external UI libs**: All styling in `App.css` and `index.css` to see the raw building blocks.

## File tour
- `src/main.tsx` – Vite/React entry that renders `<App />`.
- `src/App.tsx` – The entire scrapbook UI and logic (form, preview, cards, delete, stats).
- `src/App.css` – Component-level styling: scrapbook look, cards, buttons, responsive layout.
- `src/index.css` – Global styles: fonts, background gradients, reset-ish tweaks.

## How the upload/preview works
1) User selects a file from the OS picker.
2) In `handleFileChange`, we create a `FileReader` and call `readAsDataURL(file)`.
3) The `onload` handler gets `reader.result` (a base64 data URL) and stores it + filename in form state.
4) We also set a `preview` URL for immediate display before saving the page.

## Form submission flow
- `handleSubmit` prevents default, validates that an image exists, then builds an `Entry` object.
- `crypto.randomUUID()` (or a timestamp fallback) generates a unique id.
- The new entry is prepended to `entries` state so the latest is first.
- Form resets to defaults; preview clears.

## Deleting a page
`removeEntry` filters the `entries` array by id and updates state. Because everything is local, no network calls are needed.

## Styling notes
- Design language: warm craft paper (`--paper`), ink text, caramel + deep brown accents to match physical scrapbook spreads.
- Cards use faux tape pieces (`.tape-1`, `.tape-2`), pushpins (`.pin`), and a subtle rotation per card for layered realism.
- Panels get a side binding accent; page background has light ruling to suggest notebook paper.
- Form is sticky on larger screens; layout collapses to single column under 980px.

## Running locally
```bash
cd scrapbook
npm install
npm run dev
```
Then open the printed localhost URL.

## Possible extensions
- Persist `entries` to `localStorage` so they survive refresh.
- Add drag-and-drop zone for images.
- Support multiple photos per page with a small carousel.
- Export/import JSON so you can move your scrapbook between browsers.
- Add keyboard shortcuts (e.g., `Cmd/Ctrl+Enter` to add page).

## Learning checklist (try implementing)
- [ ] Add `useEffect` to sync `entries` to `localStorage` and hydrate on load.
- [ ] Replace base64 with `URL.createObjectURL` and revoke URLs on cleanup.
- [ ] Write a custom hook `useFilePreview` for reuse.
- [ ] Extract `EntryCard` and `EntryForm` components to practice prop drilling vs. context.
- [ ] Write a simple unit test for `removeEntry` using Vitest + React Testing Library.
