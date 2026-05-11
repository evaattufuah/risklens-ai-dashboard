"use client";

import { useState } from "react";
import ReactCalendar from "react-calendar";
import "./../css/calendar.css";

import { useDocumentStore } from "@/app/store/useDocumentStore";

export default function Calendar({ compact = false }: { compact?: boolean }) {
  const setSelectedDate = useDocumentStore((s) => s.setSelectedDate);

  const [date, setDate] = useState(new Date());

  // Keep existing tile styling logic (no hover props; react-calendar typing may not expose them)
  const tileClassName = ({
    date: tileDate,
    view,
  }: {
    date: Date;
    view: string;
  }) => {
    if (view === "month") {
      if (tileDate.toDateString() === new Date().toDateString()) {
        return "today-highlight";
      }

      // In your previous version this condition was incorrect (always true). Preserve intended behavior:
      // highlight the currently selected day.
      if (tileDate.toDateString() === date.toDateString()) {
        return "selected-highlight";
      }
    }

    return undefined;
  };

  return (
    <div
      className={
        compact
          ? "w-full h-full flex items-stretch justify-center p-0"
          : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4"
      }
    >
      <div
        className={
          compact
            ? "w-full h-full bg-transparent p-2 animate-fade-in"
            : "bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/50 animate-fade-in"
        }
      >
        {!compact && (
          <div className="flex items-center gap-2 mb-6 animate-slide-down">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Calendar
            </h2>
          </div>
        )}

        <div
          className={
            compact
              ? "compact-calendar calendar-wrapper relative overflow-hidden rounded-2xl h-full"
              : "calendar-wrapper relative overflow-hidden rounded-2xl"
          }
        >
          <ReactCalendar
            value={date}
            onChange={(value) => setDate(value as Date)}
            onClickDay={(value) => {
              // Keep Calendar UI look unchanged; only update shared selection for filtering tables
              setDate(value as Date);
              // YYYY-MM-DD
              const d = value as Date;
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              // setSelectedDate is wired via store import below
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              setSelectedDate(`${y}-${m}-${day}`);
            }}
            tileClassName={tileClassName}
            formatDay={(locale, day) => day.getDate().toString()}
            prevLabel={
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            }
            nextLabel={
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            }
            prev2Label={null}
            next2Label={null}
          />
        </div>

        {!compact && (
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 animate-fade-in-up">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-indigo-600">Selected:</span>{" "}
              <span className="font-mono text-gray-800 animate-pulse-once">
                {date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
            <div className="mt-2 flex gap-2">
              <span className="text-xs px-2 py-1 bg-white/60 rounded-full text-gray-600 border border-gray-200">
                Week {getWeekNumber(date)}
              </span>
              <span className="text-xs px-2 py-1 bg-white/60 rounded-full text-gray-600 border border-gray-200">
                {isWeekend(date) ? "Weekend" : "Weekday"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}
