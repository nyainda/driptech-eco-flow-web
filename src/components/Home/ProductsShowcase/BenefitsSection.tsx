import { Card, CardContent } from "@/components/ui/card";
import { Zap, Leaf, Shield } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "50% Energy Savings",
    description: "Reduce operational costs with our energy-efficient systems",
    stat: "50%",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Leaf,
    title: "40% Water Conservation",
    description: "Minimize water waste while maximizing crop yields",
    stat: "40%",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "10-Year Warranty",
    description: "Industry-leading warranty on all premium products",
    stat: "10Y",
    gradient: "from-blue-500 to-indigo-500",
  },
];

export const BenefitsSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {benefits.map((benefit, index) => (
        <Card
          key={index}
          className="text-center group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20"
        >
          <CardContent className="p-8">
            <div
              className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
            >
              <benefit.icon className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {benefit.stat}
            </div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
              {benefit.title}
            </h3>
            <p className="text-muted-foreground">{benefit.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
