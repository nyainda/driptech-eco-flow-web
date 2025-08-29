import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Clock, MessageCircle, Users, Globe, ArrowRight, CheckCircle, Star, Zap } from "lucide-react";
import SimpleContactForm from "@/components/common/SimpleContactForm";

const Contact = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      subtitle: "Speak with our irrigation experts",
      details: ["0111 409 454", "0114 575 401"],
      action: "tel:+254111409454",
      actionText: "Call Now"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      subtitle: "Quick responses & support",
      details: ["0111 409 454", "0114 575 401"],
      action: "https://wa.me/0114 575 401",
      actionText: "Chat on WhatsApp"
    },
    {
      icon: Mail,
      title: "Email Us",
      subtitle: "Get detailed information",
      details: ["driptech2025@gmail.com", "driptechs.info@gmail.com"],
      action: "mailto:driptech2025@gmail.com",
      actionText: "Send Email"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      subtitle: "Our office location",
      details: ["Nairobi, Kenya", "East Africa"],
      action: "https://goo.gl/maps/nairobi-kenya",
      actionText: "Get Directions"
    }
  ];

  const businessHours = [
    { day: "Monday - Friday", hours: "8:00 AM - 6:00 PM" },
    { day: "Saturday", hours: "9:00 AM - 12:00 PM" },
    { day: "Sunday", hours: "Closed" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950/30">
      <Header />
      <main>
        {/* Enhanced Hero Section */}
        <section className="py-32 bg-gradient-to-br from-emerald-50 via-blue-50/50 to-cyan-50/30 dark:from-emerald-950/20 dark:via-blue-950/30 dark:to-cyan-950/20 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 mb-8">
              <Badge variant="secondary" className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-950 dark:to-blue-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 rounded-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Get In Touch
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-8 leading-tight tracking-tight">
              <span className="block mb-2">Contact Our</span>
              <span className="block bg-gradient-to-r from-emerald-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Irrigation Experts
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Ready to transform your farm with modern irrigation? Our team is here to help you design,
              install, and maintain the perfect irrigation solution for your needs.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-medium">24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">500+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Fast Response Time</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Send us a Message</h2>
                <SimpleContactForm />
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Contact Information</h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-transparent hover:border-primary/30">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-xl transition-all duration-300 group-hover:bg-primary/20">
                            <info.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 text-slate-800 dark:text-slate-200">{info.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{info.subtitle}</p>
                            <div className="space-y-1 mb-4">
                              {info.details.map((detail, idx) => (
                                <p key={idx} className="text-muted-foreground font-medium">
                                  {detail}
                                </p>
                              ))}
                            </div>
                            {info.action && (
                              <a
                                href={info.action}
                                target={info.action.startsWith('http') ? '_blank' : '_self'}
                                rel={info.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                                className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                              >
                                {info.actionText} <ArrowRight className="h-4 w-4 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Business Hours Card */}
                <Card className="mt-6 border-transparent hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Business Hours</h3>
                    </div>
                    <div className="space-y-2">
                      {businessHours.map((schedule, idx) => (
                        <div key={idx} className="flex justify-between items-center text-muted-foreground">
                          <span>{schedule.day}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{schedule.hours}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Map Section */}
            <div className="mt-16">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Find Us in Kenya</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Located in Nairobi, Kenya's capital city. We serve irrigation projects across Kenya.
                </p>
              </div>

              <Card className="overflow-hidden border-primary/20">
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
                    <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm border border-primary/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">DripTech Kenya</h4>
                          <p className="text-sm text-muted-foreground">Irrigation Solutions</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Nairobi, Kenya<br />
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
                          className="inline-flex items-center text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full hover:bg-secondary/90 transition-colors"
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