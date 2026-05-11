/**
 * Standalone OCR script that runs in a child process to avoid
 * Next.js worker thread interception issues.
 * 
 * Usage: node ocr-child.js <base64_png> <lang>
 * Output: JSON { "text": "...", "error": null }
 */

const { createCanvas, Image } = require("canvas");
const path = require("path");
const fs = require("fs");

// Use require for tesseract.js
const Tesseract = require("tesseract.js");

async function main() {
  const args = process.argv.slice(2);
  const pngBufferBase64 = args[0];
  const lang = args[1] || "eng";

  if (!pngBufferBase64) {
    console.log(JSON.stringify({ text: "", error: "No image data provided" }));
    process.exit(1);
  }

  try {
    const pngBuffer = Buffer.from(pngBufferBase64, "base64");

    // Preprocess image
    const imgCanvas = createCanvas(1, 1);
    const ctx = imgCanvas.getContext("2d");
    if (!ctx) {
      console.log(JSON.stringify({ text: "", error: "Failed to create canvas" }));
      process.exit(1);
    }

    const img = new Image();
    const dataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });

    const w = img.width || 0;
    const h = img.height || 0;

    if (w <= 0 || h <= 0) {
      console.log(JSON.stringify({ text: "", error: null }));
      process.exit(0);
    }

    imgCanvas.width = w;
    imgCanvas.height = h;
    ctx.drawImage(img, 0, 0);

    // Convert to high-contrast grayscale + binary threshold
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;

    let sum = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += y;
    }
    const mean = sum / (d.length / 4);
    const threshold = Math.max(10, Math.min(245, mean * 0.9));

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      const v = y > threshold ? 255 : 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }

    ctx.putImageData(imageData, 0, 0);
    const processedPng = imgCanvas.toBuffer("image/png");

    // Find the traineddata file for tesseract.js
    // The eng.traineddata file is at the project root
    const possibleLangPaths = [
      // Project root (go up from app/api/extract-pdf)
      path.resolve(__dirname, "..", "..", "..", ".."),
      // Also check current working directory
      process.cwd(),
      // Check relative to where node is run
      path.resolve(__dirname, "..", "..", "..", "..", ".."),
    ];

    let langPath = null;
    for (const p of possibleLangPaths) {
      const traineddataPath = path.join(p, `${lang}.traineddata`);
      if (fs.existsSync(traineddataPath)) {
        langPath = p;
        console.error(`[ocr-child] Found language data at: ${langPath}`);
        break;
      }
    }

    if (!langPath) {
      console.error("[ocr-child] Warning: Language data not found locally at:");
      possibleLangPaths.forEach(p => {
        console.error(`  - ${path.join(p, `${lang}.traineddata`)}`);
      });
      console.error("[ocr-child] Using CDN fallback");
    }

    // Run OCR with different configs
    const configs = [
      { tessedit_pageseg_mode: "6" },
      { tessedit_pageseg_mode: "4" },
      { tessedit_pageseg_mode: "11" },
    ];

    let best = "";

    for (const conf of configs) {
      try {
        const options = {
          logger: () => {},
        };
        
        // Set langPath if we found local data
        if (langPath) {
          options.langPath = langPath;
        }

        const result = await Tesseract.recognize(
          processedPng,
          lang,
          options,
          { tessedit_pageseg_mode: conf.tessedit_pageseg_mode }
        );
        const txt = (result.data.text || "").trim();
        console.error(`[ocr-child] OCR result length: ${txt.length}`);
        if (txt.length > best.length) best = txt;
        if (txt.length > 30) break;
      } catch (err) {
        console.error("[ocr-child] OCR config failed:", err);
        continue;
      }
    }

    console.log(JSON.stringify({ text: best, error: null }));
    process.exit(0);
  } catch (err) {
    console.error("[ocr-child] Error:", err);
    console.log(JSON.stringify({ text: "", error: err.message }));
    process.exit(1);
  }
}

main();
