import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Home from "./Home";
import SEOHead from "@/components/common/SEOHead";

const Index = () => {
  return (
    <ThemeProvider>
      <SEOHead
        title="Irrigation Materials Kenya | Driplines, Sprinklers, Irrigation Kits & Farm Water Solutions - DripTech"
        description="Buy quality irrigation materials in Kenya: driplines (15cm, 20cm, 30cm spacing), sprinkler systems, irrigation pipes, filters, water pumps, fittings, farm irrigation kits. Affordable prices, fast delivery nationwide. Professional installation available."
        keywords="irrigation materials Kenya, dripline Kenya, irrigation kits, sprinkler systems, drip irrigation pipes, irrigation fittings, water pumps Kenya, farm irrigation solutions, agriculture irrigation, greenhouse irrigation, irrigation filters, irrigation accessories, dripline 15cm, dripline 20cm, dripline 30cm, irrigation equipment Kenya, farming equipment, water management systems, irrigation installation Kenya, irrigation suppliers Kenya, drip tape, emitters, irrigation valves, pressure regulators, fertigation systems"
        url="https://www.dripstech.co.ke"
        schema={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "DripTech",
          description: "Advanced Irrigation Solutions for Modern Agriculture",
          url: "https://www.dripstech.co.ke",
          logo: "https://www.dripstech.co.ke/driptech-logo.png",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+254-114-575-401",
            contactType: "Customer Service",
            areaServed: "KE",
            availableLanguage: ["English", "Swahili"],
          },
          address: {
            "@type": "PostalAddress",
            addressLocality: "Nairobi",
            addressCountry: "KE",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: "127",
          },
          priceRange: "KES",
        }}
      />
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main>
          <Home />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Index;
