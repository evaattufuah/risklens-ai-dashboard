"use client";

import { useDocumentStore } from "@/app/store/useDocumentStore";
import Link from "next/link";
import { useState } from "react";
import Calendar from "@/app/components/Calendar";
import { useTheme } from "@/app/context/ThemeContext";

export default function DocumentsPage() {
  const documents = useDocumentStore((s) => s.documents);
  const selectedDate = useDocumentStore((s) => s.selectedDate);
  const setSelectedDate = useDocumentStore((s) => s.setSelectedDate);
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [showCalendar, setShowCalendar] = useState(false);

  const toISODate = (value?: string) => {
    if (!value) return "";
    // Examples in store: "May 22, 2024"
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.docId?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    const matchesRisk = filterRisk === "all" || doc.risk === filterRisk;

    const matchesSelectedDate =
      !selectedDate ||
      (doc.date ? toISODate(doc.date) === selectedDate : false);

    return matchesSearch && matchesStatus && matchesRisk && matchesSelectedDate;
  });

  // Helper maps to avoid Tailwind dynamic class purging issues
  const statusStyles = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    flagged: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const riskStyles = {
    low: {
      bar: "bg-emerald-500",
      text: "text-emerald-700",
      accent: "from-emerald-400 to-emerald-600",
    },
    medium: {
      bar: "bg-amber-500",
      text: "text-amber-700",
      accent: "from-amber-400 to-amber-600",
    },
    high: {
      bar: "bg-rose-500",
      text: "text-rose-700",
      accent: "from-rose-400 to-rose-600",
    },
  };

  const statColors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",

    purple: "bg-purple-50 text-purple-700 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Document Library
              </h1>
            </div>
            <p className="text-slate-500 text-sm sm:text-base">
              Manage, review, and track your document analysis pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex-shrink-0"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload Document
            </Link>
          </div>
        </div>
        {/* Unified Filter Toolbar */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl p-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none bg-white text-sm transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-2 flex-1 min-w-[150px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none bg-white text-sm cursor-pointer transition-all appearance-none bg-no-repeat bg-right-3 pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1rem",
              }}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
            </select>

            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none bg-white text-sm cursor-pointer transition-all appearance-none bg-no-repeat bg-right-3 pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1rem",
              }}
            >
              <option value="all">All Risk</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {selectedDate && (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl">
              <svg
                className="w-4 h-4 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium text-indigo-700">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </span>

              <button
                onClick={() => setSelectedDate("")}
                className="ml-1 p-0.5 hover:bg-indigo-100 rounded-full transition-colors"
                title="Clear date filter"
              >
                <svg
                  className="w-3.5 h-3.5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center gap-2 ${
                showCalendar
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )
                : "Date"}
            </button>

            {showCalendar && (
              <div className="absolute right-0 top-full mt-2 z-10 bg-white rounded-2xl border border-slate-200 shadow-lg p-2 w-[280px]">
                <div className="scale-[0.90] origin-top">
                  <Calendar compact />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setSearch("");
              setFilterStatus("all");
              setFilterRisk("all");
              setSelectedDate("");
              setShowCalendar(false);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Clear All
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total",
              count: documents.length,
              color: "indigo" as const,
            },

            {
              label: "Pending",
              count: documents.filter((d) => d.status === "pending").length,
              color: "purple",
            },

            {
              label: "Approved",
              count: documents.filter((d) => d.status === "approved").length,
              color: "emerald",
            },
            {
              label: "Flagged",
              count: documents.filter((d) => d.status === "flagged").length,
              color: "rose",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-white border ${(statColors as Record<string, string>)[stat.color]} rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-80">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
              <svg
                className="w-10 h-10 text-slate-400"
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
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No documents found
            </h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              {search ||
              filterStatus !== "all" ||
              filterRisk !== "all" ||
              selectedDate
                ? "Try adjusting your search terms, filter criteria, or select a different date."
                : "Upload your first document to start analyzing risk and compliance."}
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const risk =
                riskStyles[doc.risk as keyof typeof riskStyles] ||
                riskStyles.medium;
              const status =
                statusStyles[doc.status as keyof typeof statusStyles] ||
                statusStyles.pending;
              const riskPercent = Math.min(100, Math.max(0, doc.score || 0));

              return (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="group block"
                >
                  <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-200/50 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden h-full flex flex-col">
                    {/* Top Accent Gradient */}
                    <div
                      className={`h-1.5 w-full bg-gradient-to-r ${risk.accent}`}
                    />

                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                            <svg
                              className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors"
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
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                              {doc.name}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              {doc.docId}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${status} whitespace-nowrap capitalize`}
                        >
                          {doc.status}
                        </span>
                      </div>

                      {/* Risk Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-medium mb-1.5">
                          <span className="text-slate-500">Risk Score</span>
                          <span className={risk.text}>
                            {doc.score ?? 0}/100
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${risk.bar}`}
                            style={{ width: `${riskPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">
                            Date
                          </span>
                          <span className="font-medium text-slate-700">
                            {doc.date}
                          </span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">
                            Type
                          </span>
                          <span className="font-medium text-slate-700">
                            {doc.type || "Document"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Analyzed recently
                      </span>
                      {/* <span className="text-xs font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View Details
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span> */}
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md">
                        View Details →
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
