import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-6 px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-gray-600 mt-3">
          This page could not be found.
          <br />
          If you expected a document details page, go back to the Documents
          list.
        </p>
      </div>

      <Link
        href="/documents"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
      >
        Back to Documents
      </Link>

      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm transition-all duration-200"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
