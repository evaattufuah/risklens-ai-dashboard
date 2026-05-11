import { createCanvas } from "canvas";
import path from "path";
import { spawnSync } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  process.cwd(),
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.js",
);

/**
 * Convert every page of a PDF buffer to PNG buffers
 */
export async function pdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  const uint8 = new Uint8Array(pdfBuffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8, disableStream: true })
    .promise;

  console.log("[ocr-utils] PDF loaded, pages:", pdf.numPages);
  const images: Buffer[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );

    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context as any, viewport }).promise;
    const pngBuffer = canvas.toBuffer("image/png");
    console.log(`[ocr-utils] Page ${i} rendered, size:`, pngBuffer.length);
    images.push(pngBuffer);
  }

  return images;
}

/**
 * OCR a single PNG buffer using tesseract.js via a child process.
 * This avoids Next.js worker thread interception issues by using
 * child_process.spawnSync instead of worker_threads.
 */
export async function ocrImageBuffer(
  pngBuffer: Buffer,
  lang = "eng",
): Promise<string> {
  // Create a timeout promise
  return new Promise<string>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("OCR timeout after 15 seconds"));
    }, 15000);

    // Path to the child process script (compiled JS)
    // __dirname in a Next.js API route points to the .next/server directory
    // We need to go up to find the app/api/extract-pdf directory
    const scriptPath = path.join(
      process.cwd(),
      "app",
      "api",
      "extract-pdf",
      "ocr-child.js"
    );

    // Spawn child process for OCR
    const result = spawnSync(
      process.execPath,
      [scriptPath, pngBuffer.toString("base64"), lang],
      {
        timeout: 14000,
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      }
    );

    clearTimeout(timeoutId);

    if (result.status !== 0) {
      const errorMsg = result.stderr || `Child process exited with code ${result.status}`;
      console.error("[ocr-utils] Child process error:", errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    try {
      const output = JSON.parse(result.stdout);
      if (output.error) {
        reject(new Error(output.error));
      } else {
        resolve(output.text || "");
      }
    } catch (err) {
      reject(new Error(`Failed to parse child output: ${result.stdout}`));
    }
  });
}

/**
 * Full pipeline: PDF buffer → OCR all pages → combined text
 */
export async function ocrPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  const images = await pdfToImages(pdfBuffer);
  const pageTexts: string[] = [];

  for (let i = 0; i < images.length; i++) {
    console.log(`[ocr-utils] OCR page ${i + 1}/${images.length}...`);
    const text = await ocrImageBuffer(images[i]);
    console.log(`[ocr-utils] Page ${i + 1} text length:`, text.length);
    if (text.length > 0) pageTexts.push(text);
  }

  return pageTexts.join("\n\n--- Page Break ---\n\n");
}
