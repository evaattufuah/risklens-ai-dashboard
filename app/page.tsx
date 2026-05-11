"use client";

import RecentDocuments from "@/app/dashboard/RecentDocuments";
import { useDocumentStore } from "@/app/store/useDocumentStore";
import { useRouter } from "next/navigation";
import Calendar from "@/app/components/Calendar";
import RiskChart from "@/app/components/RiskChart";
import AIAssistant from "@/app/components/AIAssistant";

export default function Home() {
  const documents = useDocumentStore((s) => s.documents);
  const router = useRouter();

  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const flaggedCount = documents.filter((d) => d.status === "flagged").length;
  const pendingCount = documents.filter((d) => d.status === "pending").length;

  // Calculate additional stats
  const totalDocuments = documents.length;
  const highRiskCount = documents.filter((d) => d.risk === "high").length;
  const mediumRiskCount = documents.filter((d) => d.risk === "medium").length;
  const lowRiskCount = documents.filter((d) => d.risk === "low").length;

  // Calculate average score
  const avgScore =
    documents.length > 0
      ? Math.round(
          documents.reduce((acc, d) => acc + d.score, 0) / documents.length,
        )
      : 0;

  // Get document types
  const docTypes = documents.reduce(
    (acc, doc) => {
      const type = doc.type ?? "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Recent activity (last 5 documents)
  const recentActivity = documents.slice(-5).reverse();

  // Quick actions
  const quickActions = [
    {
      name: "Upload New",
      icon: "📤",
      color: "bg-blue-500",
      action: () => router.push("/upload"),
    },
    {
      name: "Scan Document",
      icon: "📷",
      color: "bg-purple-500",
      action: () => alert("Scan feature coming soon!"),
    },
    {
      name: "Bulk Upload",
      icon: "📦",
      color: "bg-green-500",
      action: () => alert("Bulk upload coming soon!"),
    },
    {
      name: "Generate Report",
      icon: "📊",
      color: "bg-orange-500",
      action: () => alert("Report generation coming soon!"),
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="overflow-hidden whitespace-nowrap" aria-hidden>
          <div className="inline-block animate-marquee">
            🚀 Track uploads, reviews, and AI risk checks in one place —
            Real-time insights powered by AI
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* LEFT SIDE */}
          <div className="xl:col-span-3">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Welcome back 👋
              </h1>

              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Here's what's happening with your documents today
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  title: "APPROVED",
                  value: approvedCount.toLocaleString(),
                  color: "#FBBF24",
                  icon: "✓",
                },
                {
                  title: "FLAGGED",
                  value: flaggedCount.toLocaleString(),
                  color: "#FB923C",
                  icon: "⚠",
                },
                {
                  title: "PENDING",
                  value: pendingCount.toLocaleString(),
                  color: "#67E8F9",
                  icon: "⏳",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 py-5 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 min-h-[170px]"
                >
                  {/* Glow */}
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-indigo-200 uppercase tracking-widest">
                          {card.title}
                        </p>

                        <p className="mt-3 text-5xl font-bold leading-none">
                          {card.value}
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
                        {card.icon}
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-indigo-100 mt-6">
                      <span className="w-2 h-2 rounded-full bg-green-300 mr-2" />
                      Updated just now
                    </div>
                  </div>

                  {/* Wave */}
                  <div className="absolute right-0 top-0 h-full w-28">
                    <svg viewBox="0 0 100 160" className="h-full w-full">
                      <path
                        d="M40,0 C70,0 50,40 70,80 C90,120 60,160 60,160 L100,160 L100,0 Z"
                        fill="#1E1B4B"
                        opacity="0.25"
                      />

                      <path
                        d="M50,0 C80,0 60,40 80,80 C100,120 70,160 70,160 L100,160 L100,0 Z"
                        fill={card.color}
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE - CALENDAR */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-2 sticky top-6 h-80">
            <div className="scale-[0.9] origin-top">
              <Calendar compact />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Risk Distribution
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: "Low Risk",
                  count: lowRiskCount,
                  color: "bg-green-500",
                  percentage: totalDocuments
                    ? (lowRiskCount / totalDocuments) * 100
                    : 0,
                },
                {
                  label: "Medium Risk",
                  count: mediumRiskCount,
                  color: "bg-yellow-500",
                  percentage: totalDocuments
                    ? (mediumRiskCount / totalDocuments) * 100
                    : 0,
                },
                {
                  label: "High Risk",
                  count: highRiskCount,
                  color: "bg-red-500",
                  percentage: totalDocuments
                    ? (highRiskCount / totalDocuments) * 100
                    : 0,
                },
              ].map((risk) => (
                <div key={risk.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{risk.label}</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {risk.count} ({risk.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`${risk.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${risk.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Types */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Document Types
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(docTypes).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">{type}</span>
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full">
                    {count}
                  </span>
                </div>
              ))}
              {Object.keys(docTypes).length === 0 && (
                <p className="text-gray-400 text-sm col-span-2 text-center py-4">
                  No documents yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
          <RecentDocuments />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <RiskChart />
          </div>
          <AIAssistant />
        </div>
      </div>
    </main>
  );
}
