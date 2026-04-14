export const getCategoryColors = (category: string) => {
  const colorMap: Record<string, { bg: string; color: string }> = {
    drip_irrigation: {
      bg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      color: "text-blue-600",
    },
    sprinkler_systems: {
      bg: "bg-gradient-to-br from-sky-500 to-blue-500",
      color: "text-sky-600",
    },
    filtration_systems: {
      bg: "bg-gradient-to-br from-indigo-500 to-blue-500",
      color: "text-indigo-600",
    },
    control_systems: {
      bg: "bg-gradient-to-br from-teal-500 to-green-500",
      color: "text-teal-600",
    },
    pumps_motors: {
      bg: "bg-gradient-to-br from-green-500 to-emerald-500",
      color: "text-green-600",
    },
    pipes_fittings: {
      bg: "bg-gradient-to-br from-slate-500 to-gray-600",
      color: "text-slate-600",
    },
    solar_irrigation: {
      bg: "bg-gradient-to-br from-yellow-400 to-orange-500",
      color: "text-yellow-600",
    },
    fertigation_systems: {
      bg: "bg-gradient-to-br from-orange-500 to-red-500",
      color: "text-orange-600",
    },
    greenhouse_systems: {
      bg: "bg-gradient-to-br from-lime-500 to-green-500",
      color: "text-lime-600",
    },
    emitters_drippers: {
      bg: "bg-gradient-to-br from-cyan-500 to-blue-400",
      color: "text-cyan-600",
    },
    valves_regulators: {
      bg: "bg-gradient-to-br from-red-500 to-rose-500",
      color: "text-red-600",
    },
    water_storage: {
      bg: "bg-gradient-to-br from-blue-600 to-indigo-600",
      color: "text-blue-700",
    },
    rain_guns: {
      bg: "bg-gradient-to-br from-violet-500 to-purple-600",
      color: "text-violet-600",
    },
    accessories: {
      bg: "bg-gradient-to-br from-purple-500 to-violet-500",
      color: "text-purple-600",
    },
    irrigation_systems: {
      bg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      color: "text-blue-600",
    },
    pumps: {
      bg: "bg-gradient-to-br from-green-500 to-emerald-500",
      color: "text-green-600",
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
