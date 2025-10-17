import Footer from "@/components/Layout/Footer";
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

const Contact = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      subtitle: "Speak with our irrigation experts",
      details: ["0111 409 454", "0114 575 401"],
      action: "tel:+254111409454",
      actionText: "Call Now",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      subtitle: "Quick responses & support",
      details: ["0111 409 454", "0114 575 401"],
      action: "https://wa.me/0114575401",
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
    <div className="min-h-screen bg-background text-foreground">
      {/* <Header /> */}
      <main>
        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 mb-8">
              <Badge className="px-5 py-2.5 text-sm font-semibold bg-muted text-muted-foreground border-border rounded-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Get In Touch
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight tracking-tight">
              <span className="block mb-2">Contact Our</span>
              <span className="block text-primary">Irrigation Experts</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Ready to transform your farm with modern irrigation? Our team is
              here to help you design, install, and maintain the perfect
              irrigation solution for your needs.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="w-5 h-5 text-primary" />
                <span className="font-medium">500+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-medium">Fast Response Time</span>
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
                <h2 className="text-3xl font-bold mb-6 text-foreground">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-background border-border"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-muted rounded-xl transition-all duration-300 group-hover:bg-muted/50">
                            <info.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 text-foreground">
                              {info.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {info.subtitle}
                            </p>
                            <div className="space-y-1 mb-4">
                              {info.details.map((detail, idx) => (
                                <p
                                  key={idx}
                                  className="text-muted-foreground font-medium"
                                >
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
                                className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                              >
                                {info.actionText}{" "}
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Business Hours Card */}
                <Card className="mt-6 bg-background border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-muted rounded-xl">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">
                        Business Hours
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {businessHours.map((schedule, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-muted-foreground"
                        >
                          <span>{schedule.day}</span>
                          <span className="font-medium text-foreground">
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
                          href="https://wa.me/254111409454?text=Hi, I found you on your website. I'm interested in drip irrigation solutions."
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
      <Footer />
    </div>
  );
};

export default Contact;
