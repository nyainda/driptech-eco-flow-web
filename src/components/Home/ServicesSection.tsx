
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VideoSection from "./VideoSection";
import { 
  Droplets, 
  Settings, 
  Wrench, 
  GraduationCap, 
  LineChart,
  Shield,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const ServicesSection = () => {
  const services = [
    {
      icon: Droplets,
      title: "System Design & Planning",
      description: "Custom irrigation system design tailored to your specific crop, terrain, and water requirements.",
      features: ["Site assessment & soil analysis", "CAD drawings & blueprints", "Water flow calculations", "ROI projections"],
      popular: true
    },
    {
      icon: Wrench,
      title: "Professional Installation",
      description: "Expert installation by certified technicians with comprehensive testing and commissioning.",
      features: ["Professional setup", "Quality testing", "System commissioning", "User training included"],
      popular: false
    },
    {
      icon: Settings,
      title: "Maintenance & Support",
      description: "Regular maintenance services and 24/7 technical support to ensure optimal system performance.",
      features: ["Preventive maintenance", "Emergency repairs", "Component replacement", "Performance optimization"],
      popular: false
    },
    {
      icon: LineChart,
      title: "Smart Monitoring",
      description: "IoT-enabled monitoring systems with real-time data analytics and automated controls.",
      features: ["Real-time monitoring", "Mobile app control", "Weather integration", "Usage analytics"],
      popular: true
    },
    {
      icon: GraduationCap,
      title: "Training & Consultation",
      description: "Comprehensive training programs and expert consultation for optimal system operation.",
      features: ["Operator training", "Best practices", "Troubleshooting", "Efficiency optimization"],
      popular: false
    },
    {
      icon: Shield,
      title: "Warranty & Guarantee",
      description: "Extended warranty coverage and performance guarantees for complete peace of mind.",
      features: ["12-month warranty", "Performance guarantee", "Free service visits", "Parts replacement"],
      popular: false
    }
  ];

  const benefits = [
    "Increase crop yield by 30-50%",
    "Reduce water consumption by 40-60%",
    "Lower labor costs significantly",
    "Improve crop quality and consistency",
    "Reduce fertilizer waste through precision application",
    "Monitor and control remotely via mobile app"
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              <Droplets className="w-4 h-4 mr-2" />
              Our Services
            </Badge>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
            Complete 
            <span className="block bg-gradient-to-r from-emerald-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Irrigation Solutions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            From initial consultation to ongoing maintenance, we provide end-to-end irrigation services 
            that ensure your system performs at its peak efficiency.
          </p>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-left">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                service.popular ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              {service.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-primary to-green-600 text-white">
                    Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                  <service.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                <CardDescription className="text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all" 
                  asChild
                >
                  <Link to="/services">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process Section */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Our Proven Process</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We follow a systematic approach to ensure your irrigation system delivers optimal results
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Consultation", desc: "Free site visit and needs assessment" },
              { step: "02", title: "Design", desc: "Custom system design and quotation" },
              { step: "03", title: "Installation", desc: "Professional setup and testing" },
              { step: "04", title: "Support", desc: "Ongoing maintenance and optimization" }
            ].map((process, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {process.step}
                </div>
                <h4 className="text-lg font-semibold mb-2">{process.title}</h4>
                <p className="text-sm text-muted-foreground">{process.desc}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent transform -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Schedule a free consultation with our irrigation experts to discuss your specific needs and get a custom solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/contact">
                Schedule Free Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">
                View All Services
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
