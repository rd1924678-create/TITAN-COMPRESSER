"use strict";

const fs   = require("fs");
const path = require("path");
const sharp = require("sharp");
const ora  = require("ora");
const chalk = require("chalk");
const { TARGET_MAX_BYTES, formatBytes, getOutputPath, printHeader, printSummary } = require("../utils/helpers");

// ─── All image formats sharp can read ────────────────────────────────────────
const IMAGE_EXTS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".bmp", ".tiff", ".tif", ".avif", ".heic",
  ".heif", ".svg", ".ico", ".raw", ".jfif",
  ".pjpeg", ".pjp"
]);

// ─── Quality tiers ────────────────────────────────────────────────────────────
const QUALITY_TIERS = [
  { quality: 90, resize: 1.0  },
  { quality: 80, resize: 1.0  },
  { quality: 70, resize: 0.95 },
  { quality: 60, resize: 0.9  },
  { quality: 50, resize: 0.85 },
  { quality: 40, resize: 0.80 },
];

// ─── Decide output format + encode ───────────────────────────────────────────
// We keep the same extension where possible.
// Formats that can't be written by sharp are converted to JPEG.
const WRITABLE_AS_WEBP  = new Set([".webp"]);
const WRITABLE_AS_PNG   = new Set([".png"]);
const WRITABLE_AS_AVIF  = new Set([".avif"]);
const WRITABLE_AS_TIFF  = new Set([".tiff", ".tif"]);
const WRITABLE_AS_GIF   = new Set([".gif"]);
// Everything else → JPEG output (bmp, svg, ico, heic, heif, raw, jfif, pjp…)

function getOutputExt(ext) {
  if (WRITABLE_AS_PNG.has(ext))   return ".png";
  if (WRITABLE_AS_WEBP.has(ext))  return ".webp";
  if (WRITABLE_AS_AVIF.has(ext))  return ".avif";
  if (WRITABLE_AS_TIFF.has(ext))  return ".tiff";
  if (WRITABLE_AS_GIF.has(ext))   return ".gif";
  return ".jpg";  // default: JPEG
}

async function encodeBuffer(img, outputExt, quality) {
  switch (outputExt) {
    case ".png":
      return img.png({ compressionLevel: Math.round((100 - quality) / 11), quality }).toBuffer();
    case ".webp":
      return img.webp({ quality }).toBuffer();
    case ".avif":
      return img.avif({ quality }).toBuffer();
    case ".tiff":
      return img.tiff({ quality }).toBuffer();
    case ".gif":
      // sharp writes GIF but doesn't compress well; convert to webp for size
      return img.webp({ quality }).toBuffer();
    default:
      return img.jpeg({ quality, mozjpeg: true }).toBuffer();
  }
}

// ─── Main compressor ──────────────────────────────────────────────────────────
async function compressImage(inputPath) {
  const originalSize = fs.statSync(inputPath).size;
  const inputExt  = path.extname(inputPath).toLowerCase();
  const outputExt = getOutputExt(inputExt);

  // Build output path (may change extension e.g. .bmp → .jpg)
  const dir  = path.dirname(inputPath);
  const base = path.basename(inputPath, inputExt);
  const outputPath = path.join(dir, `${base}_compressed${outputExt}`);

  printHeader(`Image Compressor  (${inputExt.toUpperCase()} → ${outputExt.toUpperCase()})`, inputPath, originalSize);

  const spinner = ora({ text: "Compressing image...", color: "cyan" }).start();

  let bestBuffer = null;
  let usedTier   = null;

  for (let i = 0; i < QUALITY_TIERS.length; i++) {
    const tier = QUALITY_TIERS[i];
    spinner.text = chalk.cyan(
      `  [Tier ${i + 1}/${QUALITY_TIERS.length}] Quality=${tier.quality}% Scale=${Math.round(tier.resize * 100)}%`
    );

    let img = sharp(inputPath, { animated: false, failOn: "none" });

    try {
      const meta = await img.metadata();
      if (tier.resize < 1.0 && meta.width && meta.height) {
        img = img.resize(
          Math.round(meta.width  * tier.resize),
          Math.round(meta.height * tier.resize),
          { fit: "inside", withoutEnlargement: true }
        );
      }
    } catch (_) {}

    let buffer;
    try {
      buffer = await encodeBuffer(img, outputExt, tier.quality);
    } catch (err) {
      spinner.fail(chalk.red(`  Cannot compress this image: ${err.message}`));
      return;
    }

    bestBuffer = buffer;
    usedTier   = tier;
    spinner.text = chalk.cyan(`  [Tier ${i + 1}] Result: ${formatBytes(buffer.length)}`);

    if (buffer.length <= TARGET_MAX_BYTES) {
      spinner.succeed(chalk.green(`  Target achieved at Tier ${i + 1}!`));
      break;
    }
    if (i === QUALITY_TIERS.length - 1) {
      spinner.warn(chalk.yellow("  Best effort applied."));
    }
  }

  spinner.start(chalk.cyan("  Saving..."));
  fs.writeFileSync(outputPath, bestBuffer);
  spinner.succeed(chalk.green("  Saved!"));

  const finalSize = fs.statSync(outputPath).size;
  printSummary(inputPath, outputPath, originalSize, finalSize, {
    Format:  `${inputExt} → ${outputExt}`,
    Quality: `${usedTier.quality}%`,
    Scale:   `${Math.round(usedTier.resize * 100)}%`,
  });
}

module.exports = { compressImage, supportedExts: [...IMAGE_EXTS] };
