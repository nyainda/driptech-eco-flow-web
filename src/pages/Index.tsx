import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Home from "./Home";
import SEOHead from "@/components/common/SEOHead";

const Index = () => {
  return (
    <ThemeProvider>
      <SEOHead
        title="Drip Irrigation Kits, Driplines & Sprinklers in Kenya | DripTech"
        description="Shop drip irrigation kits, driplines (15cm, 20cm, 30cm), sprinklers, pumps and filters in Kenya. Design help, supply and installation — from small farms to commercial fields."
        keywords="drip irrigation Kenya, drip irrigation kit Kenya, driplines Kenya, sprinkler systems Kenya, irrigation pumps Kenya, farm irrigation Kenya, greenhouse irrigation Kenya, irrigation installation Kenya"
        url="https://www.dripstech.co.ke/"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.dripstech.co.ke/#organization",
            name: "DripTech EcoFlow",
            alternateName: "DripTech",
            description:
              "Irrigation equipment supplier in Kenya — driplines, kits, sprinklers, pumps and filters, with design and installation support.",
            url: "https://www.dripstech.co.ke",
            logo: "https://www.dripstech.co.ke/driptech-logo.png",
            email: "info@dripstech.co.ke",
            telephone: "+254794494515",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+254794494515",
              contactType: "sales",
              areaServed: "KE",
              availableLanguage: ["English", "Swahili"],
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Nairobi",
              addressCountry: "KE",
            },
            areaServed: {
              "@type": "Country",
              name: "Kenya",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://www.dripstech.co.ke/#localbusiness",
            name: "DripTech EcoFlow",
            image: "https://www.dripstech.co.ke/driptech-logo.png",
            url: "https://www.dripstech.co.ke",
            telephone: "+254794494515",
            email: "info@dripstech.co.ke",
            priceRange: "KES",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Nairobi",
              addressCountry: "KE",
            },
            geo: {
              "@type": "GeoCoordinates",
              addressCountry: "KE",
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                ],
                opens: "08:00",
                closes: "17:00",
              },
            ],
            parentOrganization: {
              "@id": "https://www.dripstech.co.ke/#organization",
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
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  "https://www.dripstech.co.ke/products?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
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
