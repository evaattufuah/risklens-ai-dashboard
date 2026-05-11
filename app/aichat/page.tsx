"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDocumentStore } from "@/app/store/useDocumentStore";
import { Document, Page } from "react-pdf";
import type {
  ChatMessage,
  Document as Doc,
} from "@/app/store/useDocumentStore";

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function AIChatPage() {
  const documents = useDocumentStore((s) => s.documents);
  const updateDocument = useDocumentStore((s) => s.updateDocument);
  const addDocument = useDocumentStore((s) => s.addDocument); // ADD THIS
  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents[0]?.id ?? "",
  );

  const selectedDoc = useMemo(
    () => documents.find((d) => d.id === selectedDocId) ?? null,
    [documents, selectedDocId],
  );

  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedDocId && documents[0]?.id) setSelectedDocId(documents[0].id);
  }, [documents, selectedDocId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedDoc?.chatHistory]);

  const handleSendMessage = async () => {
    setError(null);
    if (!selectedDoc || !chatInput.trim()) return;

    const now = new Date();
    const timeStr = formatTime(now);

    const userMessage: ChatMessage = {
      role: "user",
      message: chatInput.trim(),
      timestamp: timeStr,
    };

    const updatedChat = [...(selectedDoc.chatHistory || []), userMessage];

    updateDocument(selectedDoc.id, { chatHistory: updatedChat });

    setChatInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.message,
          documentContext: {
            name: selectedDoc.name,
            status: selectedDoc.status,
            risk: selectedDoc.risk,
            score: selectedDoc.score,
            details: selectedDoc.details,
            flaggedReason: selectedDoc.flaggedReason,
            extractedText: selectedDoc.extractedText,
          },
          chatHistory: updatedChat,
        }),
      });

      const data = await response.json();

      const aiTimeStr = formatTime(new Date());

      if (!response.ok || data.error) {
        // fallback
        const aiMessage: ChatMessage = {
          role: "ai",
          message:
            "I couldn’t reach the AI service right now. Please try again. If you uploaded a PDF, make sure it was processed correctly.",
          timestamp: aiTimeStr,
        };
        updateDocument(selectedDoc.id, {
          chatHistory: [...updatedChat, aiMessage],
        });
        setIsTyping(false);
        return;
      }

      const aiMessage: ChatMessage = {
        role: "ai",
        message: data.reply || "No response from AI.",
        timestamp: aiTimeStr,
      };

      updateDocument(selectedDoc.id, {
        chatHistory: [...updatedChat, aiMessage],
      });
    } catch (e) {
      const aiTimeStr = formatTime(new Date());
      updateDocument(selectedDoc.id, {
        chatHistory: [
          ...updatedChat,
          {
            role: "ai",
            message: "Connection error. Please try again later.",
            timestamp: aiTimeStr,
          },
        ],
      });
      setError("Connection error. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleUploadAndSelect = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // This page supports uploading any file type, but AI text extraction is only implemented for PDFs.
      // We keep the file as a data URL so it can be previewed and used as context.
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
      const timeStr = formatTime(now);

      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
      const type = ext === "PDF" ? "PDF Document" : `${ext} Document`;

      const docId = `#DOC-${Date.now().toString(36).toUpperCase()}`;

      // Extract text from PDF for AI context
      let extractedText = "";
      if (ext === "PDF") {
        try {
          const extractRes = await fetch("/api/extract-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileData: dataUrl }),
          });

          if (extractRes.ok) {
            const extractData = await extractRes.json();
            extractedText = extractData.text || "";

            if (!extractData.extractedOk) {
              // scanned/image-based PDFs often return empty text
              extractedText =
                "[No extractable text found in the uploaded PDF. OCR may be required.]";
            }
          } else {
            console.error("/api/extract-pdf failed:", extractRes.status);
          }
        } catch (e) {
          console.error("Failed to extract PDF text:", e);
        }
      }

      // Create document in store first
      const newDoc: Doc = {
        id: Date.now().toString(),
        name: file.name,
        fileUrl: dataUrl,
        status: "pending",
        risk: "low",
        score: 10,
        details: "New document uploaded. Ask the AI about it.",
        type,
        date: dateStr,
        time: timeStr,
        docId,
        chatHistory: [],
        extractedText,
      };

      addDocument(newDoc);

      setSelectedDocId(newDoc.id);

      // PDF text is extracted when ext === "PDF".
      // For scanned/image-based PDFs, extractedText may contain an OCR-needed hint.
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">No documents yet</h1>
          <p className="text-gray-500 mt-2">
            Upload a PDF or any file to start chatting.
          </p>
          <div className="mt-6">
            <label className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold cursor-pointer hover:bg-indigo-700">
              Upload a document
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleUploadAndSelect(e.target.files[0])
                }
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  const selectedStatus = selectedDoc?.status;

  const statusConfig: Record<
    NonNullable<Doc["status"]>,
    {
      label: string;
      bg: string;
      text: string;
      border: string;
      icon: string;
      glow: string;
    }
  > = {
    approved: {
      label: "Approved",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: "✓",
      glow: "shadow-emerald-200/50",
    },
    pending: {
      label: "Pending Review",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: "⏳",
      glow: "shadow-amber-200/50",
    },
    flagged: {
      label: "Flagged",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: "⚠",
      glow: "shadow-rose-200/50",
    },
  };

  const riskConfig: Record<
    NonNullable<Doc["risk"]>,
    { gradient: string; color: string }
  > = {
    low: {
      gradient: "from-emerald-400 to-emerald-600",
      color: "text-emerald-600",
    },
    medium: {
      gradient: "from-amber-400 to-amber-600",
      color: "text-amber-600",
    },
    high: { gradient: "from-rose-400 to-rose-600", color: "text-rose-600" },
  };

  const status = statusConfig[(selectedStatus || "pending") as NonNullable<Doc["status"]>];
  const risk =
    riskConfig[((selectedDoc?.risk || "low") as NonNullable<Doc["risk"]>)];

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              AI Chat
            </h1>
            <p className="text-gray-600 mt-2">
              Chat with any document you upload. Ask the AI to explain risks,
              find issues, or help you solve problems.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-medium text-sm flex items-center gap-2 cursor-pointer">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 8l-4-4-4 4M12 4v12"
                />
              </svg>
              Upload
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadAndSelect(f);
                }}
              />
            </label>

            {uploading && (
              <div className="px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                Processing...
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: selector + preview */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg shadow-gray-900/5 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Document
              </h2>

              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm bg-white"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-600">Risk</div>
                <div
                  className={`px-3 py-1 rounded-full border ${status.border} ${status.bg} ${status.text} text-xs font-semibold`}
                >
                  {status.icon} {status.label}
                </div>
              </div>

              <div className="mt-3">
                <p className={`text-2xl font-bold ${risk.color}`}>
                  {selectedDoc?.risk}
                </p>
                <div className="mt-2 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${risk.gradient} rounded-full`}
                    style={{ width: `${selectedDoc?.score ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: chat */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg shadow-gray-900/5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Chat with Selected Document
                </h2>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                  AI Powered
                </span>
              </div>

              <div className="h-[460px] overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                {(!selectedDoc?.chatHistory ||
                  selectedDoc.chatHistory.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">
                      Ask me anything about this document...
                    </p>
                    <p className="text-gray-300 text-xs mt-1">
                      I can explain risks, flagged items, and help you solve
                      issues.
                    </p>
                  </div>
                )}

                {selectedDoc?.chatHistory?.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
                          : "bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-tl-sm shadow-sm"
                      } px-4 py-3`}
                    >
                      <div className="text-sm leading-relaxed">
                        {msg.message}
                      </div>
                      <p
                        className={`text-xs mt-1 ${msg.role === "user" ? "text-indigo-200" : "text-gray-400"}`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask anything about the document..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl transition-all font-medium text-sm flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-4 py-2 border-b text-sm text-gray-500">
            📄 Preview
          </div>
          <iframe
            src={selectedDoc?.fileUrl}
            className="w-full h-[700px] rounded-2xl border"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
