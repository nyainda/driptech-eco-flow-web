import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
} from "lucide-react";
import SimpleContactForm from "@/components/common/SimpleContactForm";
import SEOHead from "@/components/common/SEOHead";
import { buildContactPageSchema, buildLocalBusinessSchema, SITE_COMPANY } from "@/config/company";

const Contact = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      subtitle: "Speak with our irrigation experts",
      details: ["0723407849"],
      action: "tel:0723407849",
      actionText: "Call Now",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      subtitle: "Quick responses & support",
      details: ["0723407849"],
      action: "https://wa.me/254723407849",
      actionText: "Chat on WhatsApp",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp (Secondary)",
      subtitle: "Alternative WhatsApp line",
      details: ["0757716018"],
      action: "https://wa.me/254757716018",
      actionText: "Chat on WhatsApp",
    },
    {
      icon: Mail,
      title: "Email Us",
      subtitle: "Get detailed information",
      details: [SITE_COMPANY.email, SITE_COMPANY.emailAlt],
      action: `mailto:${SITE_COMPANY.email}`,
      actionText: "Send Email",
    },
    {
      icon: MapPin,
      title: "Nationwide Service",
      subtitle: "Irrigation supply and support across Kenya",
      details: ["Serving customers nationwide", "Contact us to arrange delivery or a farm visit"],
      action: null,
      actionText: "",
    },
  ];

  const businessHours = [
    { day: "Monday - Friday", hours: "8:00 AM - 6:00 PM" },
    { day: "Saturday", hours: "9:00 AM - 12:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ];

  return (
    <>
    <SEOHead
      title={`Contact ${SITE_COMPANY.name} | Irrigation Supplies & Services Kenya`}
      description={`Call or WhatsApp ${SITE_COMPANY.phonePrimaryDisplay} or ${SITE_COMPANY.phoneSecondaryDisplay} for drip kits, driplines and irrigation supplies in Kenya. Email ${SITE_COMPANY.email}. Nationwide delivery and farm support.`}
      keywords="contact DripTech, drip irrigation phone Kenya, irrigation WhatsApp Kenya, buy drip kit Nairobi contact, 0723407849, 0757716018"
      url="https://www.dripstech.co.ke/contact"
      image={`${SITE_COMPANY.url}/seed-products/plant_drip.jpg`}
      schema={[buildLocalBusinessSchema(), buildContactPageSchema()]}
    />
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 lg:py-24 bg-muted/30 border-b border-border">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 mb-8 animate-fade-in">
              <Badge className="px-6 py-3 text-sm font-semibold bg-primary/10 text-primary border-primary/20 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                <MessageCircle className="w-4 h-4 mr-2" />
                Get In Touch
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight animate-slide-up">
              <span className="block mb-2">Contact Our</span>
              <span className="block text-primary">
                Irrigation Experts
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12 animate-fade-in">
              Ready to transform your farm with modern irrigation? Our team is
              here to help you design, install, and maintain the perfect
              irrigation solution for your needs.
            </p>

            {/* Enhanced Quick stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-12 animate-scale-in">
              <div className="group flex items-center gap-3 px-6 py-3 bg-background/50 backdrop-blur-sm rounded-full border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground">Farm-focused Support</span>
              </div>
              <div className="group flex items-center gap-3 px-6 py-3 bg-background/50 backdrop-blur-sm rounded-full border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-accent/10 rounded-full group-hover:bg-accent/20 transition-colors">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <span className="font-semibold text-foreground">Nationwide Service</span>
              </div>
              <div className="group flex items-center gap-3 px-6 py-3 bg-background/50 backdrop-blur-sm rounded-full border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground">Fast Response Time</span>
              </div>
            </div>
          </div>
        </section>


        {/* Contact Content */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-foreground">
                  Send us a Message
                </h2>
                <SimpleContactForm />
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold mb-2 text-foreground">
                  Contact Information
                </h2>
                <p className="text-muted-foreground mb-8">
                  Choose your preferred way to reach us
                </p>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <Card
                      key={index}
                      className="group relative overflow-hidden hover:shadow-xl transition-all duration-500 hover:scale-[1.02] bg-background border-border hover:border-primary/30"
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                              <info.icon className="h-6 w-6 text-primary group-hover:text-accent transition-colors duration-500" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl mb-1 text-foreground group-hover:text-primary transition-colors duration-300">
                              {info.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {info.subtitle}
                            </p>
                            <div className="space-y-2 mb-5">
                              {info.details.map((detail, idx) => (
                                <p
                                  key={idx}
                                  className="text-foreground font-semibold text-base flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                  {detail}
                                </p>
                              ))}
                            </div>
                            {info.action && (
                              <a
                                href={info.action}
                                target={
                                  info.action.startsWith("http")
                                    ? "_blank"
                                    : "_self"
                                }
                                rel={
                                  info.action.startsWith("http")
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 hover:gap-3 shadow-sm hover:shadow-md"
                              >
                                {info.actionText}
                                <ArrowRight className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>


                {/* Business Hours Card */}
                <Card className="mt-6 bg-gradient-to-br from-background to-muted/20 border-border shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-accent/20 rounded-xl blur-md"></div>
                        <div className="relative p-3 bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl">
                          <Clock className="h-6 w-6 text-accent" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-foreground">
                          Business Hours
                        </h3>
                        <p className="text-sm text-muted-foreground">We're here when you need us</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {businessHours.map((schedule, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-3 px-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors duration-300"
                        >
                          <span className="font-medium text-foreground">{schedule.day}</span>
                          <span className="font-semibold text-primary">
                            {schedule.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Service coverage */}
            <div className="mt-12 lg:mt-16">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Nationwide Irrigation Supply and Farm Support
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  DripTech supplies irrigation equipment to customers across Kenya.
                  Delivery, farm visits and installation support are confirmed according
                  to your location, product requirements and project scope.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-xl text-foreground">
                        Equipment Supply Across Kenya
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Share your county or nearest town and the irrigation products
                      you need. Our team can confirm product availability, delivery
                      options and transport arrangements before you order.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <MessageCircle className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-xl text-foreground">
                        Arrange Farm and Installation Support
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-5">
                      For system design, installation or an on-site assessment, send
                      your location, crop, field size and water source so we can
                      confirm availability and the required scope.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`tel:${SITE_COMPANY.phonePrimary}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Call DripTech <ArrowRight className="h-4 w-4" />
                      </a>
                      <a
                        href={`https://wa.me/${SITE_COMPANY.phonePrimary.replace("+", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                      >
                        WhatsApp Us <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <IrrigationKeywords />

      <Footer />
    </div>
    </>
  );
};

export default Contact;
