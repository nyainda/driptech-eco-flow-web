import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Clock, MessageCircle, Users, Globe } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              🇰🇪 Contact Us - Kenya
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Get in
              <span className="text-primary"> Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Ready to transform your irrigation system? Contact our experts for a free consultation and custom quote.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>50+ Projects Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Serving All of Kenya</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Quick Response Time</span>
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
                <h2 className="text-3xl font-bold mb-6">Send us a Message</h2>
                <SimpleContactForm />
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-xl transition-all duration-300 group-hover:bg-primary/20">
                            <info.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{info.title}</h3>
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
                                {info.actionText} →
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Business Hours Card */}
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Business Hours</h3>
                    </div>
                    <div className="space-y-2">
                      {businessHours.map((schedule, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{schedule.day}</span>
                          <span className="font-medium">{schedule.hours}</span>
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
                <h2 className="text-3xl font-bold mb-4">Find Us in Kenya</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Located in Nairobi, Kenya's capital city. We serve irrigation projects across Kenya.
                </p>
              </div>
              
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video relative">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d255282.35864512736!2d36.70730046250002!3d-1.3028617999999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7cf0254b297924c!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2ske!4v1642678890123"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="DripTech Kenya Location - Nairobi, Kenya"
                      className="rounded-lg"
                    ></iframe>
                    
                    {/* Map Overlay */}
                    <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm border">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold">DripTech Kenya</h4>
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
                          className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
                        >
                          Get Directions
                        </a>
                        <a 
                          href="https://wa.me/254111409454?text=Hi, I found you on your website. I'm interested in drip irrigation solutions."
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full hover:bg-secondary/90 transition-colors"
                        >
                          WhatsApp Us
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