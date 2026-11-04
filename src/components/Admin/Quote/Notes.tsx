import React from "react";

interface NotesSectionProps {
  notes?: string;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes }) => {
  if (!notes?.trim()) return null;

  return (
    <section
      aria-label="Technical specifications and commercial terms"
      className="mb-8 rounded-lg border border-blue-100 border-l-4 border-l-blue-900 bg-gray-50 p-5 dark:border-blue-800 dark:border-l-blue-500 dark:bg-gray-700"
    >
      <h3 className="mb-3 text-lg font-semibold text-blue-900 dark:text-blue-400">
        Technical Specifications, Commercial Terms & Notes
      </h3>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-600 dark:text-gray-300">
        {notes}
      </p>
    </section>
  );
};
