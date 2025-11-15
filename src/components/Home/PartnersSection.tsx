import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Droplets, CheckCircle, Shield, ExternalLink } from 'lucide-react';

const PartnersSection = () => {
  return (
    <section className="py-24 bg-background border-t border-border relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-medium bg-muted text-foreground border-border"
            >
              <Award className="w-4 h-4 mr-2" />
              Our Partner
            </Badge>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-foreground leading-tight">
            Trusted
            <span className="block text-primary">Equipment Partner</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Working together with leading irrigation equipment manufacturers to deliver excellence across Kenya
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12 md:mb-16">
          <Card className="group relative overflow-hidden bg-background border-2 border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardContent className="relative p-6 sm:p-8 md:p-10 text-center">
              <div className="mb-4 sm:mb-6 flex items-center justify-center">
                <div className="rounded-full bg-primary/20 p-4 sm:p-6 ring-4 ring-primary/10">
                  <Droplets className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                </div>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-foreground">
                Accent Internationals
              </h3>
              
              <Badge className="mb-3 sm:mb-4 bg-muted text-foreground border-border text-sm">
                <Shield className="h-3 w-3 mr-1" />
                ISO 9001:2015 Certified
              </Badge>
              
              <p className="text-base sm:text-lg font-medium text-muted-foreground mb-3 sm:mb-4">
                Premium Irrigation Equipment Partner
              </p>
              
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                Leading manufacturer and exporter of agricultural drip irrigation systems, 
                water-saving solutions, sprinkler systems, and HDPE irrigation pipes. 
                Committed to sustainable farming through innovative irrigation technology.
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-foreground text-center">
                    Drip Irrigation Systems
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-foreground text-center">
                    Sprinkler Systems
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-foreground text-center">
                    HDPE Pipes & Fittings
                  </span>
                </div>
              </div>

              {/* Visit Website */}
              
            </CardContent>
          </Card>
        </div>

        {/* Certifications & Badges */}
        <div className="bg-muted/30 rounded-2xl p-6 sm:p-8 md:p-10 border border-border">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
              Quality Assured & Certified
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Premium irrigation equipment meeting international standards
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2.5 sm:py-3 border border-border shadow-sm">
              <Award className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                ISO 9001:2015 Certified
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2.5 sm:py-3 border border-border shadow-sm">
              <Droplets className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Water-Saving Technology
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2.5 sm:py-3 border border-border shadow-sm">
              <Shield className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Premium Quality Equipment
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2.5 sm:py-3 border border-border shadow-sm">
              <Award className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Export Quality Standards
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;