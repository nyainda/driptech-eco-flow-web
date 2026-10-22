import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
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
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import SEOHead from "@/components/common/SEOHead";
import FAQSection from "@/components/SEO/FAQSection";
import { COMMON_FAQS } from "@/lib/seo-config";
import IrrigationROICalculator from "@/components/Calculators/IrrigationROICalculator";
import ScrollReveal from "@/components/common/ScrollReveal";

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
        "Clear training for operators and maintenance staff.",
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
      <SEOHead
        title="Irrigation Engineering Design & Consultation Kenya | DripTech Eco-Flow"
        description="Irrigation engineering design and consultation in Kenya for drip and sprinkler layouts, water-source and pumping requirements, farm planning, installation and technical support from DripTech Eco-Flow."
        image="https://www.dripstech.co.ke/seed-products/field_drip.jpg"
      />
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs />
      </div>
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              🔧 Professional Services
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Complete Service
              <span className="text-accent"> Portfolio</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              From initial design to ongoing maintenance, we help you keep the
              system working properly through every growing season.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <QuoteModal>
                <Button size="lg">
                  Schedule Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </QuoteModal>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = "/technician-services"}
              >
                Book a Technician
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card
                  key={index}
                  id={service.title.toLowerCase().replaceAll(" ", "-")}
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


        {/* ROI Calculator Section */}
        <section className="py-20 bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4">
            <ScrollReveal animation="slide-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
                  Calculate Your <span className="text-accent">Sustainable Growth</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  See how professional irrigation can transform your farm's productivity and profitability.
                </p>
              </div>
              <IrrigationROICalculator />
            </ScrollReveal>
          </div>
        </section>

        <FAQSection faqs={COMMON_FAQS.services} />
      </main>
      <IrrigationKeywords />

      <Footer />
    </div>
  );
};

export default Services;
