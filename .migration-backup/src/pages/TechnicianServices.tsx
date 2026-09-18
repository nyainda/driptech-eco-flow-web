import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import SEOHead from "@/components/common/SEOHead";
import Breadcrumbs from "@/components/Layout/Breadcrumbs";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Wrench,
    Settings,
    ClipboardCheck,
    GraduationCap,
    AlertTriangle,
    CheckCircle,
    ArrowRight,
    Phone,
    Calendar,
    MapPin,
    Star,
} from "lucide-react";
import { dataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import ServiceBookingModal from "@/components/Services/ServiceBookingModal";
import { openTrackedWhatsApp } from "@/lib/whatsappAnalytics";

interface ServiceCategory {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    base_price?: number;
    pricing_type: string;
    features: string[];
    is_active: boolean;
}

const iconMap: Record<string, any> = {
    Wrench,
    Settings,
    ClipboardCheck,
    GraduationCap,
    AlertTriangle,
};

const TechnicianServices = () => {
    const [services, setServices] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const data = await dataService.getServiceCategories({ active: true });
                setServices(data || []);
            } catch (error) {
                console.error("Error fetching services:", error);
                toast({
                    title: "Error",
                    description: "Failed to load services. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, [toast]);

    const handleBookService = (service: ServiceCategory) => {
        setSelectedService(service);
        setShowBookingModal(true);
    };

    const handleWhatsAppBooking = (service: ServiceCategory) => {
        const message = encodeURIComponent(
            `Hi DripTech! I'm interested in booking ${service.name}. Can you help me with the details?`
        );
        openTrackedWhatsApp(`https://wa.me/254757716018?text=${message}`, "technician booking");
    };

    const getPricingDisplay = (service: ServiceCategory) => {
        if (service.pricing_type === "quote") {
            return "Request Quote";
        }
        if (service.base_price) {
            const typeLabel = {
                fixed: "Fixed Price",
                hourly: "/hour",
                per_acre: "/acre",
                subscription: "/month",
            }[service.pricing_type] || "";
            return `KES ${service.base_price.toLocaleString()}${typeLabel}`;
        }
        return "Contact for Pricing";
    };

    return (
        <div className="min-h-screen bg-background">
            <SEOHead
                title="Professional Irrigation Technician Services Kenya | Installation, Maintenance & Repair - DripTech Eco Flow"
                description="Book certified irrigation technicians in Kenya for installation, maintenance, repairs, system audits, and training. 24/7 emergency service available. Expert technicians nationwide."
                image="https://www.dripstech.co.ke/seed-products/field_drip.jpg"
            />
            <Header />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <Breadcrumbs />
            </div>

            <main>
                {/* Hero Section */}
                <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="container mx-auto px-4 text-center">
                        <Badge variant="secondary" className="mb-4 text-base px-4 py-2">
                            🔧 Professional Technician Services
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-foreground">
                            Book Expert <span className="text-primary">Irrigation Technicians</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                            Get professional help from certified irrigation technicians. From installation to emergency repairs,
                            we've got you covered with fast, reliable service across Kenya.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button size="lg" onClick={() => setShowBookingModal(true)}>
                                <Calendar className="mr-2 h-5 w-5" />
                                Book a Technician
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => openTrackedWhatsApp("https://wa.me/254757716018", "technician support")}
                            >
                                <Phone className="mr-2 h-5 w-5" />
                                Call Now: 0757 716 018
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Services Grid */}
                <section className="py-16 sm:py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                Our <span className="text-primary">Services</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Choose the irrigation service your farm needs
                            </p>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader>
                                            <div className="h-12 w-12 bg-muted rounded-xl mb-4"></div>
                                            <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-muted rounded w-full"></div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-muted rounded"></div>
                                                <div className="h-4 bg-muted rounded"></div>
                                                <div className="h-4 bg-muted rounded"></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {services.map((service) => {
                                    const IconComponent = iconMap[service.icon] || Wrench;
                                    return (
                                        <Card
                                            key={service.id}
                                            className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary"
                                        >
                                            <CardHeader>
                                                <div className="inline-flex p-4 bg-primary/10 rounded-xl mb-4 group-hover:bg-primary/20 transition-colors">
                                                    <IconComponent className="h-8 w-8 text-primary" />
                                                </div>
                                                <CardTitle className="text-2xl mb-2">{service.name}</CardTitle>
                                                <CardDescription className="text-base">{service.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {/* Features */}
                                                    <ul className="space-y-2">
                                                        {service.features.map((feature, idx) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                                                <span className="text-sm text-muted-foreground">{feature}</span>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    {/* Pricing */}
                                                    <div className="pt-4 border-t border-border">
                                                        <div className="text-2xl font-bold text-primary mb-4">
                                                            {getPricingDisplay(service)}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="space-y-2">
                                                            <Button
                                                                className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                                                                onClick={() => handleBookService(service)}
                                                            >
                                                                <Calendar className="mr-2 h-4 w-4" />
                                                                Book Now
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full"
                                                                onClick={() => handleWhatsAppBooking(service)}
                                                            >
                                                                <Phone className="mr-2 h-4 w-4" />
                                                                WhatsApp Booking
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section className="py-16 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                Why Choose <span className="text-primary">DripTech Technicians</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: Star,
                                    title: "Certified Experts",
                                    description: "All technicians are certified and highly experienced",
                                },
                                {
                                    icon: Calendar,
                                    title: "Flexible Scheduling",
                                    description: "Book at your convenience, including weekends",
                                },
                                {
                                    icon: AlertTriangle,
                                    title: "24/7 Emergency",
                                    description: "Round-the-clock emergency service available",
                                },
                                {
                                    icon: MapPin,
                                    title: "Nationwide Coverage",
                                    description: "Service available across all regions in Kenya",
                                },
                            ].map((benefit, idx) => (
                                <Card key={idx} className="text-center">
                                    <CardContent className="pt-6">
                                        <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-4">
                                            <benefit.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 sm:py-20 bg-primary text-primary-foreground">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                            Ready to Get Started?
                        </h2>
                        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                            Book a technician today and experience professional irrigation service that keeps your system running perfectly.
                        </p>
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={() => setShowBookingModal(true)}
                        >
                            Book a Technician Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </section>
            </main>

            <IrrigationKeywords />
            <Footer />

            {/* Booking Modal */}
            {showBookingModal && (
                <ServiceBookingModal
                    isOpen={showBookingModal}
                    onClose={() => {
                        setShowBookingModal(false);
                        setSelectedService(null);
                    }}
                    preselectedService={selectedService}
                />
            )}
        </div>
    );
};

export default TechnicianServices;
