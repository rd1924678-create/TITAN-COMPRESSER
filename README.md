# ⚡ TITAN-COMPRESSER // GAMING EDITION v3.2

> **High-Performance Multi-Payload Compression Matrix engineered to enforce a strict `< 10 MB` threshold across Images, Videos, PDFs, and Office Documents with a Cyberpunk Gaming HUD aesthetic.**

---

## 🎮 Overview

**TITAN-COMPRESSER** is a standalone, modular Node.js command-line utility and double-click executable designed for effortless file size reduction. Built with a futuristic terminal UI, it provides real-time telemetry, RPG-style progress bars, performance rankings, and automated multi-tier compression algorithms to guarantee files stay under strict upload limits (such as email, Discord, Slack, and web portal thresholds).

```
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║                                                                       ║
  ║    ■■■   ■■■  ■   ■ ■■■■  ■■■■  ■■■■■  ■■■■  ■■■■ ■■■■■ ■■■■          ║
  ║   ■   ■ ■   ■ ■■ ■■ ■   ■ ■   ■ ■     ■     ■     ■     ■   ■         ║
  ║   ■     ■   ■ ■ ■ ■ ■   ■ ■   ■ ■     ■     ■     ■     ■   ■         ║
  ║   ■     ■   ■ ■ ■ ■ ■■■■  ■■■■  ■■■■   ■■■   ■■■  ■■■■  ■   ■         ║
  ║   ■     ■   ■ ■   ■ ■     ■  ■  ■         ■     ■ ■     ■   ■         ║
  ║   ■   ■ ■   ■ ■   ■ ■     ■   ■ ■         ■     ■ ■     ■   ■         ║
  ║    ■■■   ■■■  ■   ■ ■     ■   ■ ■■■■■ ■■■■  ■■■■  ■■■■■ ■■■■          ║
  ║                                                                       ║
  ║    ⚡ TITAN-COMPRESSER         PROTOCOL: ULTRA-CRUNCH  v3.2            ║
  ╠═══════════════════════════════════════════════════════════════════════╣
  ║   ● SYSTEM: ARMED & READY          🎯 THRESHOLD: < 10.00 MB STRICT    ║
  ║   📁 ARSENAL: IMAGE · VIDEO · PDF · DOCX · XLSX · PPTX  ⚡ OVERCLOCKED ║
  ╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 🚀 Features

- **🎯 Strict < 10 MB Target Cap**: Automatically steps down through dynamic quality tiers until the file safely hits the target size.
- **👾 Universal Format Arsenal**:
  - **Images**: `JPG`, `PNG`, `WebP`, `GIF`, `BMP`, `TIFF`, `AVIF`, `HEIC`, `HEIF`, `SVG`, `ICO`, `RAW`, `JFIF`, `PJPEG`.
  - **Videos**: `MP4`, `AVI`, `MOV`, `MKV`, `WMV`, `FLV`, `WebM`, `M4V`, `3GP`, `MPEG`, `TS` *(powered by bundled static FFmpeg)*.
  - **Documents & Presentations**: `PDF`, `PPTX`, `DOCX`, `XLSX` *(extracts and compresses embedded media streams without breaking document structure)*.
- **🕹️ Cyberpunk Gaming Terminal UI/UX**:
  - Animated pixel/dot matrix boot sequence forming `COMPRESSED` at the top.
  - Interactive loadout selection menu with distinct color-coded badges.
  - Pre-compression **Mission Briefing** telemetry card.
  - Post-compression **Mission Complete Scoreboard** with energy reduction gauges and rank rating (`SSS`, `SS`, `S`, `A`).
- **⚡ Portable & Friendly Execution**: Single double-click launcher (`compress.bat`) handles dependency setup automatically for non-technical users.
- **🛡️ Safe Processing**: Original files are never overwritten; outputs are saved with a `_compressed` suffix in the same directory.

---

## 📋 System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux.
- **Runtime**: [Node.js](https://nodejs.org/) (Version **16.x or newer** recommended).

---

## 🛠️ Installation & Setup

### Option 1: Double-Click Launcher (Recommended for Windows Users)
1. Extract or place the project folder anywhere on your computer (e.g. Desktop).
2. Double-click **`compress.bat`**.
3. If run for the first time, the batch file checks for Node.js and automatically installs all required dependencies (`npm install`).

### Option 2: Manual Terminal Setup
1. Clone or download this repository:
   ```bash
   git clone <repo-url>
   cd cpmpress
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   # or
   node index.js
   ```

---

## 🎯 How to Use

1. **Launch the Engine**: Double-click `compress.bat` or run `node index.js`.
2. **Select Payload Type**: Use the arrow keys (`↑` / `↓`) and press `Enter` to select the file category:
   - `[ 👾 IMAGE ]` — Cyber Visuals
   - `[ 🎬 VIDEO ]` — Media Streams
   - `[ 📜 PDF ]` — Tactical Docs
   - `[ 📝 DOCX ]` — Intel Files
   - `[ 📊 XLSX ]` — Data Grids
   - `[ 📽️ PPTX ]` — Holo Decks
3. **Input File Path**:
   - Simply drag and drop the file directly into your terminal window, or paste the file path (quotes and spaces are automatically sanitized).
4. **Watch Real-Time Crunching**:
   - The engine displays a Mission Briefing and begins compressing through tiered optimizations.
5. **View Mission Complete Scorecard**:
   - Inspect the total reduction %, bytes shredded, and output file location.
6. **Re-engage or Exit**:
   - Choose whether to compress another file or shut down the engine.

---

## 📂 Project Architecture

```
cpmpress/
├── compress.bat              # Windows double-click automated launcher
├── index.js                  # Main interactive CLI menu & runtime loop
├── package.json              # Project metadata & dependencies
├── .gitignore                # Git ignore rules for node_modules & build artifacts
├── README.md                 # Complete documentation & usage guide
├── utils/
│   ├── ui.js                 # Gaming HUD, pixel animations, colors & telemetry cards
│   └── helpers.js            # Byte formatting, path utilities, briefing & summary hooks
└── compressors/
    ├── image.js              # Sharp-powered multi-format image compression
    ├── video.js              # FFmpeg-powered adaptive video transcoding
    ├── pdf.js                # PDF-Lib object stream optimizer & metadata stripper
    ├── docx.js               # AdmZip XML image shredder for Word (.docx)
    ├── xlsx.js               # AdmZip XML image shredder for Excel (.xlsx)
    └── pptx.js               # AdmZip XML image shredder for PowerPoint (.pptx)
