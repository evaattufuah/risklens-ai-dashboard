"use client";

import { useState } from "react";
import Link from "next/link";
import { useDocumentStore } from "@/app/store/useDocumentStore";

export default function AIAssistant() {
  const [isHovered, setIsHovered] = useState(false);

  const documents = useDocumentStore((s) => s.documents);
  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const flaggedCount = documents.filter((d) => d.status === "flagged").length;
  const pendingCount = documents.filter((d) => d.status === "pending").length;

  // totalDocuments is used for future calculations; keep UI fully dynamic
  const totalDocuments = documents.length;

  return (
    <div className="relative group">
      {/* Ambient glow background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>

      <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-700 shadow-xl shadow-indigo-100/40 dark:shadow-none overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl text-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                🤖
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Assistant
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800 tracking-wide">
                  ONLINE
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Analyzing in real-time
                </span>
              </div>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50/80 dark:bg-emerald-900/20 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-800 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {approvedCount}
              </p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 uppercase tracking-wider font-medium">
                Approved
              </p>
            </div>
            <div className="bg-red-50/80 dark:bg-red-900/20 rounded-xl p-3 text-center border border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700 transition-colors">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{flaggedCount}</p>
              <p className="text-[10px] text-red-500 dark:text-red-400 uppercase tracking-wider font-medium">
                Flagged
              </p>
            </div>

            <div className=" bg-amber-50/80 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-200 dark:border-amber-800 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
              <p className="text-[10px] text-amber-400 dark:text-amber-300 uppercase tracking-wider font-medium">
                Pending
              </p>
            </div>
          </div>
          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            I've analyzed your document pipeline. Critical vulnerabilities
            detected in{" "}
            <span className="font-semibold text-red-500 dark:text-red-400">{flaggedCount}</span>{" "}
            flagged files. Ready to generate detailed reports or suggest
            automated fixes.
          </p>
          {/* CTA Button */}
          <Link href="/aichat">
            <button
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3.5 rounded-2xl font-semibold shadow-lg shadow-indigo-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Chat with AI
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isHovered ? "translate-x-1" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </span>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
