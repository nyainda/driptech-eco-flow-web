import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Shield, CheckCircle, Download, Calendar, Users, Building, Star } from "lucide-react";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const Certifications = () => {
  const certifications = [
    {
      id: 1,
      title: "ISO 9001:2015 Quality Management",
      issuer: "Kenya Bureau of Standards (KEBS)",
      category: "Quality Standards",
      validUntil: "2025-12-31",
      description: "Certified quality management system ensuring consistent service delivery and customer satisfaction.",
      icon: Shield,
      status: "Active",
      priority: "high"
    },
    {
      id: 2,
      title: "Certified Irrigation Designer (CID)",
      issuer: "Irrigation Association International",
      category: "Professional Certification",
      validUntil: "2026-06-30",
      description: "Professional certification for irrigation system design and water management expertise.",
      icon: Award,
      status: "Active",
      priority: "high"
    },
    {
      id: 3,
      title: "Smart Water Application Technologies (SWAT)",
      issuer: "Irrigation Association",
      category: "Technology Certification",
      validUntil: "2025-09-15",
      description: "Certification in smart irrigation technologies and water-efficient application methods.",
      icon: CheckCircle,
      status: "Active",
      priority: "medium"
    },
    {
      id: 4,
      title: "Water Management Specialist",
      issuer: "Kenya Water Institute",
      category: "Water Management",
      validUntil: "2025-03-20",
      description: "Specialized certification in sustainable water management and conservation practices.",
      icon: Shield,
      status: "Active",
      priority: "medium"
    },
    {
      id: 5,
      title: "Agricultural Systems Technology",
      issuer: "Ministry of Agriculture Kenya",
      category: "Agricultural Technology",
      validUntil: "2026-01-10",
      description: "Government-recognized certification for agricultural technology implementation and support.",
      icon: Award,
      status: "Active",
      priority: "high"
    },
    {
      id: 6,
      title: "Environmental Management System",
      issuer: "National Environment Management Authority",
      category: "Environmental Compliance",
      validUntil: "2025-08-30",
      description: "Certification ensuring environmentally responsible business practices and sustainability.",
      icon: CheckCircle,
      status: "Active",
      priority: "medium"
    }
  ];

  const achievements = [
    {
      icon: Users,
      title: "500+ Certified Installations",
      description: "Successfully completed installations with quality assurance"
    },
    {
      icon: Building,
      title: "Government Approved Contractor",
      description: "Recognized by Kenya government for infrastructure projects"
    },
    {
      icon: Star,
      title: "5-Star Service Rating",
      description: "Consistently rated excellent by customers and partners"
    },
    {
      icon: Shield,
      title: "Insurance & Bonded",
      description: "Full insurance coverage and bonding for all operations"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-green-600";
      case "medium": return "border-l-blue-600";
      default: return "border-l-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm font-semibold">
              🏆 Certified Excellence
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Our <span className="text-primary">Certifications</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              DripTech maintains the highest industry standards through continuous certification and professional development. Our credentials ensure quality, safety, and expertise in every project.
            </p>
          </div>

          {/* Achievements Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center p-6 bg-background border-2 border-border/20 hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500 group">
                <CardContent className="p-0">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <achievement.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Certifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {certifications.map((cert) => (
              <Card key={cert.id} className={`bg-background border-2 border-border/20 hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500 border-l-4 ${getPriorityColor(cert.priority)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <cert.icon className="h-8 w-8 text-primary flex-shrink-0" />
                    </div>
                    <Badge className={`text-sm font-semibold ${getStatusColor(cert.status)}`}>{cert.status}</Badge>
                  </div>
                  <CardTitle className="text-lg text-foreground">{cert.title}</CardTitle>
                  <CardDescription className="font-medium text-primary">{cert.issuer}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{cert.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="secondary" className="text-sm font-semibold">{cert.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valid Until:</span>
                      <span className="font-medium text-foreground">{new Date(cert.validUntil).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full rounded-xl hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <Download className="h-4 w-4 mr-2" />
                    View Certificate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quality Assurance Section */}
          <Card className="mb-16 bg-background border-2 border-border/20 hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-4 text-foreground">Our Quality Commitment</CardTitle>
              <CardDescription className="text-lg max-w-3xl mx-auto text-muted-foreground leading-relaxed">
                Every certification represents our dedication to excellence, continuous improvement, and customer satisfaction. We invest in training and development to stay ahead of industry standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Quality Standards</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">ISO certified processes ensure consistent quality in every project delivery.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Expert Team</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Certified professionals with ongoing training and development programs.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Compliance</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Full compliance with industry regulations and environmental standards.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="bg-background border-2 border-border/20 hover:shadow-2xl hover:border-primary/20 hover:scale-[1.02] transition-all duration-500">
            <CardContent className="p-8 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
              <h3 className="text-2xl font-bold mb-4 text-foreground">Need Verification?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
                For verification of our certifications or to request official documentation, please contact our certification department.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="rounded-xl hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <Calendar className="h-4 w-4 mr-2" />
                  Request Verification
                </Button>
                <Button variant="outline" className="rounded-xl hover:bg-primary/10 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate Pack
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Certifications;