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
        openTrackedWhatsApp(`https://wa.me/254723407849?text=${message}`, "technician booking");
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
                {/* Service-led hero */}
                <section className="relative isolate overflow-hidden border-b border-border bg-background text-foreground">
                    <div className="absolute inset-0 -z-20">
                        <img
                            src="/seed-products/field_drip.jpg"
                            alt=""
                            className="h-full w-full object-cover object-center opacity-20 dark:opacity-15"
                            aria-hidden="true"
                        />
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/95 to-background/85 dark:from-background dark:via-background/90 dark:to-background/80" />
                    <div className="container mx-auto grid gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-8 lg:py-20">
                        <div className="max-w-3xl">
                            <Badge className="mb-5 border border-primary/20 bg-primary/10 px-3 py-1.5 text-primary">
                                <Wrench className="mr-2 h-3.5 w-3.5" />
                                Irrigation support, when you need it
                            </Badge>
                            <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                Keep your irrigation system <span className="text-primary">working at its best.</span>
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/80 sm:text-lg sm:leading-8">
                                Get practical help with installation, troubleshooting, repairs and routine maintenance from the DripTech team. Tell us what your farm needs and we’ll help you plan the next step.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button size="lg" className="min-h-12 shadow-lg shadow-primary/15" onClick={() => setShowBookingModal(true)}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Request a technician
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="min-h-12 border-border bg-background text-foreground hover:bg-muted"
                                    onClick={() => openTrackedWhatsApp("https://wa.me/254723407849?text=" + encodeURIComponent("Hi DripTech, I need help with an irrigation system. Please advise."), "technician support")}
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Chat with our team
                                </Button>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-foreground/80 sm:text-sm">
                                <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Installation & setup</span>
                                <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Repairs & maintenance</span>
                                <span className="inline-flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Farm-focused guidance</span>
                            </div>
                        </div>
                        <div className="mx-auto w-full max-w-lg lg:ml-auto">
                            <div className="overflow-hidden rounded-3xl border border-border bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur">
                                <div className="border-b border-border p-5 sm:p-6">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
                                    <h2 className="mt-2 font-heading text-2xl font-bold text-foreground">Get the right help in 3 steps</h2>
                                </div>
                                <div className="space-y-5 p-5 sm:p-6">
                                    {[
                                        { n: "01", title: "Choose your service", body: "Select the kind of support your irrigation system needs." },
                                        { n: "02", title: "Share the farm details", body: "Tell us your location, system type and what is happening." },
                                        { n: "03", title: "Confirm the next step", body: "Our team will help clarify availability, scope and pricing." },
                                    ].map((step) => (
                                        <div key={step.n} className="flex gap-4">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-black text-primary">{step.n}</span>
                                            <div>
                                                <h3 className="font-bold text-foreground">{step.title}</h3>
                                                <p className="mt-1 text-sm leading-6 text-foreground/75">{step.body}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 border-t border-border bg-muted/60 px-5 py-4 sm:px-6">
                                    <MapPin className="h-5 w-5 shrink-0 text-primary" />
                                    <p className="text-sm leading-6 text-foreground/80">Serving farms and irrigation projects across Kenya. Confirm coverage when booking.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Service options */}
                <section className="py-14 sm:py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Choose your support</p>
                                <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Technician services for your farm</h2>
                                <p className="mt-3 text-sm leading-6 text-foreground/80 sm:text-base">From a new installation to a system that needs attention, start with the service that best matches your situation.</p>
                            </div>
                            <p className="max-w-sm text-sm leading-6 text-foreground/75">Not sure what you need? Message us and describe the issue before booking.</p>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <Card key={i} className="animate-pulse rounded-2xl">
                                        <CardHeader><div className="mb-3 h-12 w-12 rounded-xl bg-muted" /><div className="mb-2 h-6 w-3/4 rounded bg-muted" /><div className="h-4 w-full rounded bg-muted" /></CardHeader>
                                        <CardContent><div className="space-y-3"><div className="h-4 rounded bg-muted" /><div className="h-4 rounded bg-muted" /><div className="h-10 rounded bg-muted" /></div></CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : services.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                                <Wrench className="mx-auto h-9 w-9 text-primary" />
                                <h3 className="mt-4 text-lg font-bold text-foreground">Let’s discuss what your farm needs</h3>
                                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Our online service list is temporarily unavailable. Contact the team and we’ll help direct your request.</p>
                                <Button className="mt-5" onClick={() => openTrackedWhatsApp("https://wa.me/254723407849?text=" + encodeURIComponent("Hi DripTech, I would like help choosing a technician service."), "technician support")}>Ask on WhatsApp</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {services.map((service, index) => {
                                    const IconComponent = iconMap[service.icon] || Wrench;
                                    return (
                                        <Card key={service.id} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                                            <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />
                                            <CardHeader className="pb-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10 transition-colors group-hover:bg-primary/15">
                                                        <IconComponent className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Service {String(index + 1).padStart(2, "0")}</span>
                                                </div>
                                                <CardTitle className="pt-3 font-heading text-xl leading-snug">{service.name}</CardTitle>
                                                <CardDescription className="text-sm leading-6">{service.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex flex-1 flex-col pt-0">
                                                {service.features?.length > 0 && (
                                                    <ul className="space-y-2.5">
                                                        {service.features.slice(0, 4).map((feature, idx) => (
                                                            <li key={idx} className="flex items-start gap-2.5 text-sm leading-5 text-muted-foreground">
                                                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                                                <span>{feature}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                <div className="mt-auto pt-5">
                                                    <div className="mb-4 rounded-xl bg-muted/35 px-4 py-3">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Service pricing</p>
                                                        <p className="mt-1 text-lg font-black text-foreground">{getPricingDisplay(service)}</p>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Button className="w-full" onClick={() => handleBookService(service)}>
                                                            <Calendar className="mr-2 h-4 w-4" /> Request this service <ArrowRight className="ml-auto h-4 w-4" />
                                                        </Button>
                                                        <Button variant="outline" className="w-full" onClick={() => handleWhatsAppBooking(service)}>
                                                            <Phone className="mr-2 h-4 w-4" /> Ask a question first
                                                        </Button>
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

                {/* Trust and process */}
                <section className="border-y border-border bg-muted/25 py-12 sm:py-16">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto mb-9 max-w-2xl text-center">
                            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Support you can plan around</p>
                            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Practical help, clear next steps</h2>
                            <p className="mt-3 text-sm leading-6 text-foreground/80 sm:text-base">We’ll help you understand the service, discuss the scope and confirm the details before work is arranged.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { icon: ClipboardCheck, title: "Clear scope", description: "Discuss the system, issue and work required before proceeding." },
                                { icon: Calendar, title: "Flexible booking", description: "Share your preferred date and arrange a suitable time with our team." },
                                { icon: Wrench, title: "Field-focused support", description: "Get practical guidance for irrigation equipment and farm conditions." },
                                { icon: MapPin, title: "Kenya coverage", description: "Tell us your location so we can confirm service availability." },
                            ].map((benefit) => (
                                <div key={benefit.title} className="rounded-2xl border border-border bg-card p-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><benefit.icon className="h-5 w-5 text-primary" /></div>
                                    <h3 className="mt-4 font-bold text-foreground">{benefit.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-foreground/75">{benefit.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Conversion CTA */}
                <section className="py-14 sm:py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-9 text-primary-foreground sm:px-10 sm:py-12 lg:px-14">
                            <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-primary-foreground/15" />
                            <div className="pointer-events-none absolute -right-2 -top-8 h-40 w-40 rounded-full border border-primary-foreground/15" />
                            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="max-w-2xl">
                                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/80">Need a hand with your system?</p>
                                    <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Let’s get your irrigation back on track.</h2>
                                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">Tell us what you’re working on. We’ll help you identify the right service and discuss the next steps.</p>
                                </div>
                                <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                                    <Button size="lg" variant="secondary" onClick={() => setShowBookingModal(true)}><Calendar className="mr-2 h-4 w-4" /> Request a technician</Button>
                                    <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => openTrackedWhatsApp("https://wa.me/254723407849?text=" + encodeURIComponent("Hi DripTech, I need help with irrigation technician services."), "technician support")}><Phone className="mr-2 h-4 w-4" /> WhatsApp DripTech</Button>
                                </div>
                            </div>
                        </div>
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