```

---

## ⚙️ Technical Compression Pipeline

| Category | Engine / Technology | Strategy & Multi-Tier Approach |
| :--- | :--- | :--- |
| **Image** | `sharp` | Progressive WebP/JPEG encoding, adaptive dimensions downsampling (quality 90% down to 40%). |
| **Video** | `ffmpeg-static` | Multi-tier CRF encoding (CRF 26 to 46) + smart resolution cap (1080p -> 720p -> 480p -> 360p). Outputs high-compatibility MP4 (H.264 + AAC). |
| **PDF** | `pdf-lib` | Strips metadata overhead, restructures document using compressed Object Streams. |
| **Office** | `adm-zip` + `sharp` | Unpacks OpenXML containers without altering document structure; targets embedded media folders (`/media`) and compresses high-res bitmaps. |

---

## ❓ Troubleshooting & FAQs

### Q: "Node.js is not installed" error when running `compress.bat`
> Download and install the LTS version of Node.js from [nodejs.org](https://nodejs.org/). Restart your computer or terminal after installing.

### Q: File paths containing spaces or quotes
> Dragging and dropping files directly into the terminal often wraps paths in quotes (e.g. `"C:\Users\John Doe\file.mp4"`). TITAN-COMPRESSER automatically cleans and strips outer quotes.

### Q: Does compression overwrite my original file?
> **No.** Your original source file remains untouched. The optimized output is saved as `<filename>_compressed.<ext>` right beside the source file.

---

## 📜 License

ISC © 2026 TITAN-COMPRESSER Engine. Built for ultra-fast, gaming-grade terminal productivity.
