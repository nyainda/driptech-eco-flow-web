import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { 
  Users, 
  Award, 
  Globe, 
  CheckCircle, 
  Droplets,
  Leaf,
  Target,
  Heart,
  ArrowRight,
  Mail,
  Phone
} from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const stats = [
    { icon: Users, label: "Happy Customers", value: "150+" },
    { icon: Droplets, label: "Water Saved", value: "500K+ Liters" },
    { icon: Globe, label: "Projects Completed", value: "75+" },
    { icon: Award, label: "Years Experience", value: "2+" }
  ];

  const values = [
    {
      icon: Leaf,
      title: "Sustainability",
      description: "We're committed to water conservation and sustainable agriculture practices that protect our environment for future generations."
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Using cutting-edge technology and smart irrigation solutions to maximize efficiency and crop yields while minimizing resource waste."
    },
    {
      icon: Heart,
      title: "Customer Focus",
      description: "Your success is our priority. We provide personalized solutions, ongoing support, and training to ensure optimal system performance."
    },
    {
      icon: CheckCircle,
      title: "Quality Assurance",
      description: "We use only premium components and follow international standards to deliver irrigation systems that stand the test of time."
    }
  ];

  const milestones = [
    { year: "2023", title: "Company Founded", description: "Started with a vision to revolutionize irrigation in Kenya with modern technology" },
    { year: "2023", title: "First Installations", description: "Successfully completed our first 10 smart irrigation projects across Kenya" },
    { year: "2024", title: "Smart Systems Launch", description: "Introduced IoT-enabled smart irrigation monitoring systems with mobile app control" },
    { year: "2024", title: "50+ Projects Milestone", description: "Reached 50 successful installations with 98% customer satisfaction rate" },
    { year: "2025", title: "Technology Partnership", description: "Partnered with leading tech companies for advanced AI-driven irrigation solutions" },
    { year: "2025", title: "Regional Expansion", description: "Expanding services to cover entire East Africa region" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4 text-sm font-semibold">
              🌱 About DripTech
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Transforming Agriculture
              <span className="text-primary"> Through Innovation</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Since 2023, DripTech has been Kenya's most innovative provider of smart irrigation solutions, 
              helping farmers and businesses achieve sustainable growth while conserving precious water resources 
              through cutting-edge technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="rounded-xl hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <Link to="/contact">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="rounded-xl hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <Link to="/projects">View Our Work</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="p-6 bg-background border-2 border-border/20 rounded-2xl inline-block mb-4 shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
                    <stat.icon className="h-10 w-10 text-primary mx-auto" />
                  </div>
                  <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{stat.value}</h3>
                  <p className="text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Mission</h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  To revolutionize agriculture in Kenya and East Africa by providing cutting-edge irrigation 
                  solutions that maximize crop yields, conserve water resources, and empower farmers with 
                  sustainable technology.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We believe that smart irrigation is the key to food security and environmental sustainability 
                  in our region.
                </p>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Vision</h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  To be the leading irrigation technology company in East Africa, recognized for innovation, 
                  sustainability, and exceptional customer service.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We envision a future where every farm, from smallholder plots to large commercial operations, 
                  has access to efficient, intelligent irrigation systems.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Our Core Values</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The principles that guide everything we do and every solution we deliver
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="p-0 bg-background border-2 border-border/20 hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500 group">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <value.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">{value.title}</h3>
                        <p className="text-muted-foreground leading-relaxed text-lg">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-20 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Our Journey</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Key milestones in our mission to transform irrigation in Kenya
              </p>
            </div>
            <div className="max-w-5xl mx-auto">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-8 mb-12 last:mb-0 group">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {milestone.year.slice(-2)}
                    </div>
                    {index !== milestones.length - 1 && (
                      <div className="w-1 h-20 bg-gradient-to-b from-primary via-primary/50 to-transparent mt-4 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-12">
                    <Card className="p-6 bg-background border-2 border-border/20 hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500">
                      <div className="flex items-center gap-4 mb-3">
                        <Badge variant="secondary" className="text-sm font-semibold">{milestone.year}</Badge>
                        <h3 className="text-2xl font-bold text-primary">{milestone.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-lg leading-relaxed">{milestone.description}</p>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-2 border-border/20 hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500">
              <CardContent className="p-12 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
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
                      className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Get Free Consultation
                    </a>
                    <a 
                      href="tel:+254111409454" 
                      className="inline-flex items-center px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/90 hover:shadow-lg hover:scale-105 transition-all duration-300"
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

export default About;