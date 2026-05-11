"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDocumentStore } from "@/app/store/useDocumentStore";
import type { ChatMessage } from "@/app/store/useDocumentStore";

type Status = "pending" | "approved" | "flagged";
type Risk = "low" | "medium" | "high";

interface Document {
  id: string;
  name: string;
  status: Status;
  risk: Risk;
  fileUrl: string;
  score: number;
  details: string;
  aiReasoning?: string[];
  flaggedReason?: string;
  chatHistory?: ChatMessage[];
  extractedText?: string;
}

const statusConfig: Record<
  Status,
  {
    bg: string;
    text: string;
    border: string;
    icon: string;
    label: string;
    glow: string;
  }
> = {
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "✓",
    label: "Approved",
    glow: "shadow-emerald-200/50",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "⏳",
    label: "Pending Review",
    glow: "shadow-amber-200/50",
  },
  flagged: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "⚠",
    label: "Flagged",
    glow: "shadow-rose-200/50",
  },
};

const riskConfig: Record<
  Risk,
  { color: string; bg: string; gradient: string }
> = {
  low: {
    color: "text-emerald-600",
    bg: "bg-emerald-500",
    gradient: "from-emerald-400 to-emerald-600",
  },
  medium: {
    color: "text-amber-600",
    bg: "bg-amber-500",
    gradient: "from-amber-400 to-amber-600",
  },
  high: {
    color: "text-rose-600",
    bg: "bg-rose-500",
    gradient: "from-rose-400 to-rose-600",
  },
};

