import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Home from "./Home";
import SEOHead from "@/components/common/SEOHead";

const Index = () => {
  return (
    <ThemeProvider>
      <SEOHead
        title="DripTech - Advanced Irrigation Solutions for Modern Agriculture in Kenya"
        description="Transform your farm with DripTech's smart drip irrigation systems. Save up to 40% water, increase yields by 60%, and boost productivity. Expert installation across Kenya. Contact us on WhatsApp for a free consultation!"
        keywords="drip irrigation Kenya, smart irrigation systems, water conservation, precision agriculture, farm irrigation Kenya, greenhouse irrigation, sprinkler systems, irrigation installation Kenya, agricultural technology, water management systems"
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
