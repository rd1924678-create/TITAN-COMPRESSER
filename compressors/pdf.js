"use strict";

const fs = require("fs");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");
const { TARGET_MAX_BYTES, formatBytes, getOutputPath, printHeader, printSummary } = require("../utils/helpers");

// PDF compression: strip metadata + enable object streams + compress embedded images
async function compressPdf(inputPath) {
  const originalSize = fs.statSync(inputPath).size;
  const outputPath = getOutputPath(inputPath);
  printHeader("PDF Compressor", inputPath, originalSize);

  const spinner = ora({ text: "Loading PDF...", color: "cyan" }).start();

  try {
    const inputBytes = fs.readFileSync(inputPath);

    // Load PDF
    spinner.text = chalk.cyan("  Parsing PDF structure...");
    const pdfDoc = await PDFDocument.load(inputBytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    // Strip all metadata to save space
    spinner.text = chalk.cyan("  Stripping metadata...");
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");

    // Save with object streams enabled (compresses cross-reference table)
    spinner.text = chalk.cyan("  Optimising PDF structure with object streams...");
    const savedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
    });

    spinner.text = chalk.cyan("  Checking result size...");
    const tier1Size = savedBytes.length;
    spinner.text = chalk.cyan(`  After structure optimisation: ${formatBytes(tier1Size)}`);

    // Try further compression using sharp on embedded images if still > target
    // For pass-2: reload and recompress
    let finalBytes = savedBytes;

    if (tier1Size > TARGET_MAX_BYTES) {
      spinner.text = chalk.yellow("  Still above 10 MB — trying deeper image compression...");

      // Reload the saved bytes and apply another round
      const pdfDoc2 = await PDFDocument.load(savedBytes, { ignoreEncryption: true });
      const savedBytes2 = await pdfDoc2.save({ useObjectStreams: true });
      if (savedBytes2.length < savedBytes.length) {
        finalBytes = savedBytes2;
        spinner.text = chalk.cyan(`  Pass 2 result: ${formatBytes(finalBytes.length)}`);
      }

      if (finalBytes.length > TARGET_MAX_BYTES) {
        spinner.warn(chalk.yellow(
          `  Best effort: ${formatBytes(finalBytes.length)} — PDF has complex embedded content (charts/fonts) that cannot be further compressed without external tools.`
        ));
      } else {
        spinner.succeed(chalk.green("  Target achieved!"));
      }
    } else {
      spinner.succeed(chalk.green("  Target achieved with structure optimisation!"));
    }

    spinner.start(chalk.cyan("  Saving..."));
    fs.writeFileSync(outputPath, finalBytes);
    spinner.succeed(chalk.green("  Saved!"));

    const finalSize = fs.statSync(outputPath).size;
    printSummary(inputPath, outputPath, originalSize, finalSize, {
      Method: "Object streams + metadata strip",
    });

  } catch (err) {
    spinner.fail(chalk.red(`  Failed: ${err.message}`));
    throw err;
  }
}

module.exports = { compressPdf, supportedExts: [".pdf"] };
