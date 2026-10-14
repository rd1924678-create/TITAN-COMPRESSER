"use strict";

const fs     = require("fs");
const path   = require("path");
const os     = require("os");
const { execFile } = require("child_process");
const ora    = require("ora");
const chalk  = require("chalk");
const ffmpegPath = require("ffmpeg-static");
const { TARGET_MAX_BYTES, formatBytes, printHeader, printSummary } = require("../utils/helpers");

// ─── Quality tiers ────────────────────────────────────────────────────────────
// crf: higher = smaller file, lower quality (18=great, 51=worst)
// vf : ffmpeg video filter for scaling (null = keep original)
const QUALITY_TIERS = [
  { crf: 26, vf: null,              label: "Original res" },
  { crf: 30, vf: null,              label: "Original res" },
  { crf: 34, vf: "scale=1280:-2",  label: "720p cap"     },
  { crf: 38, vf: "scale=854:-2",   label: "480p cap"     },
  { crf: 42, vf: "scale=640:-2",   label: "360p cap"     },
  { crf: 46, vf: "scale=426:-2",   label: "240p cap"     },
];

const VIDEO_EXTS = new Set([
  ".mp4", ".avi", ".mov", ".mkv", ".wmv",
  ".flv", ".webm", ".m4v", ".3gp", ".mpeg",
  ".mpg", ".ts", ".mts", ".vob"
]);

// ─── Run ffmpeg as child process ──────────────────────────────────────────────
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve();
    });
  });
}

// ─── Get video metadata via ffprobe ──────────────────────────────────────────
function getVideoInfo(inputPath) {
  return new Promise((resolve) => {
    // ffprobe is bundled alongside ffmpeg-static
    const ffprobePath = ffmpegPath.replace("ffmpeg", "ffprobe");
    const args = [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      inputPath
    ];
    execFile(ffprobePath, args, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout) => {
      if (err) return resolve(null);
      try {
        const data = JSON.parse(stdout);
        const vs = (data.streams || []).find(s => s.codec_type === "video");
        const dur = parseFloat(data.format?.duration || 0);
        resolve({
          width: vs?.width || "?",
          height: vs?.height || "?",
          duration: Math.round(dur),
        });
      } catch (_) { resolve(null); }
    });
  });
}

// ─── Compress one tier, return output temp path ───────────────────────────────
async function compressAtTier(inputPath, tier, tmpDir, i) {
  const tmpOut = path.join(tmpDir, `tier${i + 1}_${Date.now()}.mp4`);

  const args = [
    "-y",
    "-i", inputPath,
    "-c:v", "libx264",
    "-crf", String(tier.crf),
    "-preset", "fast",
    "-c:a", "aac",
    "-b:a", "96k",
    "-movflags", "+faststart",
  ];

  if (tier.vf) { args.push("-vf", tier.vf); }
  args.push(tmpOut);

  await runFfmpeg(args);
  return tmpOut;
}

// ─── Main compressor ──────────────────────────────────────────────────────────
async function compressVideo(inputPath) {
  const originalSize = fs.statSync(inputPath).size;
  const ext  = path.extname(inputPath).toLowerCase();
  const dir  = path.dirname(inputPath);
  const base = path.basename(inputPath, ext);
  const outputPath = path.join(dir, `${base}_compressed.mp4`);
  const tmpDir = os.tmpdir();

  printHeader("Video Compressor  (MP4/AVI/MOV/MKV/WMV/FLV + more)", inputPath, originalSize);

  const spinner = ora({ text: "Reading video info...", color: "cyan" }).start();

  // Show video info
  const info = await getVideoInfo(inputPath);
  if (info) {
    spinner.text = chalk.cyan(
      `  Resolution: ${info.width}x${info.height} | Duration: ${info.duration}s`
    );
    await new Promise(r => setTimeout(r, 600));
  }

  let lastTmpPath = null;
  let usedTier    = null;
  let resultSize  = Infinity;

  for (let i = 0; i < QUALITY_TIERS.length; i++) {
    const tier = QUALITY_TIERS[i];
    spinner.text = chalk.cyan(
      `  [Tier ${i + 1}/${QUALITY_TIERS.length}] CRF=${tier.crf} | ${tier.label} — encoding...`
    );

    let tmpOut;
    try {
      tmpOut = await compressAtTier(inputPath, tier, tmpDir, i);
    } catch (err) {
      spinner.warn(chalk.yellow(`  Tier ${i + 1} failed: ${err.message.slice(0, 80)}`));
      continue;
    }

    if (!fs.existsSync(tmpOut)) continue;
    resultSize = fs.statSync(tmpOut).size;
    spinner.text = chalk.cyan(`  [Tier ${i + 1}] Result: ${formatBytes(resultSize)}`);

    // Remove previous temp to save disk space
    if (lastTmpPath && fs.existsSync(lastTmpPath)) {
      try { fs.unlinkSync(lastTmpPath); } catch (_) {}
    }
    lastTmpPath = tmpOut;
    usedTier    = tier;

    if (resultSize <= TARGET_MAX_BYTES) {
      spinner.succeed(chalk.green(`  Target achieved at Tier ${i + 1}!`));
      break;
    }
    if (i === QUALITY_TIERS.length - 1) {
      spinner.warn(chalk.yellow(`  Best effort: ${formatBytes(resultSize)}`));
    }
  }

  if (!lastTmpPath) {
    spinner.fail(chalk.red("  Compression failed. Make sure the video file is valid."));
    return;
  }

  // Move to final destination
  spinner.start(chalk.cyan("  Saving final file..."));
  fs.copyFileSync(lastTmpPath, outputPath);
  try { fs.unlinkSync(lastTmpPath); } catch (_) {}
  spinner.succeed(chalk.green("  Saved!"));

  const finalSize = fs.statSync(outputPath).size;
  printSummary(inputPath, outputPath, originalSize, finalSize, {
    CRF:    String(usedTier.crf),
    Scale:  usedTier.label,
    Format: "MP4 (H.264 + AAC)",
  });
}

module.exports = { compressVideo, supportedExts: [...VIDEO_EXTS] };
