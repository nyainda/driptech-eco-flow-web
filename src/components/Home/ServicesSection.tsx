import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Settings, 
  Wrench, 
  GraduationCap, 
  LineChart,
  Shield,
  ArrowRight,
  CheckCircle,
  Package,
  MapPin,
  Star,
  TrendingUp,
  Leaf
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Interface for IrrigationKit (aligned with IrrigationKits)
interface IrrigationKit {
  id: string;
  name: string;
  description: string | null;
  kit_type: string | null;
  coverage_area: number | null;
  recommended_crops: string[] | null;
  price: number | null;
  components: any;
  installation_complexity: string | null;
  installation_time_hours: number | null;
  water_efficiency_percentage: number | null;
  warranty_months: number | null;
  featured: boolean | null;
  active: boolean | null;
  images: any;
  created_at: string | null;
  updated_at: string | null;
}

// Interface for ComponentsData (from IrrigationKits)
interface ComponentsData {
  main_components?: string[];
  pricing_tiers?: Array<{ name: string; price: number; description: string }>;
  included_services?: string[];
}

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

  // Fetch featured kits from Supabase
  const { data: kits = [], isLoading, error } = useQuery({
    queryKey: ['irrigation-kits-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('irrigation_kits')
        .select('id, name, description, kit_type, coverage_area, recommended_crops, price, components, installation_complexity, installation_time_hours, water_efficiency_percentage, warranty_months, featured, images')
        .eq('active', true)
        .eq('featured', true)
        .limit(3)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching kits:', error);
        throw error;
      }
      
      return data as IrrigationKit[];
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Format currency (reused from IrrigationKits)
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Contact for Price';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Parse components (reused from IrrigationKits)
  const parseComponents = (components: any): ComponentsData => {
    if (typeof components === 'string') {
      try {
        return JSON.parse(components);
      } catch {
        return {};
      }
    }
    return components || {};
  };

  // Parse images (reused from IrrigationKits)
  const parseImages = (images: any): string[] => {
    if (typeof images === 'string') {
      try {
        return JSON.parse(images);
      } catch {
        return [];
      }
    }
    return Array.isArray(images) ? images : [];
  };

  // Get complexity color (reused from IrrigationKits)
  const getComplexityColor = (complexity: string | null) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <section className="py-24 bg-background border-t border-border relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-muted text-foreground border-border">
              <Droplets className="w-4 h-4 mr-2" />
              Our Solutions
            </Badge>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
            Complete 
            <span className="block text-primary">
              Irrigation Solutions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Discover our professional irrigation kits and comprehensive services designed for Kenyan farms to maximize productivity and efficiency.
          </p>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-left">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">Our Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card 
                key={index} 
                className={`group relative overflow-hidden bg-background border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                  service.popular ? 'border-primary/20 border-2' : ''
                }`}
              >
                {service.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-muted text-foreground border-border">
                      Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="p-3 bg-muted rounded-xl inline-block mb-4">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2 text-foreground">{service.title}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all border-border hover:bg-accent hover:text-accent-foreground" 
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
        </div>

        {/* Featured Kits Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">Featured Irrigation Kits</h3>
            <Button 
              variant="outline" 
              className="border-border hover:bg-accent hover:text-accent-foreground" 
              asChild
            >
              <Link to="/irrigation-kits">
                View All Kits
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading kits...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Unable to load kits. Please try again later.</p>
            </div>
          ) : kits.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No featured kits available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {kits.map((kit) => {
                const components = parseComponents(kit.components);
                const images = parseImages(kit.images);
                const imageUrl = images[0];
                const hasPricingTiers = components.pricing_tiers && components.pricing_tiers.length > 0;
                
                return (
                  <Card 
                    key={kit.id} 
                    className="group relative overflow-hidden bg-background border-border hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:border-primary/50"
                  >
                    {/* Image Section */}
                    {imageUrl && (
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={imageUrl}
                          alt={kit.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
                        {kit.featured && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="text-foreground">
                            <h3 className="text-xl font-bold mb-1">{kit.name}</h3>
                            <Badge className="bg-muted text-muted-foreground border-border">
                              {kit.kit_type?.replace('_', ' ') || 'Standard Kit'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <CardContent className="p-6 space-y-4">
                      {!imageUrl && (
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                              {kit.name}
                            </h3>
                            <Badge className="mt-1 capitalize bg-muted text-muted-foreground border-border">
                              {kit.kit_type?.replace('_', ' ') || 'Standard'}
                            </Badge>
                          </div>
                          {kit.featured && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {kit.description && (
                        <p className="text-muted-foreground line-clamp-2">{kit.description}</p>
                      )}
                      
                      {/* Specifications */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/30 rounded-lg border border-border">
                          <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
                          <div className="font-semibold text-foreground">{kit.coverage_area || 'TBD'}</div>
                          <div className="text-xs text-muted-foreground">acres</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg border border-border">
                          <Droplets className="h-5 w-5 text-primary mx-auto mb-1" />
                          <div className="font-semibold text-foreground">{kit.water_efficiency_percentage || 0}%</div>
                          <div className="text-xs text-muted-foreground">efficiency</div>
                        </div>
                      </div>
                      
                      {/* Pricing Options */}
                      <div>
                        <div className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Pricing Options
                        </div>
                        {hasPricingTiers ? (
                          <div className="space-y-2">
                            {components.pricing_tiers!.slice(0, 2).map((tier, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border">
                                <div className="text-sm text-foreground">{tier.name}</div>
                                <div className="text-sm font-semibold text-primary">{formatCurrency(tier.price)}</div>
                              </div>
                            ))}
                            {components.pricing_tiers!.length > 2 && (
                              <div className="text-center text-xs text-muted-foreground">
                                +{components.pricing_tiers!.length - 2} more options
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center p-2 bg-muted/30 rounded border border-border">
                            <div className="text-lg font-bold text-primary">{formatCurrency(kit.price)}</div>
                            <div className="text-xs text-muted-foreground">Complete kit price</div>
                          </div>
                        )}
                      </div>

                      {/* Included Components */}
                      {components.main_components && components.main_components.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
                            <Package className="h-4 w-4 text-primary" />
                            Included Components
                          </div>
                          <ul className="space-y-1">
                            {components.main_components.slice(0, 3).map((component, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                {component}
                              </li>
                            ))}
                            {components.main_components.length > 3 && (
                              <li className="text-xs text-muted-foreground text-center">
                                +{components.main_components.length - 3} more components
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Included Services */}
                      {components.included_services && components.included_services.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
                            <Settings className="h-4 w-4 text-primary" />
                            Included Services
                          </div>
                          <ul className="space-y-1">
                            {components.included_services.slice(0, 3).map((service, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                {service}
                              </li>
                            ))}
                            {components.included_services.length > 3 && (
                              <li className="text-xs text-muted-foreground text-center">
                                +{components.included_services.length - 3} more services
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Crops */}
                      {kit.recommended_crops && kit.recommended_crops.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
                            <Leaf className="h-4 w-4 text-primary" />
                            Best for
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {kit.recommended_crops.slice(0, 3).map((crop, index) => (
                              <Badge key={index} className="text-xs bg-muted text-muted-foreground border-border">
                                {crop}
                              </Badge>
                            ))}
                            {kit.recommended_crops.length > 3 && (
                              <Badge className="text-xs bg-muted text-muted-foreground border-border">
                                +{kit.recommended_crops.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {kit.installation_complexity && (
                          <Badge className={getComplexityColor(kit.installation_complexity)}>
                            {kit.installation_complexity} install
                          </Badge>
                        )}
                        <Badge className="bg-muted text-muted-foreground border-border">
                          <Shield className="h-3 w-3 mr-1" />
                          {kit.warranty_months || 12}mo warranty
                        </Badge>
                      </div>

                  
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Process Section */}
        <div className="bg-muted/30 rounded-2xl p-8 md:p-12 border border-border">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">Our Proven Process</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We follow a systematic approach to deliver and support your irrigation kit and services for optimal results.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Consultation", desc: "Free site visit and needs assessment" },
              { step: "02", title: "Design", desc: "Custom kit and system design" },
              { step: "03", title: "Installation", desc: "Professional setup and testing" },
              { step: "04", title: "Support", desc: "Ongoing maintenance and optimization" }
            ].map((process, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-muted text-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {process.step}
                </div>
                <h4 className="text-lg font-semibold mb-2 text-foreground">{process.title}</h4>
                <p className="text-sm text-muted-foreground">{process.desc}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border transform -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-4 text-foreground">Ready to Get Started?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Schedule a free consultation to find the perfect irrigation kit and services for your farm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground" asChild>
              <Link to="/contact">
                Schedule Free Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground" asChild>
              <Link to="/irrigation-kits">
                Explore All Kits
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground" asChild>
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