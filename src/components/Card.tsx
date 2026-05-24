// src/components/Card.tsx
interface CardProps {
  title: string;
  description: string;
  emoji?: string;
}

export default function Card({ title, description, emoji }: CardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-700 text-center">
      {emoji && <span className="text-3xl">{emoji}</span>}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
    </div>
  );
}