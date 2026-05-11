import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Status = "pending" | "approved" | "flagged";
export type Risk = "low" | "medium" | "high";

export interface ChatMessage {
  role: "user" | "ai";
  message: string;
  timestamp: string;
}

export interface Document {
  id: string;
  name: string;
  fileUrl: string;
  status: Status;
  risk: Risk;
  score: number;
  details: string;
  type?: string;
  date?: string;
  time?: string;
  docId?: string;
  aiReasoning?: string[];
  flaggedReason?: string;
  chatHistory?: ChatMessage[];
  extractedText?: string;
}

interface DocumentStore {
  documents: Document[];
  addDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;

  // Calendar selection for filtering tables
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
}

const today = new Date();
const formattedToday = today.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const formattedYesterday = yesterday.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const formattedTwoDaysAgo = twoDaysAgo.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const initialDocuments: Document[] = [
  {
    id: "1",
    name: "Loan Application - John Doe",
    fileUrl: "/sample.pdf",
    status: "flagged",
    risk: "high",
    score: 85,
    details:
      "Income mismatch detected. Account balance significantly below expected threshold.",
    type: "Loan Application",
    date: formattedToday,
    time: "10:24 AM",
    docId: "#DOC-2024-00123",
    aiReasoning: [
      "Document submitted and parsed successfully",
      "OCR extraction completed with 98% confidence",
      "Income declaration: $4,500/month",
      "Bank statement analysis shows avg monthly deposit: $2,100",
      "⚠️ Income mismatch detected: declared income is 2.1x higher than actual deposits",
      "⚠️ Account balance ($1,240) below loan eligibility threshold ($5,000)",
      "Risk model evaluation complete: High risk (85/100)",
    ],
    flaggedReason:
      "This document was flagged due to a significant income mismatch between the declared amount ($4,500/month) and actual bank deposits ($2,100/month). Additionally, the current account balance is insufficient for the requested loan amount.",
    chatHistory: [],
  },
  {
    id: "2",
    name: "Bank Statement - Apr 2024",
    fileUrl: "/sample.pdf",
    status: "approved",
    risk: "low",
    score: 18,
    details: "All financial indicators are stable.",
    type: "Bank Statement",
    date: formattedYesterday,
    time: "04:15 PM",
    docId: "#DOC-2024-00122",
    aiReasoning: [
      "Document submitted and parsed successfully",
      "OCR extraction completed with 99% confidence",
      "Monthly income consistent across all 6 months",
      "No unusual transactions detected",
      "Average balance maintains healthy buffer above minimum",
      "No overdue payments or negative entries found",
      "Risk model evaluation complete: Low risk (18/100)",
    ],
    chatHistory: [],
  },
  {
    id: "3",
    name: "ID Verification",
    fileUrl: "/sample.pdf",
    status: "pending",
    risk: "medium",
    score: 65,
    details: "Awaiting additional verification document.",
    type: "ID Verification",
    date: formattedTwoDaysAgo,
    time: "02:30 PM",
    docId: "#DOC-2024-00121",
    aiReasoning: [
      "Document submitted and parsed successfully",
      "OCR extraction completed with 87% confidence",
      "Document type: Government-issued ID",
      "Photo quality assessment: Acceptable",
      "⚠️ Expiration date within 90 days",
      "Manual review required for final verification",
      "Risk model evaluation: Pending review (65/100)",
    ],
    chatHistory: [],
  },
];

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      documents: initialDocuments,
      selectedDate: "", // no filter

      addDocument: (doc) =>
        set((state) => ({
          documents: [doc, ...state.documents],
        })),

      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        })),

      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc,
          ),
        })),

      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: "document-storage",
      version: 1,
    },
  ),
);
