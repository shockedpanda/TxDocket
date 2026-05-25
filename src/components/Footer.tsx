// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 py-6 text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
      <p>
        TxDocket – Clean transaction schedules for EVM wallets. Free forever. Not financial, tax, or legal advice.
      </p>
      <p>
        <a
          href="https://github.com/shockedpanda/base-wallet-records"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          GitHub
        </a>
        {" "}·{" "}
        <a
          href="https://txdocket.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          Live Site
        </a>
        {" "}·{" "}
        <a
          href="https://github.com/shockedpanda/base-wallet-records/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          Feedback
        </a>
      </p>
    </footer>
  );
}