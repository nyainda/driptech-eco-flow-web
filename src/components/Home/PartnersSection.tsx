import { Card } from '@/components/ui/card';
import { Building2, Award, Users, TrendingUp } from 'lucide-react';

const partners = [
  {
    name: 'Kenya Agricultural Research Institute',
    logo: 'KARI',
    description: 'Research & Development Partner',
    icon: Award,
  },
  {
    name: 'Ministry of Agriculture Kenya',
    logo: 'MOA',
    description: 'Government Partner',
    icon: Building2,
  },
  {
    name: 'East Africa Farmers Federation',
    logo: 'EAFF',
    description: 'Community Partner',
    icon: Users,
  },
  {
    name: 'AgriTech Innovation Hub',
    logo: 'AIH',
    description: 'Technology Partner',
    icon: TrendingUp,
  },
];

const PartnersSection = () => {
  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Trusted Partners & Associations
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Working together with leading organizations to deliver excellence in
            irrigation solutions across Kenya
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {partners.map((partner, index) => {
            const Icon = partner.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative p-6 text-center">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{partner.logo}</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {partner.name}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {partner.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Certified & Recognized by Leading Agricultural Organizations
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">ISO 9001 Certified</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AgriTech Excellence Award 2024</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Kenya Bureau of Standards Approved</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
