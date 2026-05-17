import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function extractTextWithPdfjs(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

    const isVercel = !!process.env.VERCEL;

    if (isVercel) {
      // Vercel: disable worker entirely, run in-process
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    } else {
      // Local: use the bundled worker file
      const path = require("path");
      pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
        process.cwd(),
        "node_modules",
        "pdfjs-dist",
        "legacy",
        "build",
        "pdf.worker.js",
      );
    }

    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      disableStream: true,
      disableWorker: true, // safe for both environments
      useSystemFonts: true, // suppresses FoxitSans warnings
    });

    const pdf = await loadingTask.promise;
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
    console.error(
      "[extract-pdf] pdfjs text extraction failed:",
      (err as Error).message,
    );
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

    let extractedText = "";
    let method = "none";

    // Method 1: pdf-parse
    extractedText = await tryPdfParse(buffer);
    if (extractedText.length >= 50) {
      console.log(
        "[extract-pdf] pdf-parse succeeded, length:",
        extractedText.length,
      );
      method = "pdf-parse";
    } else {
      // Method 2: pdfjs with disableWorker:true (works local + Vercel)
      console.log(
        "[extract-pdf] pdf-parse got",
        extractedText.length,
        "chars — trying pdfjs...",
      );
      extractedText = await extractTextWithPdfjs(buffer);

      if (extractedText.length >= 50) {
        console.log(
          "[extract-pdf] pdfjs succeeded, length:",
          extractedText.length,
        );
        method = "pdfjs-text";
      } else {
        // Method 3: OCR — only attempt locally (Vercel has no canvas support)
        const isVercel = !!process.env.VERCEL;
        if (!isVercel) {
          console.log("[extract-pdf] trying OCR locally...");
          try {
            const { ocrPdfBuffer } = await import("./ocr-utils");
            const ocrTimeout = new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error("OCR timed out")), 20000),
            );
            extractedText = await Promise.race([
              ocrPdfBuffer(buffer),
              ocrTimeout,
            ]);
            console.log("[extract-pdf] OCR length:", extractedText.length);
            if (extractedText.length >= 20) method = "ocr";
          } catch (ocrErr) {
            console.error("[extract-pdf] OCR failed:", ocrErr);
          }
        } else {
          console.log(
            "[extract-pdf] Vercel: skipping OCR (canvas not supported)",
          );
        }

        if (extractedText.length < 20) {
          return NextResponse.json({
            text: "",
            extractedOk: false,
            method: "none",
            error:
              "Could not extract text from this PDF. It may be image-based.",
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
