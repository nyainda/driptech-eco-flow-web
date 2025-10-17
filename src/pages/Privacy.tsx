import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Mail, Phone, MapPin, Clock } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Shield className="w-4 h-4 mr-2" />
              Legal Information
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Privacy <span className="text-primary">Policy</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              How DripTech EcoFlow collects, uses, and protects your personal
              information
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: August 29, 2025
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  At DripTech EcoFlow ("we," "our," or "us"), we are committed
                  to protecting your privacy and ensuring the security of your
                  personal information. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when
                  you visit our website, use our services, or engage with our
                  irrigation solutions in Kenya.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  By using our website or services, you consent to the data
                  practices described in this policy.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">
                  Information We Collect
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Personal Information
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>
                        Name, email address, and phone number when you contact
                        us
                      </li>
                      <li>
                        Business information for commercial irrigation projects
                      </li>
                      <li>
                        Location data for service delivery and installation
                      </li>
                      <li>
                        Payment information for transactions (processed securely
                        through third-party providers)
                      </li>
                      <li>
                        Technical requirements and specifications for your
                        irrigation needs
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Website Usage Information
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Browser type and version, operating system</li>
                      <li>IP address and general location information</li>
                      <li>
                        Pages visited, time spent on site, and navigation
                        patterns
                      </li>
                      <li>Device information and screen resolution</li>
                      <li>
                        Referral sources and search terms used to find our
                        website
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">
                  How We Use Your Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Service Delivery
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Provide irrigation system design and installation</li>
                      <li>
                        Deliver technical support and maintenance services
                      </li>
                      <li>Process orders and handle payments</li>
                      <li>Schedule consultations and site visits</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Communication
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Respond to inquiries and provide customer support</li>
                      <li>Send service updates and maintenance reminders</li>
                      <li>
                        Share industry insights and irrigation best practices
                      </li>
                      <li>Notify about new products and services</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Business Operations
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Analyze website usage to improve user experience</li>
                      <li>Conduct market research for service enhancement</li>
                      <li>Comply with legal and regulatory requirements</li>
                      <li>Prevent fraud and ensure security</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Marketing</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>
                        Send newsletters and educational content (with consent)
                      </li>
                      <li>Promote relevant irrigation solutions</li>
                      <li>Share success stories and case studies</li>
                      <li>Invite to training workshops and events</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Protection */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">
                  Data Protection & Security
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    We implement appropriate technical and organizational
                    measures to protect your personal information against
                    unauthorized access, alteration, disclosure, or destruction.
                    These measures include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>SSL encryption for data transmission</li>
                    <li>Secure data storage with regular backups</li>
                    <li>
                      Limited access to personal information on a need-to-know
                      basis
                    </li>
                    <li>Regular security assessments and updates</li>
                    <li>Employee training on data protection practices</li>
                    <li>Compliance with Kenyan data protection regulations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Information Sharing</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information to
                  third parties. We may share your information only in the
                  following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong>Service Providers:</strong> Trusted partners who
                    assist in delivering our services (installation teams,
                    suppliers, payment processors)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or
                    to protect our rights and safety
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In the event of a
                    merger, acquisition, or sale of assets
                  </li>
                  <li>
                    <strong>Consent:</strong> When you explicitly agree to the
                    sharing
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  All third parties are contractually bound to protect your
                  information and use it only for specified purposes.
                </p>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You have the following rights regarding your personal
                  information:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                      <strong>Access:</strong> Request copies of your personal
                      data
                    </li>
                    <li>
                      <strong>Correction:</strong> Update or correct inaccurate
                      information
                    </li>
                    <li>
                      <strong>Deletion:</strong> Request deletion of your
                      personal data
                    </li>
                    <li>
                      <strong>Portability:</strong> Receive your data in a
                      portable format
                    </li>
                  </ul>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                      <strong>Opt-out:</strong> Unsubscribe from marketing
                      communications
                    </li>
                    <li>
                      <strong>Restriction:</strong> Limit how we process your
                      data
                    </li>
                    <li>
                      <strong>Objection:</strong> Object to certain types of
                      processing
                    </li>
                    <li>
                      <strong>Withdraw Consent:</strong> Withdraw previously
                      given consent
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Cookies and Tracking */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">
                  Cookies & Tracking Technologies
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your
                  browsing experience. These help us:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze website traffic and usage patterns</li>
                  <li>Improve website functionality and performance</li>
                  <li>Provide relevant content and recommendations</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  You can control cookies through your browser settings.
                  However, disabling cookies may affect website functionality.
                  For detailed information, please see our{" "}
                  <a href="/cookies" className="text-primary hover:underline">
                    Cookie Policy
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We retain your personal information only as long as necessary
                  for the purposes outlined in this policy:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong>Customer Records:</strong> 7 years after last
                    interaction (for warranty and legal purposes)
                  </li>
                  <li>
                    <strong>Marketing Data:</strong> Until you unsubscribe or
                    request deletion
                  </li>
                  <li>
                    <strong>Website Analytics:</strong> 2 years for performance
                    analysis
                  </li>
                  <li>
                    <strong>Support Tickets:</strong> 3 years for service
                    improvement
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Data may be retained longer if required by law or for
                  legitimate business interests.
                </p>
              </CardContent>
            </Card>

            {/* International Transfers */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">
                  International Data Transfers
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  As a Kenya-based company, we primarily process data within
                  Kenya. However, some of our service providers may be located
                  outside Kenya. When we transfer personal data internationally,
                  we ensure appropriate safeguards are in place, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                  <li>Adequacy decisions by relevant authorities</li>
                  <li>Standard contractual clauses</li>
                  <li>Certification schemes and codes of conduct</li>
                  <li>Your explicit consent where required</li>
                </ul>
              </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are not directed to individuals under 18 years of
                  age. We do not knowingly collect personal information from
                  children. If we become aware that we have collected personal
                  information from a child without parental consent, we will
                  take steps to delete such information.
                </p>
              </CardContent>
            </Card>

            {/* Changes to This Policy */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">
                  Changes to This Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices or applicable laws. We will notify
                  you of significant changes by posting the updated policy on
                  our website with a new "Last Updated" date. For material
                  changes, we may provide additional notice through email or our
                  website.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  If you have questions about this Privacy Policy or wish to
                  exercise your rights, please contact us:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Email</p>
                        <a
                          href="mailto:driptechs.info@gmail.com"
                          className="text-primary hover:underline"
                        >
                          driptechs.info@gmail.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <a
                          href="tel:+254 111409454"
                          className="text-primary hover:underline"
                        >
                          +254 111409454
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground">
                          DripTech EcoFlow Ltd
                          <br />
                          Nairobi, Kenya
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Response Time</p>
                        <p className="text-muted-foreground">Within 30 days</p>
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

export default Privacy;
