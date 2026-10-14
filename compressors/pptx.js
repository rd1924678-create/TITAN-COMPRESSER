"use strict";

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const sharp = require("sharp");
const ora = require("ora");
const chalk = require("chalk");
const { TARGET_MAX_BYTES, formatBytes, getOutputPath, printHeader, printSummary } = require("../utils/helpers");

const QUALITY_TIERS = [
  { quality: 85, resize: 1.0 },
  { quality: 75, resize: 1.0 },
  { quality: 65, resize: 0.9 },
  { quality: 55, resize: 0.8 },
  { quality: 45, resize: 0.75 },
];

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"]);

async function compressImageBuffer(buffer, ext, tier) {
  const { quality, resize } = tier;
  let img = sharp(buffer, { animated: false, failOn: "none" });
  const meta = await img.metadata();
  if (resize < 1.0 && meta.width && meta.height) {
    img = img.resize(Math.round(meta.width * resize), Math.round(meta.height * resize), { fit: "inside", withoutEnlargement: true });
  }
  const normExt = ext === ".jpeg" ? ".jpg" : ext;
  switch (normExt) {
    case ".jpg":   return img.jpeg({ quality, mozjpeg: true }).toBuffer();
    case ".png":   return img.png({ compressionLevel: Math.round((100 - quality) / 11), quality }).toBuffer();
    case ".webp":  return img.webp({ quality }).toBuffer();
    default:       return img.jpeg({ quality, mozjpeg: true }).toBuffer();
  }
}

async function compressAtTier(inputPath, tier, spinner) {
  const zip = new AdmZip(inputPath);
  let imagesFound = 0, imagesCompressed = 0;
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const ext = path.extname(entry.entryName).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    imagesFound++;
    spinner.text = chalk.cyan(`  Processing image ${imagesFound}: ${path.basename(entry.entryName)}`);
    const original = entry.getData();
    try {
      const compressed = await compressImageBuffer(original, ext, tier);
      if (compressed.length < original.length) { zip.updateFile(entry.entryName, compressed); imagesCompressed++; }
    } catch (_) {}
  }
  return { zip, imagesFound, imagesCompressed };
}

async function compressPptx(inputPath) {
  const originalSize = fs.statSync(inputPath).size;
  const outputPath = getOutputPath(inputPath);
  printHeader("PPTX Compressor", inputPath, originalSize);
  const spinner = ora({ text: "Starting...", color: "cyan" }).start();

  let finalZip, finalStats, usedTier, resultSize = Infinity;

  for (let i = 0; i < QUALITY_TIERS.length; i++) {
    const tier = QUALITY_TIERS[i];
    spinner.text = chalk.cyan(`  [Tier ${i + 1}/${QUALITY_TIERS.length}] Quality=${tier.quality}% Scale=${Math.round(tier.resize * 100)}%`);
    const result = await compressAtTier(inputPath, tier, spinner);
    resultSize = result.zip.toBuffer().length;
    finalZip = result.zip; finalStats = result; usedTier = tier;
    spinner.text = chalk.cyan(`  [Tier ${i + 1}] Result: ${formatBytes(resultSize)} (${result.imagesCompressed}/${result.imagesFound} images)`);
    if (resultSize <= TARGET_MAX_BYTES) { spinner.succeed(chalk.green(`  Target achieved at Tier ${i + 1}!`)); break; }
    if (i === QUALITY_TIERS.length - 1) spinner.warn(chalk.yellow("  Best effort applied."));
  }

  spinner.start(chalk.cyan("  Saving...")); finalZip.writeZip(outputPath); spinner.succeed(chalk.green("  Saved!"));
  const finalSize = fs.statSync(outputPath).size;
  printSummary(inputPath, outputPath, originalSize, finalSize, {
    Images: `${finalStats.imagesCompressed}/${finalStats.imagesFound} optimised`,
    Quality: `${usedTier.quality}%`,
  });
}

module.exports = { compressPptx, supportedExts: [".pptx"] };
