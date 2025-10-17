export const getCategoryColors = (category: string) => {
  const colorMap: Record<string, { bg: string; color: string }> = {
    irrigation_systems: {
      bg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      color: "text-blue-600",
    },
    pumps: {
      bg: "bg-gradient-to-br from-green-500 to-emerald-500",
      color: "text-green-600",
    },
    accessories: {
      bg: "bg-gradient-to-br from-purple-500 to-violet-500",
      color: "text-purple-600",
    },
    fertigation: {
      bg: "bg-gradient-to-br from-orange-500 to-red-500",
      color: "text-orange-600",
    },
    filtration: {
      bg: "bg-gradient-to-br from-indigo-500 to-blue-500",
      color: "text-indigo-600",
    },
    controllers: {
      bg: "bg-gradient-to-br from-teal-500 to-green-500",
      color: "text-teal-600",
    },
  };

  return (
    colorMap[category] || {
      bg: "bg-gradient-to-br from-gray-500 to-slate-500",
      color: "text-gray-600",
    }
  );
};
