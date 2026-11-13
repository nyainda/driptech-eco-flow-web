import { Link } from "react-router-dom";
import HeroSectionVibe from "@/components/Home/HeroSectionVibe";
import TrustStrip from "@/components/Home/TrustStrip";
import HomeOfferings from "@/components/Home/HomeOfferings";
import HomeCropAcreageGuide from "@/components/Home/HomeCropAcreageGuide";
import HomeEngineeringServices from "@/components/Home/HomeEngineeringServices";
import HomeKitsShowcase from "@/components/Home/HomeKitsShowcase";
import ProjectsSection from "@/components/Home/ProjectsSection";
import WhatsAppContact from "@/components/common/WhatsAppContact";
import FAQSection from "@/components/SEO/FAQSection";
import { COMMON_FAQS } from "@/lib/seo-config";

const Home = () => {
  return (
    <>
      <HeroSectionVibe />

      {/* Executive credibility & capabilities band right below the hero */}
      <TrustStrip />

      {/* Product discovery renders immediately with no scroll-hiding wrapper */}
      <HomeOfferings />

      {/* Complete acreage kits comparison */}
      <HomeKitsShowcase />

      {/* Shop by Farm Acreage (1/4, 1/2, 1, 5+ Acres) & Kenyan Crop Solutions */}
      <HomeCropAcreageGuide />

      {/* Turnkey engineering design, consultation & 4-step execution pipeline */}
      <HomeEngineeringServices />

      {/* Verified irrigation project records */}
      <ProjectsSection compact />

      <FAQSection
        title="Questions before you choose?"
        faqs={COMMON_FAQS.homepage}
        className="py-10 sm:py-14"
      />

      {/* Keep these resources discoverable without making them compete with products */}
      <section
        className="border-t border-border bg-background py-6 sm:py-8"
        aria-label="More irrigation resources"
      >
        <div className="dt-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-foreground">
            Still researching your irrigation setup?
          </p>
          <nav
            aria-label="Irrigation resources"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium"
          >
            <Link
              to="/irrigation-areas-kenya"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Counties we serve
            </Link>
            <Link
              to="/blog"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Irrigation guides
            </Link>
            <Link
              to="/videos"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Video tutorials
            </Link>
            <Link
              to="/projects"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Project examples
            </Link>
            <Link
              to="/success-stories"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Case studies
            </Link>
          </nav>
        </div>
      </section>

      <WhatsAppContact variant="floating" />
    </>
  );
};

export default Home;
