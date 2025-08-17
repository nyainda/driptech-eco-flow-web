
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { 
  Phone, 
  Mail, 
  MapPin,
  Star,
  Award,
  Wrench,
  GraduationCap,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Technician {
  id: string;
  name: string;
  position: string;
  bio?: string;
  image_url?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  featured: boolean;
}

const Technicians = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      toast({
        title: "Error",
        description: "Failed to load technicians",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const services = [
    {
      icon: Wrench,
      title: "System Installation",
      description: "Professional installation of all irrigation systems with precision and care.",
      expertise: ["Drip systems", "Sprinkler installation", "Smart controllers", "Pump systems"]
    },
    {
      icon: GraduationCap,
      title: "Technical Training",
      description: "Comprehensive training on system operation and maintenance best practices.",
      expertise: ["Operator training", "Maintenance procedures", "Troubleshooting", "System optimization"]
    },
    {
      icon: Award,
      title: "System Maintenance",
      description: "Regular maintenance and emergency repair services to ensure optimal performance.",
      expertise: ["Preventive maintenance", "Emergency repairs", "Component replacement", "Performance tuning"]
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock technical support for critical irrigation system issues.",
      expertise: ["Emergency response", "Remote diagnostics", "Technical consultation", "System monitoring"]
    }
  ];

  const certifications = [
    "Certified Irrigation Designer (CID)",
    "Certified Landscape Irrigation Auditor (CLIA)",
    "Smart Water Application Technologies (SWAT)",
    "Irrigation Association Certified",
    "Water Management Specialist",
    "Agricultural Systems Technology"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              👨‍🔧 Expert Technicians
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Certified Irrigation
              <span className="text-primary"> Specialists</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Meet our team of certified irrigation technicians with years of experience in designing, 
              installing, and maintaining irrigation systems across Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" asChild>
                <Link to="/contact">
                  Request Service Call
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/services">View Services</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Installations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Certified</div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        {technicians.length > 0 && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Expert Team</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Certified professionals dedicated to delivering exceptional irrigation solutions
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {technicians.map((tech) => (
                  <Card key={tech.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                    <CardContent className="p-6 text-center">
                      <div className="relative mb-6">
                        {tech.image_url ? (
                          <img
                            src={tech.image_url}
                            alt={tech.name}
                            className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-primary/20"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                            {tech.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-green-600 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">{tech.name}</h3>
                      <p className="text-primary font-medium mb-4">{tech.position}</p>
                      
                      {tech.bio && (
                        <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                          {tech.bio}
                        </p>
                      )}
                      
                      <div className="flex justify-center gap-2 mb-4">
                        {tech.email && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`mailto:${tech.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {tech.phone && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${tech.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Services Section */}
        <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Technical Services</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our certified technicians provide comprehensive irrigation services
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <service.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                        <p className="text-muted-foreground mb-4">{service.description}</p>
                        <div className="space-y-2">
                          {service.expertise.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Certifications</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our technicians hold industry-recognized certifications
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                  <Award className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-medium">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-2">
              <CardContent className="p-12 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Ready to Transform Your Farm?
                  </h2>
                  <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                    Join over 150 satisfied farmers across Kenya who have revolutionized their operations 
                    with our cutting-edge irrigation solutions. Experience increased yields, reduced water consumption, 
                    and sustainable farming practices that ensure long-term success with our proven 2-year track record.
                  </p>
                  <div className="flex flex-wrap justify-center gap-6">
                    <a 
                      href="/contact" 
                      className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Get Free Consultation
                    </a>
                    <a 
                      href="tel:+254111409454" 
                      className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/90 transition-all duration-300 hover:shadow-lg hover:scale-105"
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Call Us Today
                    </a>
                  </div>
                  <div className="mt-8 pt-8 border-t border-border/20">
                    <p className="text-sm text-muted-foreground">
                      Available 24/7 for emergency support • All counties covered • Free site assessment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Technicians;