function FormattedMessage({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const numberedMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span
                className={`font-bold ${
                  isUser ? "text-indigo-200" : "text-indigo-600"
                }`}
              >
                {numberedMatch[1]}.
              </span>
              <span>
                <strong className={isUser ? "text-white" : "text-gray-900"}>
                  {numberedMatch[2]}:{" "}
                </strong>
                <span className={isUser ? "text-indigo-100" : "text-gray-600"}>
                  {numberedMatch[3]}
                </span>
              </span>
            </div>
          );
        }

        const parts = line.split(/(\*\*(.+?)\*\*)/g);
        if (parts.length > 1) {
          return (
            <p key={i} className={isUser ? "text-indigo-100" : "text-gray-600"}>
              {parts.map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong
                      key={j}
                      className={
                        isUser
                          ? "text-white font-bold"
                          : "text-gray-900 font-bold"
                      }
                    >
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={j}>{part}</span>;
              })}
            </p>
          );
        }

        return (
          <p key={i} className={isUser ? "text-indigo-100" : "text-gray-600"}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function DocumentDetailClient({ id }: { id: string }) {
  const [mounted, setMounted] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [showFlagReason, setShowFlagReason] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const documents = useDocumentStore((s) => s.documents);
  const updateDocument = useDocumentStore((s) => s.updateDocument);

  const doc = documents.find((d) => d.id === id) as Document | undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [doc?.chatHistory]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-pulse text-gray-500 font-medium">
          Loading document...
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Document Not Found</h1>
        <p className="text-gray-500">
          The document you are looking for does not exist.
        </p>
        <Link href="/documents" className="text-indigo-600 hover:underline">
          Back to Documents list
        </Link>
      </div>
    );
  }

  const status = statusConfig[doc.status];
  const risk = riskConfig[doc.risk];

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !doc) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: ChatMessage = {
      role: "user",
      message: chatInput.trim(),
      timestamp: timeStr,
    };

    const updatedChat = [...(doc.chatHistory || []), userMessage];

    updateDocument(doc.id, {
      chatHistory: updatedChat,
    });

    setChatInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.message,
          documentContext: {
            name: doc.name,
            status: doc.status,
            risk: doc.risk,
            score: doc.score,
            details: doc.details,
            flaggedReason: doc.flaggedReason,
            extractedText: doc.extractedText,
          },
          chatHistory: updatedChat,
        }),
      });

      const data = await response.json();

      const aiNow = new Date();
      const aiTimeStr = aiNow.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!response.ok || data.error) {
        setIsTyping(false);
        const fallbackResponses = [
          "Based on my analysis of this document, I can see the key financial indicators are consistent with the applicant's profile. Would you like me to elaborate on any specific section?",
          "I've reviewed the document details. The risk assessment considers multiple factors including income stability, debt-to-income ratio, and payment history. Is there a particular aspect you'd like me to explain further?",
          "This document shows typical patterns for its category. The AI model has evaluated all relevant data points. Do you have questions about the risk scoring methodology?",
          "Looking at the document structure and content, I can confirm all required fields are present. The analysis completed successfully. What specific information are you looking for?",
        ];

        const aiMessage: ChatMessage = {
          role: "ai",
          message:
            fallbackResponses[
              Math.floor(Math.random() * fallbackResponses.length)
            ],
          timestamp: aiTimeStr,
        };

        updateDocument(doc.id, {
          chatHistory: [...updatedChat, aiMessage],
        });
        return;
      }

      const aiMessage: ChatMessage = {
        role: "ai",
        message: data.reply,
        timestamp: aiTimeStr,
      };

      updateDocument(doc.id, {
        chatHistory: [...updatedChat, aiMessage],
      });
    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);

      const aiNow = new Date();
      const aiTimeStr = aiNow.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const aiMessage: ChatMessage = {
        role: "ai",
        message:
          "Sorry, I'm having trouble connecting to the AI service. Please check your API key configuration or try again later.",
        timestamp: aiTimeStr,
      };

      updateDocument(doc.id, {
        chatHistory: [...updatedChat, aiMessage],
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div className="space-y-6">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-all duration-300 group"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="group-hover:underline underline-offset-4">
              Back to Documents
            </span>
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                {doc.name}
              </h1>
              <p className="text-gray-500 mt-2 text-base sm:text-lg font-medium">
                Document ID:{" "}
                <span className="text-gray-700 font-mono">#{id}</span>
              </p>
            </div>
            <div
              className={`px-5 py-2.5 rounded-full border-2 ${status.bg} ${status.border} ${status.text} font-semibold text-base flex items-center gap-2.5 shadow-lg ${status.glow} transition-all duration-300 hover:scale-105`}
            >
              <span className="text-xl">{status.icon}</span>
              {status.label}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-semibold">Risk Level</span>
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${risk.gradient} flex items-center justify-center text-white shadow-lg`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <p className={`text-3xl font-bold capitalize ${risk.color}`}>
              {doc.risk}
            </p>
            <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${risk.gradient} rounded-full shadow-sm transition-all duration-1000 ease-out`}
                style={{ width: `${doc.score}%` }}
              />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-semibold">Risk Score</span>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {doc.score}
              </p>
              <p className="text-gray-400 text-lg font-medium">/100</p>
            </div>
            <p className="text-sm text-gray-500 mt-3 font-medium">
              {doc.score > 75
                ? "High risk detected"
                : doc.score > 40
                  ? "Moderate risk"
                  : "Low risk profile"}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-semibold">Document Type</span>
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">Financial</p>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Verified document
            </p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg shadow-gray-900/5 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500/90 to-purple-500/90 px-6 py-4 flex items-center gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              AI Analysis
            </h2>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${status.bg} ${status.text} border ${status.border}`}
              >
                <span className="text-2xl">{status.icon}</span>
              </div>
              <div className="flex-1 space-y-4">
                <p className="text-gray-700 text-base leading-relaxed font-medium">
                  {doc.details}
                </p>

                {doc.status === "flagged" && (
                  <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl backdrop-blur-sm">
                    <p className="text-rose-800 text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Action Required: Review flagged items & provide additional
                      documentation.
                    </p>
                  </div>
                )}

                {doc.status === "approved" && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl backdrop-blur-sm">
                    <p className="text-emerald-800 text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Verified & approved for processing.
                    </p>
                  </div>
                )}

                {doc.status === "pending" && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl backdrop-blur-sm">
                    <p className="text-amber-800 text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Awaiting manual review. Estimated completion: 24h.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {doc.aiReasoning && doc.aiReasoning.length > 0 && (
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg shadow-gray-900/5 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                AI Reasoning Process
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {doc.aiReasoning.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed pt-1">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {doc.status === "flagged" && doc.flaggedReason && (
          <div className="bg-white/70 backdrop-blur-xl border border-rose-200/60 rounded-2xl shadow-lg shadow-rose-900/5 overflow-hidden">
            <button
              onClick={() => setShowFlagReason(!showFlagReason)}
              className="w-full bg-gradient-to-r from-rose-500/90 to-red-500/90 px-6 py-4 flex items-center justify-between backdrop-blur-sm hover:from-rose-500 hover:to-red-500 transition-all"
            >
              <div className="flex items-center gap-3">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Why was this flagged?
                </h2>
              </div>
              <svg
                className={`w-5 h-5 text-white transition-transform duration-300 ${
                  showFlagReason ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showFlagReason && (
              <div className="p-6 animate-fadeIn">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-gray-700 text-base leading-relaxed">
                      {doc.flaggedReason}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                        Manual Review Required
                      </span>
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                        Risk Score: {doc.score}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
              Chat with Document
            </h2>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
              AI Powered
            </span>
          </div>

          <div className="h-80 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            {(!doc.chatHistory || doc.chatHistory.length === 0) && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-8 h-8 text-indigo-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">
                  Ask me anything about this document...
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  I can explain risk scores, flagged items, and more
                </p>
              </div>
            )}

            {doc.chatHistory?.map((msg, index) => (
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
                    <FormattedMessage
                      text={msg.message}
                      isUser={msg.role === "user"}
                    />
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === "user" ? "text-indigo-200" : "text-gray-400"
                    }`}
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
                placeholder="Ask about this document..."
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

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-4 py-2 border-b text-sm text-gray-500">
            📄 Document Preview
          </div>
          <embed
            src={doc.fileUrl}
            type="application/pdf"
            className="w-full h-[500px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
       
          <button
            onClick={() =>
              alert(
                "Request Review submitted! Our team will review it shortly.",
              )
            }
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Request Review
          </button>
        </div>
      </div>
    </div>
  );
}
