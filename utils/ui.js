"use strict";

const chalk = require("chalk");
const readline = require("readline");

// ─── Cyberpunk / Gaming Color Palette ─────────────────────────────────────────
const COLORS = {
  cyan:      chalk.hex("#00F0FF"),
  cyanBold:  chalk.hex("#00F0FF").bold,
  pink:      chalk.hex("#FF007F"),
  pinkBold:  chalk.hex("#FF007F").bold,
  purple:    chalk.hex("#A855F7"),
  purpleBold:chalk.hex("#A855F7").bold,
  green:     chalk.hex("#00FF88"),
  greenBold: chalk.hex("#00FF88").bold,
  yellow:    chalk.hex("#FFE600"),
  yellowBold:chalk.hex("#FFE600").bold,
  orange:    chalk.hex("#FF7700"),
  muted:     chalk.hex("#64748B"),
  darkMuted: chalk.hex("#334155"),
  dimGrid:   chalk.hex("#1E293B"),
  whiteBold: chalk.whiteBright.bold,
  border:    chalk.hex("#00F0FF"),
  borderDim: chalk.hex("#0E7490"),
};

// ─── 5x7 Dot/Pixel Font Bitmaps for "COMPRESSED" ──────────────────────────────
const BITMAP = {
  C: [" ### ", "#   #", "#    ", "#    ", "#    ", "#   #", " ### "],
  O: [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
  M: ["#   #", "## ##", "# # #", "# # #", "#   #", "#   #", "#   #"],
  P: ["#### ", "#   #", "#   #", "#### ", "#    ", "#    ", "#    "],
  R: ["#### ", "#   #", "#   #", "#### ", "#  # ", "#   #", "#   #"],
  E: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
  S: [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
  D: ["#### ", "#   #", "#   #", "#   #", "#   #", "#   #", "#### "],
};

const WORD = "COMPRESSED";
const BOX_WIDTH = 71;

const GRADIENT_ROWS = [
  "#00F0FF",
  "#22D3EE",
  "#818CF8",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#FF007F",
];

// ─── ANSI-safe String Helpers ────────────────────────────────────────────────
function stripAnsi(str) {
  return String(str).replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

function visibleLength(str) {
  return stripAnsi(str).length;
}

function padLine(content, width = BOX_WIDTH) {
  const len = visibleLength(content);
  return content + " ".repeat(Math.max(0, width - len));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Render Single Frame of Dot/Pixel COMPRESSED ─────────────────────────────
function renderCompressedLines(completionPct = 1.0) {
  const lines = [];
  const isFinal = completionPct >= 1.0;

  for (let r = 0; r < 7; r++) {
    let content = "   ";
    for (const ch of WORD) {
      const glyph = BITMAP[ch][r];
      for (let c = 0; c < glyph.length; c++) {
        const isTarget = glyph[c] === "#";
        if (isFinal) {
          if (isTarget) {
            content += chalk.hex(GRADIENT_ROWS[r]).bold("■");
          } else {
            content += " ";
          }
        } else {
          const rand = Math.random();
          if (isTarget && rand < completionPct) {
            content += chalk.hex(GRADIENT_ROWS[r]).bold("▪");
          } else if (isTarget) {
            content += chalk.hex("#00F0FF")("·");
          } else if (rand < 0.08 * (1 - completionPct)) {
            content += COLORS.dimGrid("·");
          } else {
            content += " ";
          }
        }
      }
      content += " ";
    }
    lines.push(content);
  }
  return lines;
}

// ─── Form the "COMPRESSED" Pixels/Dots at Top (Animated or Static) ───────────
async function printHeroHeader({ animated = false } = {}) {
  const frames = animated ? [0.15, 0.45, 0.75, 1.0] : [1.0];

  for (let f = 0; f < frames.length; f++) {
    const pct = frames[f];

    if (animated) {
      console.clear();
    }

    console.log(COLORS.border("  ╔" + "═".repeat(BOX_WIDTH) + "╗"));
    console.log(COLORS.border("  ║") + " ".repeat(BOX_WIDTH) + COLORS.border("║"));

    const pixelLines = renderCompressedLines(pct);
    for (let r = 0; r < 7; r++) {
      console.log(COLORS.border("  ║") + padLine(pixelLines[r], BOX_WIDTH) + COLORS.border("║"));
    }

    console.log(COLORS.border("  ║") + " ".repeat(BOX_WIDTH) + COLORS.border("║"));

    const sub = "    ⚡ TITAN-COMPRESSER        " + chalk.black.bgHex("#00F0FF").bold(" PROTOCOL: ULTRA-CRUNCH ") + " " + COLORS.pinkBold("v3.2");
    console.log(COLORS.border("  ║") + padLine(sub, BOX_WIDTH) + COLORS.border("║"));

    console.log(COLORS.border("  ╠" + "═".repeat(BOX_WIDTH) + "╣"));

    const r1 = "   " + COLORS.greenBold("● SYSTEM: ARMED & READY") + "          " + COLORS.yellowBold("🎯 THRESHOLD: < 10.00 MB STRICT");
    console.log(COLORS.border("  ║") + padLine(r1, BOX_WIDTH) + COLORS.border("║"));

    const r2 = "   " + COLORS.muted("📁 ARSENAL: ") + chalk.whiteBright("IMAGE · VIDEO · PDF · DOCX · XLSX · PPTX") + "  " + chalk.hex("#BD93F9")("⚡ OVERCLOCKED");
    console.log(COLORS.border("  ║") + padLine(r2, BOX_WIDTH) + COLORS.border("║"));

    console.log(COLORS.border("  ╚" + "═".repeat(BOX_WIDTH) + "╝"));

    if (animated && f < frames.length - 1) {
      await sleep(65);
    }
  }
  console.log("");
}

// ─── Mission Briefing Header (When Starting Compression) ─────────────────────
function printMissionBriefing(label, inputPath, originalSizeStr) {
  const path = require("path");
  const prefix = "─── [ MISSION BRIEFING // COMPRESSION SEQUENCE ] ";
  const fillLen = Math.max(0, BOX_WIDTH - prefix.length);
  const topBorder = "  ┌" + prefix + "─".repeat(fillLen) + "┐";
  const botBorder = "  └" + "─".repeat(BOX_WIDTH) + "┘";

  console.log("");
  console.log(COLORS.cyanBold(topBorder));
  console.log(COLORS.cyanBold("  │") + " ".repeat(BOX_WIDTH) + COLORS.cyanBold("│"));
  console.log(COLORS.cyanBold("  │") + padLine("  🎯 OPERATION   : " + chalk.whiteBright.bold(label.toUpperCase()), BOX_WIDTH) + COLORS.cyanBold("│"));
  console.log(COLORS.cyanBold("  │") + padLine("  📁 TARGET FILE : " + COLORS.yellowBold(path.basename(inputPath)), BOX_WIDTH) + COLORS.cyanBold("│"));
  console.log(COLORS.cyanBold("  │") + padLine("  📊 PAYLOAD     : " + COLORS.pinkBold(originalSizeStr) + "  " + chalk.hex("#94A3B8")("[OVER THRESHOLD]"), BOX_WIDTH) + COLORS.cyanBold("│"));
  console.log(COLORS.cyanBold("  │") + padLine("  ⚡ HARD LIMIT  : " + COLORS.greenBold("< 10.00 MB STRICT ENFORCEMENT"), BOX_WIDTH) + COLORS.cyanBold("│"));
  console.log(COLORS.cyanBold("  │") + padLine("  🛡  ENGINE     : " + chalk.hex("#C084FC")("QUANTUM MULTI-TIER SHREDDER"), BOX_WIDTH) + COLORS.cyanBold("│"));
  console.log(COLORS.cyanBold("  │") + " ".repeat(BOX_WIDTH) + COLORS.cyanBold("│"));
  console.log(COLORS.cyanBold(botBorder));
  console.log("");
}

// ─── Gauge Bar Generator ─────────────────────────────────────────────────────
function makeProgressBar(pct, totalBlocks = 24) {
  const validPct = Math.min(100, Math.max(0, isNaN(pct) ? 0 : pct));
  const filled = Math.min(totalBlocks, Math.max(0, Math.round((validPct / 100) * totalBlocks)));
  const empty = totalBlocks - filled;
  const barFilled = COLORS.greenBold("█".repeat(filled));
  const barEmpty  = COLORS.darkMuted("░".repeat(empty));
  return "[" + barFilled + barEmpty + "] " + COLORS.greenBold(validPct.toFixed(1) + "%");
}

// ─── Rank Calculator ─────────────────────────────────────────────────────────
function getRank(pctSaved) {
  if (pctSaved >= 75) return COLORS.yellowBold("★★★ SSS RANK [SUPREME REDUCTION] ★★★");
  if (pctSaved >= 50) return chalk.hex("#00F0FF").bold("★★  SS RANK  [MASTER COMPRESSION] ★★");
  if (pctSaved >= 25) return COLORS.purpleBold("★   S RANK   [TACTICAL EFFICIENCY] ★");
  if (pctSaved > 0)   return COLORS.greenBold("    A RANK   [MISSION CLEARED]");
  return COLORS.muted("    OPTIMIZED [BASELINE REACHED]");
}

// ─── Mission Complete / Victory Summary ──────────────────────────────────────
function printMissionComplete(inputPath, outputPath, originalSizeStr, finalSizeStr, savedStr, savedPct, underTarget, extra = {}) {
  const path = require("path");
  const pctNum = parseFloat(savedPct) || 0;
  const borderCol = underTarget ? COLORS.greenBold : COLORS.yellowBold;

  console.log("");
  console.log(borderCol("  ╔" + "═".repeat(BOX_WIDTH) + "╗"));
  console.log(borderCol("  ║") + padLine("  ★ MISSION ACCOMPLISHED // DATA PAYLOAD COMPRESSED ★", BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ╠" + "═".repeat(BOX_WIDTH) + "╣"));
  console.log(borderCol("  ║") + " ".repeat(BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ║") + padLine("  📁 TARGET FILE   : " + chalk.whiteBright.bold(path.basename(inputPath)), BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ║") + padLine("  📦 ORIGINAL SIZE : " + COLORS.yellowBold(originalSizeStr), BOX_WIDTH) + borderCol("║"));

  const finalBadge = underTarget
    ? chalk.black.bgHex("#00FF88").bold(" UNDER 10 MB CAP ")
    : chalk.black.bgHex("#FFE600").bold(" BEST EFFORT ");
  console.log(borderCol("  ║") + padLine("  ⚡ CRUNCHED SIZE : " + (underTarget ? COLORS.greenBold(finalSizeStr) : COLORS.yellowBold(finalSizeStr)) + "   " + finalBadge, BOX_WIDTH) + borderCol("║"));

  console.log(borderCol("  ║") + padLine("  💥 BYTES SHREDDED: " + COLORS.pinkBold(`${savedStr} (-${savedPct}%)`), BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ║") + " ".repeat(BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ║") + padLine("  📊 ENERGY GAUGE  : " + makeProgressBar(pctNum), BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ║") + padLine("  🏆 PERFORMANCE   : " + getRank(pctNum), BOX_WIDTH) + borderCol("║"));

  for (const [key, val] of Object.entries(extra)) {
    console.log(borderCol("  ║") + padLine(`  ⚙  ${key.padEnd(14)}: ` + chalk.hex("#38BDF8")(val), BOX_WIDTH) + borderCol("║"));
  }

  console.log(borderCol("  ║") + " ".repeat(BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ╠" + "═".repeat(BOX_WIDTH) + "╣"));
  console.log(borderCol("  ║") + padLine("  💾 DEPLOYED ARTIFACT:", BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ║") + padLine("  " + COLORS.cyan(outputPath), BOX_WIDTH) + borderCol("║"));
  console.log(borderCol("  ╚" + "═".repeat(BOX_WIDTH) + "╝"));
  console.log("");
}

module.exports = {
  COLORS,
  BOX_WIDTH,
  stripAnsi,
  visibleLength,
  padLine,
  printHeroHeader,
  printMissionBriefing,
  printMissionComplete,
  makeProgressBar,
};
