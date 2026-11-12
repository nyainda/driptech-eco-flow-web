import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Home from "./Home";
import SEOHead from "@/components/common/SEOHead";
import { buildOrganizationSchema, SITE_COMPANY } from "@/config/company";

const Index = () => {
  return (
    <>
      <SEOHead
        title="Drip Irrigation Kits, Driplines & Sprinklers in Kenya | DripTech Eco Flow"
        description="Shop drip irrigation kits, driplines (15cm, 20cm, 30cm), sprinklers, solar & borehole pumps, and water filters in Kenya. Call or WhatsApp 0723 407 849 for custom BOQ sizing, nationwide supply, and certified installation."
        keywords="drip irrigation Kenya, drip irrigation kit Kenya, drip irrigation kit price Kenya, driplines Kenya, sprinkler systems Kenya, irrigation pumps Kenya, farm irrigation Kenya, greenhouse irrigation Kenya, irrigation installation Kenya, drip irrigation Nairobi, buy drip kit Kenya, 0723407849, 0757716018"
        url="https://www.dripstech.co.ke/"
        schema={[
          buildOrganizationSchema(),
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": "https://www.dripstech.co.ke/#website",
            name: SITE_COMPANY.name,
            url: SITE_COMPANY.url,
            publisher: { "@id": "https://www.dripstech.co.ke/#organization" },
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
        <main id="main-content" tabIndex={-1}>
          <Home />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
