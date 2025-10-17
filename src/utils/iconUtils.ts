import {
  Home,
  Building,
  Wheat,
  TreePine,
  Factory,
  Leaf,
  Target,
} from "lucide-react";

export const getApplicationIcon = (application: string) => {
  const appLower = application.toLowerCase();
  if (appLower.includes("residential") || appLower.includes("home"))
    return Home;
  if (appLower.includes("commercial") || appLower.includes("office"))
    return Building;
  if (
    appLower.includes("agriculture") ||
    appLower.includes("farm") ||
    appLower.includes("crop")
  )
    return Wheat;
  if (appLower.includes("greenhouse") || appLower.includes("nursery"))
    return TreePine;
  if (appLower.includes("industrial") || appLower.includes("factory"))
    return Factory;
  if (appLower.includes("landscape") || appLower.includes("garden"))
    return Leaf;
  return Target;
};
