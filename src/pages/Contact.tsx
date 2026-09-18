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
      details: ["driptech2025@gmail.com", "driptechs.info@gmail.com"],
      action: "mailto:driptech2025@gmail.com",
      actionText: "Send Email",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      subtitle: "Our office location",
      details: ["Nairobi, Kenya", "East Africa"],
      action: "https://goo.gl/maps/nairobi-kenya",
      actionText: "Get Directions",
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
      title={`Contact ${SITE_COMPANY.name} | Call ${SITE_COMPANY.phonePrimaryDisplay} | Drip Irrigation Kenya`}
      description={`Call or WhatsApp ${SITE_COMPANY.phonePrimaryDisplay} or ${SITE_COMPANY.phoneSecondaryDisplay} for drip kits, driplines and irrigation supplies in Kenya. Email ${SITE_COMPANY.email}. Nairobi-based, nationwide delivery.`}
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
                <span className="font-semibold text-foreground">24/7 Support</span>
              </div>
              <div className="group flex items-center gap-3 px-6 py-3 bg-background/50 backdrop-blur-sm rounded-full border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-accent/10 rounded-full group-hover:bg-accent/20 transition-colors">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <span className="font-semibold text-foreground">500+ Happy Customers</span>
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

            {/* Map Section */}
            <div className="mt-12 lg:mt-16">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Find Us in Kenya
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Located in Nairobi, Kenya's capital city. We serve irrigation
                  projects across Kenya.
                </p>
              </div>

              <Card className="overflow-hidden border-border">
                <CardContent className="p-0">
                  <div className="aspect-video relative">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d255282.35864512736!2d36.70730046250002!3d-1.3028617999999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7cf0254b297924c!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2ske!4v1642678890123"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="DripTech Kenya Location - Nairobi, Kenya"
                      className="rounded-lg"
                    ></iframe>

                    {/* Map Overlay */}
                    <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm border border-border">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-muted rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">
                            DripTech Kenya
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Irrigation Solutions
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Nairobi, Kenya
                        <br />
                        East Africa
                      </p>
                      <div className="flex gap-2">
                        <a
                          href="https://goo.gl/maps/nairobi-kenya"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
                        >
                          Get Directions <ArrowRight className="h-3 w-3 ml-1" />
                        </a>
                        <a
                          href="https://wa.me/254723407849?text=Hi, I found you on your website. I'm interested in drip irrigation solutions."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full hover:bg-muted/50 transition-colors"
                        >
                          WhatsApp Us <ArrowRight className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
