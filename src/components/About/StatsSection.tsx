import { Card, CardContent } from "@/components/ui/card";
import { Users, Droplets, Globe, Award } from "lucide-react";

const stats = [
  { icon: Users, label: "Happy Customers", value: "150+" },
  { icon: Droplets, label: "Water Saved", value: "500K+ Liters" },
  { icon: Globe, label: "Projects Completed", value: "75+" },
  { icon: Award, label: "Years Experience", value: "2+" },
];

export const StatsSection = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="text-center group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20"
        >
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <stat.icon className="h-8 w-8 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="text-muted-foreground text-sm">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
