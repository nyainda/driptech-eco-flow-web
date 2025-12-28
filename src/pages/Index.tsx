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
          <IrrigationKeywords />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Index;
