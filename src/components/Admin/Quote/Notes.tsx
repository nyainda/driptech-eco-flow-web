import React from "react";

interface NotesSectionProps {
  notes?: string;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes }) => {
  if (!notes) return null;

  return (
    <div className="mb-8 bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border-l-4 border-blue-900 dark:border-blue-500">
      <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-400 text-lg">
        Notes:
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{notes}</p>
    </div>
  );
};
