import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  Wrench,
  Settings,
  GraduationCap,
  Users,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import QuoteModal from "@/components/Home/QuoteModal";

const Services = () => {
  const services = [
    {
      icon: PenTool,
      title: "System Design",
      description:
        "Custom irrigation system design tailored to your specific needs and terrain.",
      features: [
        "Site assessment",
        "CAD drawings",
        "Water flow calculations",
        "ROI analysis",
      ],
    },
    {
      icon: Wrench,
      title: "Installation",
      description:
        "Professional installation by certified technicians with quality guarantee.",
      features: [
        "Professional setup",
        "Quality testing",
        "System commissioning",
        "Training included",
      ],
    },
    {
      icon: Settings,
      title: "Maintenance",
      description:
        "Regular maintenance and repair services to keep your system running optimally.",
      features: [
        "Preventive maintenance",
        "Emergency repairs",
        "Component replacement",
        "Performance optimization",
      ],
    },
    {
      icon: GraduationCap,
      title: "Training",
      description:
        "Comprehensive training programs for operators and maintenance staff.",
      features: [
        "Operator training",
        "Maintenance workshops",
        "Technical support",
        "Certification programs",
      ],
    },
    {
      icon: Users,
      title: "Consultation",
      description:
        "Expert consultation for system optimization and efficiency improvements.",
      features: [
        "System analysis",
        "Efficiency audits",
        "Upgrade recommendations",
        "Cost optimization",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              🔧 Professional Services
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Complete Service
              <span className="text-primary"> Portfolio</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              From initial design to ongoing maintenance, we provide
              comprehensive irrigation services to ensure your system performs
              at its best.
            </p>
            <QuoteModal>
              <Button size="lg" className="mr-4">
                Schedule Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </QuoteModal>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <CardContent className="p-8">
                    <div className="p-3 bg-primary/10 rounded-xl inline-block mb-6">
                      <service.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                    <p className="text-muted-foreground mb-6">
                      {service.description}
                    </p>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <QuoteModal>
                        <Button
                          variant="outline"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                        >
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </QuoteModal>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
