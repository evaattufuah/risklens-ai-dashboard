"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDocumentStore } from "@/app/store/useDocumentStore";

type Status = "approved" | "pending" | "flagged";
type Risk = "low" | "medium" | "high";

const statusStyles: Record<Status, string> = {
  approved: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  flagged: "bg-red-50 text-red-600",
};

const riskStyles: Record<Risk, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-red-600",
};

export default function RecentDocuments() {
  const router = useRouter();

  const documents = useDocumentStore((s) => s.documents);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // only show 10 documents per page
  const paginatedDocuments = documents.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="bg-gray-900 dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Recent Documents</h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage and review your uploaded documents
          </p>
        </div>

        <button className="px-4 py-2 text-sm font-medium text-indigo-400 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
          View all →
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-700 dark:to-slate-700/50 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">Document</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Risk Score</div>

            {/* Added delete column without changing UI */}
            <div className="col-span-1 text-center">Delete</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {paginatedDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
              className="group px-6 py-5 hover:bg-gradient-to-r hover:from-indigo-50/30 dark:hover:from-indigo-900/20 hover:to-transparent transition-all duration-200 cursor-pointer"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Document Info */}
                <div className="col-span-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                      <svg
                        className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
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

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {doc.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {doc.docId || `#DOC-${doc.id}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium border border-indigo-100 dark:border-indigo-800">
                    {doc.type || "Document"}
                  </span>
                </div>

                {/* Date */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.date || "—"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{doc.time || ""}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                      doc.status === "approved"
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : doc.status === "flagged"
                          ? "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                          : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        doc.status === "approved"
                          ? "bg-emerald-500"
                          : doc.status === "flagged"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                      }`}
                    />
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                </div>

                {/* Risk Score */}
                <div className="col-span-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {doc.score}/100
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDocument(doc.id);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition-all"
                  >
                    <svg
                      className="w-5 h-5 text-red-500 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1} -{" "}
            {Math.min(startIndex + itemsPerPage, documents.length)} of{" "}
            {documents.length} documents
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
