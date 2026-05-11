"use client";

interface FormattedMessageProps {
  text: string;
  isUser: boolean;
}

export default function FormattedMessage({
  text,
  isUser,
}: FormattedMessageProps) {
  // Parse markdown-like formatting
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Check for numbered lists (e.g., "1. **Something:**")
        const numberedMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span
                className={`font-bold ${isUser ? "text-indigo-200" : "text-indigo-600"}`}
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

        // Check for **bold** text inline
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

        // Regular line
        return (
          <p key={i} className={isUser ? "text-indigo-100" : "text-gray-600"}>
            {line}
          </p>
        );
      })}
    </div>
  );
}
