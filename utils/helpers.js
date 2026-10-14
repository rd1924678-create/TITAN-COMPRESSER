"use strict";

const path = require("path");
const { printMissionBriefing, printMissionComplete } = require("./ui");

const TARGET_MAX_MB = 10;
const TARGET_MAX_BYTES = TARGET_MAX_MB * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getOutputPath(inputPath, suffix = "compressed") {
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext);
  return path.join(dir, `${base}_${suffix}${ext}`);
}

function printHeader(label, inputPath, originalSize) {
  printMissionBriefing(label, inputPath, formatBytes(originalSize));
}

function printSummary(inputPath, outputPath, originalSize, finalSize, extra = {}) {
  const saved = originalSize - finalSize;
  const savedPct = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(1) : "0.0";
  const underTarget = finalSize <= TARGET_MAX_BYTES;

  printMissionComplete(
    inputPath,
    outputPath,
    formatBytes(originalSize),
    formatBytes(finalSize),
    formatBytes(saved),
    savedPct,
    underTarget,
    extra
  );
}

module.exports = {
  TARGET_MAX_MB,
  TARGET_MAX_BYTES,
  formatBytes,
  getOutputPath,
  printHeader,
  printSummary,
};
