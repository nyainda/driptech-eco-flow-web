import { Link } from "react-router-dom";
import HeroSectionVibe from "@/components/Home/HeroSectionVibe";
import HomeOfferings from "@/components/Home/HomeOfferings";
import HomeKitsShowcase from "@/components/Home/HomeKitsShowcase";
import HomePlanningSection from "@/components/Home/HomePlanningSection";
import WhatsAppContact from "@/components/common/WhatsAppContact";
import FAQSection from "@/components/SEO/FAQSection";
import { COMMON_FAQS } from "@/lib/seo-config";
import ScrollReveal from "@/components/common/ScrollReveal";

const Home = () => {
  return (
    <>
      <HeroSectionVibe />

      {/* Product discovery stays the primary purpose of the homepage. */}
      <ScrollReveal>
        <HomeOfferings />
      </ScrollReveal>

      {/* Real kit records make the complete-system path easier to compare. */}
      <ScrollReveal delay={60}>
        <HomeKitsShowcase />
      </ScrollReveal>

      <ScrollReveal>
        <HomePlanningSection />
      </ScrollReveal>

      <FAQSection
        title="Questions before you choose?"
        faqs={COMMON_FAQS.homepage}
        className="py-12 sm:py-16 lg:py-20"
      />

      {/* Keep these resources discoverable without making them compete with products. */}
      <section className="border-t border-border bg-background py-6 sm:py-8" aria-label="More irrigation resources">
        <div className="dt-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-foreground">
            Still researching your options?
          </p>
          <nav aria-label="Irrigation resources" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link to="/blog" className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              Irrigation guides
            </Link>
            <Link to="/videos" className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              Video tutorials
            </Link>
            <Link to="/projects" className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
              Project examples
            </Link>
            <Link to="/success-stories" className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
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
