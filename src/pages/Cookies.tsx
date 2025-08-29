import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie, Shield, Settings, BarChart3, Users, Globe } from "lucide-react";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Cookie className="w-4 h-4 mr-2" />
              Data & Privacy
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Cookie <span className="text-primary">Policy</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              How DripTech EcoFlow uses cookies and similar technologies on our website
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: August 29, 2025
            </p>
          </div>

          <div className="space-y-8">
            {/* What Are Cookies */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Cookies are small text files that are placed on your device (computer, smartphone, tablet) when you visit our website. 
                  They help us provide you with a better browsing experience by remembering your preferences and understanding how you interact with our site.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>In Simple Terms:</strong> Think of cookies as digital sticky notes that help our website remember useful information about your visit, 
                    making your experience smoother and more personalized.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Types of Cookies We Use */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Types of Cookies We Use</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Essential Cookies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Essential Cookies</h3>
                      <Badge variant="outline" className="text-xs">Always Active</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Required for basic website functionality. Cannot be disabled.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Security and authentication</li>
                      <li>Session management</li>
                      <li>Load balancing</li>
                      <li>Form submission handling</li>
                    </ul>
                  </div>

                  {/* Functional Cookies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Functional Cookies</h3>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Remember your preferences and enhance functionality.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Language preferences</li>
                      <li>Theme selection (light/dark mode)</li>
                      <li>Location for service areas</li>
                      <li>Contact form auto-fill</li>
                    </ul>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">Analytics Cookies</h3>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Help us understand how visitors use our website.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Page views and popular content</li>
                      <li>User journey and navigation patterns</li>
                      <li>Device and browser information</li>
                      <li>Performance metrics</li>
                    </ul>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      <h3 className="text-lg font-semibold">Marketing Cookies</h3>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Enable personalized content and relevant advertising.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                      <li>Personalized product recommendations</li>
                      <li>Relevant service suggestions</li>
                      <li>Social media integration</li>
                      <li>Newsletter personalization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why We Use Cookies */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Why We Use Cookies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Improve Your Experience</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Remember your preferences and settings</li>
                      <li>Provide personalized product recommendations</li>
                      <li>Save your location for relevant service information</li>
                      <li>Enable smooth navigation throughout the site</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Enhance Our Services</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Understand which irrigation solutions are most popular</li>
                      <li>Identify areas where customers need more information</li>
                      <li>Optimize website performance and speed</li>
                      <li>Improve our service offerings based on user behavior</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Provide Relevant Content</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Show irrigation solutions suitable for your region</li>
                      <li>Display relevant case studies and success stories</li>
                      <li>Suggest appropriate training materials</li>
                      <li>Customize technical documentation</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Ensure Security</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Protect against fraudulent activities</li>
                      <li>Secure form submissions and data transmission</li>
                      <li>Maintain session security</li>
                      <li>Prevent unauthorized access to admin areas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Third-Party Cookies */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Third-Party Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Some cookies on our website are set by third-party services that we use to enhance functionality. 
                  These partners have their own privacy policies governing their use of cookies.
                </p>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold">Google Analytics</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Helps us understand website traffic and user behavior to improve our services.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Privacy Policy</a>
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold">Social Media Widgets</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Enable sharing of content on social media platforms like Facebook, Twitter, and LinkedIn.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Each platform has its own privacy policy governing cookie use.
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold">Performance Monitoring</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Monitor website performance and identify technical issues to ensure optimal user experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cookie Duration */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">How Long Cookies Stay on Your Device</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Session Cookies</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Temporary cookies that expire when you close your browser.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                      <li>Shopping cart contents</li>
                      <li>Form data during browsing</li>
                      <li>Security tokens</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Persistent Cookies</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Stay on your device for a set period or until manually deleted.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                      <li>User preferences: up to 1 year</li>
                      <li>Analytics data: up to 2 years</li>
                      <li>Marketing data: up to 6 months</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Managing Cookies */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Managing Your Cookie Preferences</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  You have full control over cookies on our website. You can accept, reject, or manage specific types of cookies according to your preferences.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Browser Settings</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Most browsers allow you to control cookies through their settings. Here's how to access cookie settings in popular browsers:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li><strong>Chrome:</strong> Settings → Privacy & Security → Cookies</li>
                        <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                        <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                      </ul>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li><strong>Edge:</strong> Settings → Site Permissions → Cookies</li>
                        <li><strong>Opera:</strong> Settings → Advanced → Privacy & Security</li>
                        <li><strong>Mobile Browsers:</strong> Check browser-specific help pages</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border">
                    <h4 className="font-semibold mb-3">Cookie Preference Center</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Update your cookie preferences for this website:
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm">Manage Preferences</Button>
                      <Button variant="outline" size="sm">Accept All</Button>
                      <Button variant="outline" size="sm">Reject Optional</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact of Disabling Cookies */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Impact of Disabling Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  While you can browse our website with cookies disabled, some functionality may be limited:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-700 dark:text-red-400">Limited Functionality</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Preferences won't be remembered between visits</li>
                      <li>Some forms may not function properly</li>
                      <li>Personalized recommendations unavailable</li>
                      <li>Social sharing features may not work</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-700 dark:text-green-400">Still Available</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                      <li>Browse all pages and content</li>
                      <li>View product information</li>
                      <li>Access contact information</li>
                      <li>Download resources and guides</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Updates to Cookie Policy */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Updates to This Cookie Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or our business practices. 
                  Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Questions About Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  If you have questions about our use of cookies or this Cookie Policy, please contact us:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p>
                      <strong>Email:</strong> <a href="mailto:privacy@driptech.co.ke" className="text-primary hover:underline">privacy@driptech.co.ke</a>
                    </p>
                    <p>
                      <strong>Phone:</strong> <a href="tel:+254700123456" className="text-primary hover:underline">+254 700 123 456</a>
                    </p>
                  </div>
                  <div>
                    <p><strong>Address:</strong></p>
                    <p className="text-muted-foreground text-sm">
                      DripTech EcoFlow Ltd<br />
                      Westlands Office Park<br />
                      Nairobi, Kenya
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Policies */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Related Policies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For comprehensive information about how we handle your data, please also review:
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>
                  <a href="/terms" className="text-primary hover:underline font-medium">Terms of Service</a>
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

export default Cookies;