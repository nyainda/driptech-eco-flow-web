
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
      case "high": return "text-green-600 bg-green-50 border-green-200";
      case "medium": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
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
            <Badge variant="secondary" className="mb-4">
              🏆 Certified Excellence
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Our <span className="text-primary">Certifications</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              DripTech maintains the highest industry standards through continuous certification and professional development. Our credentials ensure quality, safety, and expertise in every project.
            </p>
          </div>

          {/* Achievements Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="p-0">
                  <achievement.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Certifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {certifications.map((cert) => (
              <Card key={cert.id} className={`border-l-4 ${getPriorityColor(cert.priority)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <cert.icon className="h-8 w-8 text-primary flex-shrink-0" />
                    <Badge className={getStatusColor(cert.status)}>
                      {cert.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{cert.title}</CardTitle>
                  <CardDescription className="font-medium text-primary">
                    {cert.issuer}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {cert.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline">{cert.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valid Until:</span>
                      <span className="font-medium">{new Date(cert.validUntil).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    View Certificate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quality Assurance Section */}
          <Card className="mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-4">Our Quality Commitment</CardTitle>
              <CardDescription className="text-lg max-w-3xl mx-auto">
                Every certification represents our dedication to excellence, continuous improvement, and customer satisfaction. We invest in training and development to stay ahead of industry standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Quality Standards</h3>
                  <p className="text-sm text-muted-foreground">
                    ISO certified processes ensure consistent quality in every project delivery.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Expert Team</h3>
                  <p className="text-sm text-muted-foreground">
                    Certified professionals with ongoing training and development programs.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    Full compliance with industry regulations and environmental standards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Need Verification?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                For verification of our certifications or to request official documentation, please contact our certification department.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Request Verification
                </Button>
                <Button variant="outline">
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
