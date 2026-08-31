import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Home from "./Home";
import SEOHead from "@/components/common/SEOHead";
import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";

const Index = () => {
  return (
    <ThemeProvider>
      <SEOHead
        title="Drip Irrigation, Sprinklers & Irrigation Kits in Kenya | DripTech"
        description="Buy drip irrigation systems, sprinklers, irrigation kits, pumps and filters in Kenya. DripTech designs, supplies and installs water-efficient farm irrigation solutions nationwide."
        keywords="drip irrigation Kenya, irrigation kits Kenya, sprinkler systems Kenya, irrigation materials Kenya, drip lines Kenya, farm irrigation Kenya, greenhouse irrigation Kenya, water pumps Kenya, irrigation installation Kenya, filters and fittings Kenya"
        url="https://www.dripstech.co.ke"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.dripstech.co.ke/#organization",
            name: "DripTech",
            description: "Drip irrigation products, sprinkler systems, irrigation kits and farm irrigation installation in Kenya.",
            url: "https://www.dripstech.co.ke",
            logo: "https://www.dripstech.co.ke/driptech-logo.png",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+254-794-494-515",
              contactType: "sales and customer service",
              areaServed: "KE",
              availableLanguage: ["English", "Swahili"],
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Nairobi",
              addressCountry: "KE",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://www.dripstech.co.ke/#website",
            name: "DripTech",
            url: "https://www.dripstech.co.ke",
            publisher: { "@id": "https://www.dripstech.co.ke/#organization" },
            inLanguage: "en-KE",
          },
        ]}
      />
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main>
          <Home />
          <IrrigationKeywords />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Index;
