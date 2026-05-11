"use client";

import { useState } from "react";
import { useDocumentStore } from "@/app/store/useDocumentStore";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const addDocument = useDocumentStore((s) => s.addDocument);
  const updateDocument = useDocumentStore((s) => s.updateDocument);
  const router = useRouter();

  const handleUpload = async () => {
    console.log("clicked upload");

    if (!file) {
      console.log("no file selected");
      alert("Please select a file first");
      return;
    }

    setLoading(true);

    // Convert file to a persistent Base64 data URL so it survives navigation
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const fileExt = file.name.split(".").pop()?.toUpperCase() || "PDF";
    const type = fileExt === "PDF" ? "PDF Document" : `${fileExt} Document`;
    const docId = `#DOC-${Date.now().toString(36).toUpperCase()}`;

    // Extract text from PDF for AI context (with timeout)
    let extractedText = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const extractRes = await fetch("/api/extract-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileData: dataUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (extractRes.ok) {
        const extractData = await extractRes.json();

        console.log("EXTRACT API RESPONSE:", extractData);

        extractedText = extractData.text || "";

        const extractedOk = extractData.extractedOk;

        console.log("PDF extractedOk:", extractedOk);
        console.log("Extracted text length:", extractedText.length);
        console.log("EXTRACTED TEXT:", extractedText);

        if (!extractedOk) {
          extractedText =
            "[No extractable text found in the uploaded PDF. OCR may be required.]";
        }
      } else {
        console.warn("Extract API returned non-ok status:", extractRes.status);
        extractedText =
          "[Document uploaded but text extraction was not successful.]";
      }
    } catch (err) {
      console.error("Failed to extract PDF text:", err);
      extractedText =
        "[Document uploaded but text extraction timed out or failed.]";
    }

    const newDoc = {
      id: Date.now().toString(),
      name: file.name,
      fileUrl: dataUrl,
      status: "pending" as const,
      risk: "low" as const,
      score: 10,
      details: "New document uploaded. Awaiting AI analysis.",
      type,
      date: dateStr,
      time: timeStr,
      docId,
      chatHistory: [],
      extractedText,
    };

    console.log("newDoc:", newDoc);

    addDocument(newDoc);
    console.log("FINAL newDoc:", newDoc);

    // Wait for AI analysis to complete (simulated with 5 second delay)
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        const isFlagged = Math.random() > 0.5;
        if (isFlagged) {
          updateDocument(newDoc.id, {
            status: "flagged",
            risk: "high",
            score: 75 + Math.floor(Math.random() * 20),
            details:
              "Potential risk detected. Income mismatch or suspicious activity identified during automated review.",
            aiReasoning: [
              "Document submitted and parsed successfully",
              "OCR extraction completed with 96% confidence",
              "Cross-referencing applicant data with internal records",
              "⚠️ Inconsistency detected in financial documentation",
              "⚠️ Risk indicators exceed acceptable threshold",
              "Risk model evaluation complete: High risk",
            ],
            flaggedReason:
              "This document was flagged due to potential inconsistencies in the submitted information. Automated analysis detected risk patterns that require human review before approval.",
          });
        } else {
          updateDocument(newDoc.id, {
            status: "approved",
            risk: "low",
            score: Math.floor(Math.random() * 25),
            details:
              "Document verified successfully. All checks passed with no anomalies detected.",
            aiReasoning: [
              "Document submitted and parsed successfully",
              "OCR extraction completed with 99% confidence",
              "All required fields present and valid",
              "Cross-referencing successful: No discrepancies found",
              "Document authenticity verified",
              "Risk model evaluation complete: Low risk",
            ],
          });
        }
        resolve();
      }, 5000);
    });

    console.log("AI analysis complete, navigating to:", `/documents/${newDoc.id}`);

    // Stop the spinner and navigate to document page
    setLoading(false);
    router.push(`/documents/${newDoc.id}`);
  };

  // Drag & drop handlers (visual only - doesn't change logic)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0] || null;
    if (droppedFile) {
      console.log("dropped file:", droppedFile);
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    console.log("selected file:", selected);
    setFile(selected);
  };

  // File icon based on type
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const iconColor =
      {
        pdf: "text-red-500",
        doc: "text-blue-500",
        docx: "text-blue-600",
        txt: "text-gray-500",
        jpg: "text-purple-500",
        jpeg: "text-purple-500",
        png: "text-purple-600",
      }[ext || ""] || "text-indigo-500";

    return (
      <svg
        className={`w-8 h-8 ${iconColor}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <svg
              className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Document
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Securely upload your file for AI-powered analysis
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-xl m-6 transition-all duration-200 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : file
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              }`}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                {file ? (
                  <>
                    <div className="mb-4">{getFileIcon(file.name)}</div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {(file.size / 1024).toFixed(1)} KB • Ready to upload
                    </p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      ✓ File selected
                    </span>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <svg
                        className={`w-12 h-12 mx-auto ${
                          isDragging ? "text-indigo-500 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {isDragging
                        ? "Drop your file here"
                        : "Drag & drop your file"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      or{" "}
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">
                        browse files
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Supports: PDF, DOC, DOCX, TXT, PNG, JPG (max 25MB)
                    </p>
                  </>
                )}
              </label>
          </div>

          {/* Action Bar */}
          <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
            {file && (
              <button
                onClick={() => setFile(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              >
                Change File
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className={`flex-1 px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading || !file
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Upload & Analyze"
              )}
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>End-to-end encrypted • Files processed securely</span>
        </div>
      </div>
    </div>
  );
}
