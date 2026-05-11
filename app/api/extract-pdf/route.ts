import { NextRequest, NextResponse } from "next/server";
import { ocrPdfBuffer } from "./ocr-utils";

export const runtime = "nodejs";

/**
 * Extract text from PDF using pdfjs-dist directly (text layer, not images)
 * This is a fallback that works when pdf-parse fails
 */
async function extractTextWithPdfjs(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    const path = require("path");
    
    // Set up the worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "legacy",
      "build",
      "pdf.worker.js"
    );

    const uint8 = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8, disableStream: true }).promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: { str: string }) => item.str)
        .join(" ");
      
      fullText += pageText + "\n";
    }
    
    return fullText.trim();
  } catch (err) {
    console.error("[extract-pdf] pdfjs text extraction failed:", (err as Error).message);
    return "";
  }
}

function extractBase64FromDataUrl(fileData: string): string {
  const parts = fileData.split(",");
  return parts.length > 1 ? parts[1] : "";
}

async function tryPdfParse(buffer: Buffer): Promise<string> {
  try {
    const mod = await import("pdf-parse" as any);
    const pdfParse = mod.default ?? mod;
    if (typeof pdfParse !== "function")
      throw new Error("pdf-parse is not a function");
    const data = await pdfParse(buffer);
    return typeof data.text === "string"
      ? data.text.replace(/\u0000/g, "").trim()
      : "";
  } catch (e) {
    console.error("[extract-pdf] pdf-parse failed:", (e as Error).message);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fileData = body?.fileData;

    if (
      !fileData ||
      typeof fileData !== "string" ||
      !fileData.startsWith("data:")
    ) {
      return NextResponse.json(
        { error: "Invalid or missing fileData" },
        { status: 400 },
      );
    }

    const base64 = extractBase64FromDataUrl(fileData);
    if (!base64 || base64.length < 10) {
      return NextResponse.json(
        { error: "Empty base64 content" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(base64, "base64");
    console.log("[extract-pdf] Buffer size:", buffer.length);

    // Step 1: Try multiple text extraction methods
    let extractedText = "";
    let method = "none";

    // Method 1: pdf-parse (instant for text-based PDFs)
    extractedText = await tryPdfParse(buffer);

    if (extractedText.length >= 50) {
      console.log(
        "[extract-pdf] pdf-parse succeeded, length:",
        extractedText.length,
      );
      method = "pdf-parse";
    } else {
      // Method 2: pdfjs-dist text extraction (works when pdf-parse fails)
      console.log(
        "[extract-pdf] pdf-parse got",
        extractedText.length,
        "chars — trying pdfjs text extraction...",
      );
      extractedText = await extractTextWithPdfjs(buffer);
      
      if (extractedText.length >= 50) {
        console.log(
          "[extract-pdf] pdfjs text extraction succeeded, length:",
          extractedText.length,
        );
        method = "pdfjs-text";
      } else {
        // Step 3: OCR with tesseract.js (for scanned/image PDFs)
        console.log(
          "[extract-pdf] pdfjs got",
          extractedText.length,
          "chars — falling back to OCR...",
        );

      // Set a timeout for the entire OCR operation
      const ocrTimeout = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("OCR operation timed out")), 20000);
      });

        try {
          // Race between OCR and timeout
          extractedText = await Promise.race([
            ocrPdfBuffer(buffer),
            ocrTimeout,
          ]);
          console.log("[extract-pdf] OCR total length:", extractedText.length);
          console.log("[extract-pdf] OCR preview:", extractedText.slice(0, 300));
          if (extractedText.length >= 20) method = "ocr";
        } catch (ocrErr) {
          console.error("[extract-pdf] OCR failed:", ocrErr);
          // Return a successful response with empty text instead of error
          // This allows the upload to proceed even if OCR fails
          return NextResponse.json({
            text: "",
            extractedOk: false,
            method: "none",
            error: (ocrErr as Error).message,
          });
        }
      }
    }

    const extractedOk = extractedText.length > 20;
    console.log(
      `[extract-pdf] Done — method: ${method}, length: ${extractedText.length}`,
    );

    return NextResponse.json({ text: extractedText, extractedOk, method });
  } catch (error: any) {
    console.error("[extract-pdf] Unhandled error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract PDF text",
        details: String(error?.message ?? error),
      },
      { status: 500 },
    );
  }
}
