"use strict";

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const sharp = require("sharp");
const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
const TARGET_MAX_MB = 10;
const TARGET_MAX_BYTES = TARGET_MAX_MB * 1024 * 1024;

const QUALITY_TIERS = [
  { quality: 85, resize: 1.0 },
  { quality: 75, resize: 1.0 },
  { quality: 65, resize: 0.9 },
  { quality: 55, resize: 0.8 },
  { quality: 45, resize: 0.75 },
];

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"]);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getOutputPath(inputPath) {
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, ".pptx");
  return path.join(dir, `${base}_compressed.pptx`);
}

// ─── IMAGE COMPRESSION ───────────────────────────────────────────────────────
async function compressImageBuffer(buffer, ext, tier) {
  const { quality, resize } = tier;
  let img = sharp(buffer, { animated: false, failOn: "none" });
  const meta = await img.metadata();

  if (resize < 1.0 && meta.width && meta.height) {
    img = img.resize(
      Math.round(meta.width * resize),
      Math.round(meta.height * resize),
      { fit: "inside", withoutEnlargement: true }
    );
  }

  const normExt = ext === ".jpeg" ? ".jpg" : ext;
  switch (normExt) {
    case ".jpg":
      return img.jpeg({ quality, mozjpeg: true }).toBuffer();
    case ".png":
      return img.png({ compressionLevel: Math.round((100 - quality) / 11), quality }).toBuffer();
    case ".gif":
    case ".bmp":
    case ".tiff":
      return img.jpeg({ quality, mozjpeg: true }).toBuffer();
    case ".webp":
      return img.webp({ quality }).toBuffer();
    default:
      return img.jpeg({ quality, mozjpeg: true }).toBuffer();
  }
}

// ─── COMPRESS PPTX AT TIER ───────────────────────────────────────────────────
async function compressPptxAtTier(inputPath, tier, spinner) {
  const zip = new AdmZip(inputPath);
  const entries = zip.getEntries();

  let imagesFound = 0, imagesCompressed = 0, bytesOriginal = 0, bytesSaved = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const ext = path.extname(entry.entryName).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;

    imagesFound++;
    spinner.text = chalk.cyan(`  Processing image ${imagesFound}: ${path.basename(entry.entryName)}`);

    const originalBuffer = entry.getData();
    bytesOriginal += originalBuffer.length;

    try {
      const compressedBuffer = await compressImageBuffer(originalBuffer, ext, tier);
      if (compressedBuffer.length < originalBuffer.length) {
        bytesSaved += originalBuffer.length - compressedBuffer.length;
        zip.updateFile(entry.entryName, compressedBuffer);
        imagesCompressed++;
      }
    } catch (_) {
      // skip unsupported image formats silently
    }
  }

  return { zip, imagesFound, imagesCompressed, bytesOriginal, bytesSaved };
}

// ─── MAIN COMPRESSION FLOW ───────────────────────────────────────────────────
async function compressPptx(inputPath) {
  const originalSize = fs.statSync(inputPath).size;
  const outputPath = getOutputPath(inputPath);

  console.log("");
  console.log(chalk.bold.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.bold.cyan("  PPT Compressor"));
  console.log(chalk.bold.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.white(`  Input  : ${chalk.yellow(path.basename(inputPath))}`));
  console.log(chalk.white(`  Size   : ${chalk.yellow(formatBytes(originalSize))}`));
  console.log(chalk.white(`  Target : ${chalk.green(`< ${TARGET_MAX_MB} MB`)}`));
  console.log(chalk.bold.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log("");

  const spinner = ora({ text: "Starting compression...", color: "cyan" }).start();

  let finalZip = null, finalStats = null, usedTier = null, resultSize = Infinity;

  for (let i = 0; i < QUALITY_TIERS.length; i++) {
    const tier = QUALITY_TIERS[i];
    spinner.text = chalk.cyan(
      `  [Tier ${i + 1}/${QUALITY_TIERS.length}] Quality=${tier.quality}% Scale=${Math.round(tier.resize * 100)}%`
    );

    const result = await compressPptxAtTier(inputPath, tier, spinner);
    const tempBuf = result.zip.toBuffer();
    resultSize = tempBuf.length;

    finalZip = result.zip;
    finalStats = result;
    usedTier = tier;

    spinner.text = chalk.cyan(
      `  [Tier ${i + 1}] Result: ${formatBytes(resultSize)} (${result.imagesCompressed}/${result.imagesFound} images optimised)`
    );

    if (resultSize <= TARGET_MAX_BYTES) {
      spinner.succeed(chalk.green(`  Target achieved at Tier ${i + 1}!`));
      break;
    }

    if (i === QUALITY_TIERS.length - 1) {
      spinner.warn(chalk.yellow(`  Best effort: ${formatBytes(resultSize)} (limited image content in file)`));
    }
  }

  spinner.start(chalk.cyan("  Saving compressed file..."));
  finalZip.writeZip(outputPath);
  spinner.succeed(chalk.green("  File saved!"));

  const finalSize = fs.statSync(outputPath).size;
  const savedPercent = (((originalSize - finalSize) / originalSize) * 100).toFixed(1);
  const underTarget = finalSize <= TARGET_MAX_BYTES;

  console.log("");
  console.log(chalk.bold.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.bold.green("  Compression Complete!"));
  console.log(chalk.bold.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.white(`  Original : ${chalk.yellow(formatBytes(originalSize))}`));
  console.log(chalk.white(`  Final    : ${underTarget ? chalk.green(formatBytes(finalSize)) : chalk.red(formatBytes(finalSize))}`));
  console.log(chalk.white(`  Saved    : ${chalk.green(formatBytes(originalSize - finalSize))} (${savedPercent}%)`));
  console.log(chalk.white(`  Images   : ${chalk.cyan(finalStats.imagesCompressed)}/${chalk.cyan(finalStats.imagesFound)} optimised`));
  console.log(chalk.white(`  Quality  : ${chalk.cyan(`${usedTier.quality}%`)} | Scale: ${chalk.cyan(`${Math.round(usedTier.resize * 100)}%`)}`));
  console.log(chalk.white(`  Status   : ${underTarget ? chalk.green("Under 10 MB target") : chalk.yellow("Best effort (file lacks large images)")}`));
  console.log(chalk.bold.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.white("  Output saved to:"));
  console.log(chalk.bold.green(`  ${outputPath}`));
  console.log(chalk.bold.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log("");
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
async function main() {
  console.clear();
  console.log(chalk.bold.cyan(`
+==================================================+
|         PPT COMPRESSOR  v1.0                     |
|   Compress PPTX files strictly under 10 MB       |
+==================================================+
`));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "pptPath",
      message: chalk.bold.white("Enter the path to your PPTX file:"),
      validate(value) {
        const trimmed = value.trim().replace(/^["']|["']$/g, "");
        if (!trimmed) return "Path cannot be empty.";
        if (!fs.existsSync(trimmed)) return `File not found: ${trimmed}`;
        if (path.extname(trimmed).toLowerCase() !== ".pptx")
          return "Only .pptx files are supported.";
        return true;
      },
      filter: (v) => v.trim().replace(/^["']|["']$/g, ""),
    },
  ]);

  const inputPath = path.resolve(answers.pptPath);

  try {
    await compressPptx(inputPath);
  } catch (err) {
    console.error(chalk.red(`\n  Error: ${err.message}`));
    process.exit(1);
  }
}

main();
