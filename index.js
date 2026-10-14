"use strict";

const fs   = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const chalk    = require("chalk");

const { compressImage }  = require("./compressors/image");
const { compressPptx }   = require("./compressors/pptx");
const { compressDocx }   = require("./compressors/docx");
const { compressXlsx }   = require("./compressors/xlsx");
const { compressPdf }    = require("./compressors/pdf");
const { compressVideo }  = require("./compressors/video");
const { printHeroHeader, COLORS } = require("./utils/ui");

// ─── Allowed extensions per service ──────────────────────────────────────────
const SERVICES = {
  image: {
    label: "Image",
    exts:  [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".tif",
             ".avif", ".heic", ".heif", ".svg", ".ico", ".raw", ".jfif", ".pjpeg", ".pjp"],
    fn:    compressImage,
  },
  video: {
    label: "Video",
    exts:  [".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm", ".m4v", ".3gp", ".mpeg", ".mpg", ".ts", ".mts", ".vob"],
    fn:    compressVideo,
  },
  pdf: {
    label: "PDF",
    exts:  [".pdf"],
    fn:    compressPdf,
  },
  docx: {
    label: "Document",
    exts:  [".docx"],
    fn:    compressDocx,
  },
  xlsx: {
    label: "Spreadsheet",
    exts:  [".xlsx"],
    fn:    compressXlsx,
  },
  pptx: {
    label: "Presentation",
    exts:  [".pptx"],
    fn:    compressPptx,
  },
};

// ─── Gamer-styled Menu choices ────────────────────────────────────────────────
const MENU_CHOICES = [
  {
    name: COLORS.cyanBold("  [ 👾 IMAGE ]  ") + chalk.white("Cyber Visuals ") + COLORS.muted("(JPG, PNG, WebP, GIF, HEIC, AVIF, SVG +)"),
    value: "image",
  },
  {
    name: COLORS.pinkBold("  [ 🎬 VIDEO ]  ") + chalk.white("Media Streams ") + COLORS.muted("(MP4, AVI, MOV, MKV, WMV, FLV +)"),
    value: "video",
  },
  {
    name: COLORS.purpleBold("  [ 📜 PDF ]    ") + chalk.white("Tactical Docs ") + COLORS.muted("(PDF with Object Streams)"),
    value: "pdf",
  },
  {
    name: chalk.hex("#38BDF8").bold("  [ 📝 DOCX ]   ") + chalk.white("Intel Files   ") + COLORS.muted("(Word Document Archives)"),
    value: "docx",
  },
  {
    name: COLORS.greenBold("  [ 📊 XLSX ]   ") + chalk.white("Data Grids    ") + COLORS.muted("(Excel Spreadsheets)"),
    value: "xlsx",
  },
  {
    name: COLORS.orange("  [ 📽️ PPTX ]   ") + chalk.white("Holo Decks    ") + COLORS.muted("(PowerPoint Presentations)"),
    value: "pptx",
  },
  new inquirer.Separator(COLORS.darkMuted("  ─────────────────────────────────────────────────────────────")),
  {
    name: chalk.hex("#EF4444").bold("  [ ✖  ABORT ]  ") + chalk.white("Shutdown & Exit"),
    value: "exit",
  },
];

// ─── Main loop ────────────────────────────────────────────────────────────────
async function main() {
  let isFirstRun = true;

  while (true) {
    // Top banner with dot/pixel forming COMPRESSED
    await printHeroHeader({ animated: isFirstRun });
    isFirstRun = false;

    // Step 1 — pick service
    const { service } = await inquirer.prompt([
      {
        type: "list",
        name: "service",
        message: COLORS.cyanBold("⚡ [LOADOUT]") + chalk.white(" Select payload type to engage:"),
        choices: MENU_CHOICES,
        pageSize: 10,
      },
    ]);

    if (service === "exit") {
      console.log("");
      console.log(COLORS.cyan("  ╔═════════════════════════════════════════════════════════════════╗"));
      console.log(COLORS.cyan("  ║  ") + COLORS.pinkBold("⚡ SHUTDOWN: ENGINE DISENGAGED // SESSION TERMINATED") + "      " + COLORS.cyan("║"));
      console.log(COLORS.cyan("  ╚═════════════════════════════════════════════════════════════════╝\n"));
      process.exit(0);
    }

    const { label, exts, fn } = SERVICES[service];

    // Step 2 — ask for file path
    const { filePath } = await inquirer.prompt([
      {
        type: "input",
        name: "filePath",
        message: COLORS.cyanBold("⚡ [TARGET]") + chalk.white(` Enter path to your ${COLORS.yellowBold(label)} file:`),
        validate(value) {
          const trimmed = value.trim().replace(/^["']|["']$/g, "");
          if (!trimmed) {
            return chalk.hex("#EF4444")("✖ Target path cannot be empty.");
          }
          if (!fs.existsSync(trimmed)) {
            return chalk.hex("#EF4444")(`✖ File not found: ${trimmed}`);
          }
          const ext = path.extname(trimmed).toLowerCase();
          if (!exts.includes(ext)) {
            return chalk.hex("#EF4444")(
              `✖ Unsupported format for ${label}. Supported: ${exts.join(", ")} | Detected: ${ext || "none"}`
            );
          }
          return true;
        },
        filter: (v) => v.trim().replace(/^["']|["']$/g, ""),
      },
    ]);

    const inputPath = path.resolve(filePath);

    try {
      await fn(inputPath);
    } catch (err) {
      console.error(chalk.hex("#EF4444").bold(`\n  ✖ CRITICAL ERROR: ${err.message}\n`));
    }

    // Step 3 — compress another?
    const { again } = await inquirer.prompt([
      {
        type: "confirm",
        name: "again",
        message: COLORS.greenBold("⚡ [MISSION]") + chalk.white(" Engage another payload?"),
        default: true,
      },
    ]);

    if (!again) {
      console.log("");
      console.log(COLORS.cyan("  ╔═════════════════════════════════════════════════════════════════╗"));
      console.log(COLORS.cyan("  ║  ") + COLORS.greenBold("★ ALL MISSIONS ACCOMPLISHED // SYSTEM DISCONNECT") + "          " + COLORS.cyan("║"));
      console.log(COLORS.cyan("  ╚═════════════════════════════════════════════════════════════════╝\n"));
      break;
    }

    console.clear();
  }
}

main().catch((err) => {
  console.error(chalk.hex("#EF4444").bold(`\n  ✖ FATAL SYSTEM FAILURE: ${err.message}`));
  process.exit(1);
});
