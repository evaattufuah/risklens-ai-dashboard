"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full group relative block px-4 py-3 rounded-xl overflow-hidden transition-all duration-300"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <div className="absolute inset-0 bg-gray-800 rounded-xl"></div>
      <span className="relative z-10 text-white font-medium flex items-center">
        <span aria-hidden className="mr-1">
          {theme === "light" ? "🌙" : "☀️"}
        </span>
        {theme === "light" ? "Dark Mode" : "Light Mode"}
      </span>
    </button>
  );
}

function Sidebar() {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/", emoji: "🏠" },
    { label: "Upload", href: "/upload", emoji: "⬆️" },
    { label: "Documents", href: "/documents", emoji: "📁" },
    { label: "AIChat", href: "/aichat", emoji: "🤖" },
  ];

  return (
    <aside className="w-64 h-screen bg-gray-900 dark:bg-slate-900 text-white relative overflow-hidden sticky top-0 flex-shrink-0">
      <h2 className="flex items-center gap-2 text-xl font-bold mb-6 tracking-wide text-white px-4 pt-4">
        <span aria-hidden className="text-base">
          <Image
            src="/data.png"
            alt="RiskLens AI Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
        </span>
        RiskLens <span className="text-amber-600">AI</span>
      </h2>

      <nav className="space-y-4 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <a
              key={link.href}
              href={link.href}
              className="group relative block px-4 py-3 rounded-xl overflow-hidden transition-all duration-300"
            >
              {/* Background layer (base) */}
              <div className="absolute inset-0 bg-gray-800 rounded-xl"></div>

              <div
                className={`
                  absolute -top-12 -left-12 w-48 h-44
                  bg-red-500 rounded-full border-gray-200 border-2
                  opacity-0 scale-75
                  group-hover:opacity-100 group-hover:scale-100
                  ${isActive ? "opacity-100 scale-100" : ""}
                  transition-all duration-500 ease-out
                `}
              ></div>

              <div
                className={`
                  absolute -bottom-16 -right-16 w-[160px] h-44
                  bg-indigo-900 rounded-full
                  opacity-0 scale-75
                  group-hover:opacity-100 group-hover:scale-100
                  ${isActive ? "opacity-100 scale-100" : ""}
                  transition-all duration-500 ease-out
                `}
              ></div>

              <span className="relative z-10 text-white font-medium flex items-center">
                <span aria-hidden className="mr-1">
                  {link.emoji}
                </span>
                {link.label}
              </span>
            </a>
          );
        })}

        {/* <ThemeToggle /> */}
      </nav>

      {/* Decorative wave at bottom */}
      <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0">
        <svg
          viewBox="0 0 256 60"
          className="w-full h-16"
          preserveAspectRatio="none"
        >
          <path d="M0,0 Q128,20 256,50 L256,60 L0,60 Z" fill="#f3f4f6" className="dark:fill-slate-800" />
          <path
            d="M0,0 Q128,20 256,50"
            fill="none"
            stroke="#1E3A8A"
            strokeWidth="6"
          />
        </svg>
      </div>
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen bg-gray-100 dark:bg-slate-800" suppressHydrationWarning>
        <ThemeProvider>
          <Sidebar />
          <main className="flex-1 p-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}