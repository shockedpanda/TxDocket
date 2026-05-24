// src/components/FeedbackSection.tsx
export default function FeedbackSection() {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-left space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">💬</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Suggestions & Bug Reports
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Have an idea for a new feature or found something broken? I’d love to hear from you.
          </p>
        </div>
      </div>
      <a
        href="https://github.com/shockedpanda/base-wallet-records/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
      >
        Open an Issue on GitHub
      </a>
    </div>
  );
}