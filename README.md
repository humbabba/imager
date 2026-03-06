# Sublogical Endeavors Imager

A privacy-first, browser-based image processing tool. Resize, crop, reformat, and add styled text overlays to your images — all without uploading anything to a server.

## Why Use Imager?

**Your images never leave your machine.** All processing happens locally in your browser using the Canvas API. There's no cloud, no uploads, no waiting — just fast, private image processing.

### What You Can Do

- **Resize & constrain** — Set max width/height and let Imager scale proportionally
- **Aspect ratio enforcement** — Presets (1:1, 16:9, 9:16, 4:3, etc.) or custom ratios
- **Smart cropping** — Fill the target area with configurable crop position (center, top, bottom, left, right)
- **Overlay mode** — Fit the entire image on a blurred background or solid color, with adjustable margin and drop shadow
- **Text overlays** — Add multiple text layers with drag-and-drop positioning, 45+ bundled fonts, outlines, shadows, background boxes with slant effects
- **Batch processing** — Select multiple images, process them all with the same settings, download as a ZIP
- **Format conversion** — Force JPG output with adjustable quality for smaller file sizes
- **Shareable settings** — Copy a URL that encodes your entire configuration; anyone who opens it gets the same setup instantly
- **Persistent settings** — Your configuration auto-saves to local storage between sessions

## Getting Started

### Requirements

- PHP 7.4+ (for serving the page and optional analytics logging)
- Node.js (for building CSS/JS assets)
- A web server (Apache/Nginx) or local dev environment like XAMPP

### Installation

```bash
git clone https://github.com/humbabba/imager.git
cd imager
npm install
npm run build
```

Point your web server's document root (or a virtual host) at the project directory, then open `index.php` in your browser.

### Development

```bash
# Watch for CSS and JS changes
npm run watch
```

This runs Tailwind CSS and esbuild in watch mode for live rebuilds during development.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript, Canvas API, JSZip |
| Styling | Tailwind CSS v4 with custom steampunk theme |
| Build | esbuild (JS bundling), Tailwind CLI (CSS) |
| Fonts | 45+ self-hosted fonts (woff2/ttf) — no external requests |
| Backend | PHP (page rendering + optional SQLite analytics) |
| Storage | Browser localStorage for settings persistence |

## Project Structure

```
imager/
├── index.php          # Main application page
├── manual.php         # Built-in user manual
├── version.php        # Version string
├── api/
│   └── log.php        # Optional usage analytics (SQLite)
├── src/
│   ├── main.js        # Application logic (Canvas processing, text overlay, batch, settings)
│   ├── input.css      # Tailwind config + custom steampunk component styles
│   ├── fonts.css      # @font-face declarations
│   └── fonts/         # Self-hosted font files
├── dist/              # Built output (CSS + JS)
└── data/              # SQLite database (auto-created, gitignored)
```

## How It Works

1. Images are loaded into an off-screen `<canvas>` element
2. Resize, crop, and overlay transformations are applied via Canvas 2D context operations
3. Text is rendered directly onto the canvas at full resolution with proper font metrics
4. The final canvas is exported as a blob (JPEG or PNG) for download
5. For batch jobs, processed images are packaged into a ZIP archive client-side using JSZip

## License

Open-sourced software licensed under the [MIT license](https://opensource.org/license/MIT).
