"use client";

import {
  LineChart,
  Line,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { day: "Mon", risk: 10 },
  { day: "Tue", risk: 20 },
  { day: "Wed", risk: 18 },
  { day: "Thu", risk: 35 },
  { day: "Fri", risk: 28 },
  { day: "Sat", risk: 24 },
  { day: "Sun", risk: 40 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 backdrop-blur-sm">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Risk: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export default function RiskChart() {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-800 rounded-3xl p-6 shadow-xl shadow-indigo-100/50 dark:shadow-none border border-gray-100/80 dark:border-slate-700">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-800 dark:text-white">
              AI Risk Distribution
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Weekly vulnerability analysis
            </p>
          </div>
        </div>
        <span className="px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800">
          This Week
        </span>
      </div>

      <div className="h-64 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            {/* Area Gradient Fill */}
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Axes */}
            <XAxis
              dataKey="day"
              tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />

            {/* Tooltip & Cursor */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#E5E7EB",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Area Fill */}
            <Area
              type="monotone"
              dataKey="risk"
              stroke="none"
              fill="url(#riskGradient)"
            />

            {/* Line & Dots */}
            <Line
              type="monotone"
              dataKey="risk"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ r: 4, fill: "#ffffff", stroke: "#6366F1", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#ffffff",
                stroke: "#6366F1",
                strokeWidth: 3,
                filter: "drop-shadow(0 0 6px rgba(99, 102, 241, 0.5))",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
