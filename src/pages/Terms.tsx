import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mail, Phone, MapPin, AlertTriangle } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <FileText className="w-4 h-4 mr-2" />
              Legal Terms
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Terms of <span className="text-primary">Service</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Legal terms and conditions governing the use of DripTech EcoFlow services
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: August 29, 2025
            </p>
          </div>

          <div className="space-y-8">
            {/* Acceptance of Terms */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing our website, using our services, or purchasing our irrigation products, you agree to be bound by these Terms of Service ("Terms"). 
                  These terms apply to all users, customers, and visitors of DripTech EcoFlow services in Kenya and beyond.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  If you disagree with any part of these terms, you may not access our services or website.
                </p>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">2. Company Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  DripTech EcoFlow Ltd is a registered company in Kenya, specializing in professional irrigation solutions, system design, installation, and maintenance services.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p><strong>Company Name:</strong> DripTech EcoFlow Ltd</p>
                  <p><strong>Registration:</strong> Kenya Company Registration</p>
                  <p><strong>Location:</strong> Nairobi, Kenya</p>
                  <p><strong>Services:</strong> Irrigation system design, installation, maintenance, and consultation</p>
                </div>
              </CardContent>
            </Card>

            {/* Services Description */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">3. Services Offered</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Product Sales</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Drip irrigation systems and components</li>
                      <li>Sprinkler systems and accessories</li>
                      <li>Water filtration equipment</li>
                      <li>Control systems and automation</li>
                      <li>Pipes, fittings, and hardware</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Professional Services</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Site assessment and system design</li>
                      <li>Professional installation services</li>
                      <li>Maintenance and repair services</li>
                      <li>Technical training and consultation</li>
                      <li>System optimization and upgrades</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Responsibilities */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">4. User Responsibilities</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Account Usage</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Provide accurate and complete information when requesting services</li>
                      <li>Maintain confidentiality of any account credentials</li>
                      <li>Notify us promptly of any unauthorized use of your account</li>
                      <li>Use our services only for lawful agricultural and irrigation purposes</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Site Preparation</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Ensure proper site access for our installation teams</li>
                      <li>Provide accurate site measurements and conditions</li>
                      <li>Obtain necessary permits and approvals</li>
                      <li>Ensure compliance with local building and water regulations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing and Payment */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">5. Pricing and Payment Terms</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Pricing</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>All prices are quoted in Kenyan Shillings (KES) unless otherwise specified</li>
                      <li>Prices may vary based on site conditions and specific requirements</li>
                      <li>Final pricing is confirmed in written quotations valid for 30 days</li>
                      <li>Prices exclude applicable taxes unless specifically noted</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Payment Terms</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Payment terms are specified in individual service agreements</li>
                      <li>Typical terms: 50% deposit, 50% upon completion</li>
                      <li>Accepted payment methods: Bank transfer, mobile money (M-Pesa), cash</li>
                      <li>Late payments may incur additional fees as specified in agreements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Installation and Service */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">6. Installation and Service Terms</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Installation Services</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Installation schedules are agreed upon mutually and weather-dependent</li>
                      <li>Customer must provide safe access to installation areas</li>
                      <li>Basic utilities (water, electricity) must be available at the site</li>
                      <li>Installation includes system testing and basic user training</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Service Standards</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>All work performed by certified technicians</li>
                      <li>Systems designed according to industry best practices</li>
                      <li>Installation complies with local regulations and standards</li>
                      <li>Post-installation support and documentation provided</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warranties and Guarantees */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">7. Warranties and Guarantees</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Product Warranties</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Product warranties as provided by manufacturers</li>
                      <li>Typical warranty periods: 1-5 years depending on product type</li>
                      <li>Warranty covers manufacturing defects, not misuse or normal wear</li>
                      <li>Warranty claims require proof of purchase and proper maintenance</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Installation Guarantee</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>12-month guarantee on all installation workmanship</li>
                      <li>Free correction of installation-related issues within guarantee period</li>
                      <li>Guarantee void if system is modified by unauthorized persons</li>
                      <li>Regular maintenance required to maintain guarantee validity</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-8">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1" />
                  <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    DripTech EcoFlow's total liability for any claims arising from our services shall not exceed the amount paid by the customer for the specific service in question.
                  </p>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">We are not liable for:</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Indirect, consequential, or punitive damages</li>
                      <li>Loss of profits, crops, or business income</li>
                      <li>Damage caused by natural disasters or extreme weather</li>
                      <li>Issues arising from customer modifications to installed systems</li>
                      <li>Damage due to improper maintenance or misuse</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">9. Intellectual Property</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    All content on our website, including text, graphics, logos, images, and software, is owned by DripTech EcoFlow and protected by Kenyan and international copyright laws.
                  </p>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Permitted Use</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>View and download content for personal, non-commercial use</li>
                      <li>Share our content with proper attribution</li>
                      <li>Use product information for evaluation purposes</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Prohibited Use</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Commercial use without written permission</li>
                      <li>Modification or reverse engineering of our designs</li>
                      <li>Use of our trademarks or logos without authorization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy and Data */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">10. Privacy and Data Protection</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, 
                  which is incorporated into these Terms by reference.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Key Points:</strong> We collect information necessary for service delivery, protect your data with appropriate security measures, 
                    and comply with Kenyan data protection laws. For complete details, please review our 
                    <a href="/privacy" className="text-primary hover:underline"> Privacy Policy</a>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">11. Termination</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">By Customer</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Services may be cancelled before work begins with written notice</li>
                      <li>Cancellation fees may apply as specified in service agreements</li>
                      <li>Completed work and delivered products are non-refundable</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">By DripTech</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>We may terminate services for breach of these terms</li>
                      <li>Termination for safety reasons or site access issues</li>
                      <li>Non-payment or violation of agreed terms</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">12. Governing Law and Disputes</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    These Terms are governed by the laws of Kenya. Any disputes arising from these terms or our services shall be resolved in Kenyan courts.
                  </p>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Dispute Resolution</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Initial disputes should be addressed through direct communication</li>
                      <li>Mediation through recognized Kenyan mediation services</li>
                      <li>Legal proceedings in competent Kenyan courts as final recourse</li>
                      <li>Customer retains rights under Kenyan consumer protection laws</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">13. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. 
                  Continued use of our services after changes constitute acceptance of the modified terms. 
                  For significant changes, we will provide reasonable notice to existing customers.
                </p>
              </CardContent>
            </Card>

            {/* Severability */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">14. Severability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If any provision of these Terms is found to be unenforceable or invalid, the remaining provisions shall continue in full force and effect. 
                  The invalid provision will be replaced with a valid provision that most closely matches the intent of the original.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">15. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  For questions about these Terms of Service, please contact us:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Email</p>
                        <a href="mailto:driptechs.info@gmail.com" className="text-primary hover:underline">
                          driptechs.info@gmail.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Phone</p>
                       <a href="tel:+254111409454" className="text-primary hover:underline">+254 111409454</a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground">
                          DripTech EcoFlow Ltd<br />
                          Nairobi, Kenya
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;