
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Target, Heart, CheckCircle } from "lucide-react";

const values = [
  {
    icon: Leaf,
    title: "Sustainability",
    description: "We're committed to water conservation and sustainable agriculture practices that protect our environment for future generations."
  },
  {
    icon: Target,
    title: "Innovation",
    description: "Using cutting-edge technology and smart irrigation solutions to maximize efficiency and crop yields while minimizing resource waste."
  },
  {
    icon: Heart,
    title: "Customer Focus",
    description: "Your success is our priority. We provide personalized solutions, ongoing support, and training to ensure optimal system performance."
  },
  {
    icon: CheckCircle,
    title: "Quality Assurance",
    description: "We use only premium components and follow international standards to deliver irrigation systems that stand the test of time."
  }
];

export const ValuesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The principles that guide everything we do and every solution we deliver
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="p-0 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group border-2 hover:border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{value.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
