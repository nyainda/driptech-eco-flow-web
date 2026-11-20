import { lazy } from "react";
import { Link } from "react-router-dom";
import HeroSectionVibe from "@/components/Home/HeroSectionVibe";
import TrustStrip from "@/components/Home/TrustStrip";
import DeferredSection from "@/components/common/DeferredSection";
import WhatsAppContact from "@/components/common/WhatsAppContact";

const HomeOfferings = lazy(() => import("@/components/Home/HomeOfferings"));
const HomeKitsShowcase = lazy(() => import("@/components/Home/HomeKitsShowcase"));
const HomeCropAcreageGuide = lazy(() => import("@/components/Home/HomeCropAcreageGuide"));
const HomeEngineeringServices = lazy(() => import("@/components/Home/HomeEngineeringServices"));
const ProjectsSection = lazy(() => import("@/components/Home/ProjectsSection"));
const VideoSection = lazy(() => import("@/components/Home/VideoSection"));
const HomeFaqSection = lazy(() => import("@/components/Home/HomeFaqSection"));

const Home = () => {
  return (
    <>
      <HeroSectionVibe />

      {/* Executive credibility & capabilities band right below the hero */}
      <TrustStrip />

      {/* Product discovery mounts right after hero paint to keep mobile LCP clear */}
      <DeferredSection minHeight="560px" fallbackDelayMs={900}>
        <HomeOfferings />
      </DeferredSection>

      {/* Complete acreage kits comparison */}
      <DeferredSection minHeight="420px" fallbackDelayMs={1600}>
        <HomeKitsShowcase />
      </DeferredSection>

      {/* Shop by Farm Acreage (1/4, 1/2, 1, 5+ Acres) & Kenyan Crop Solutions */}
      <DeferredSection minHeight="460px" fallbackDelayMs={1900}>
        <HomeCropAcreageGuide />
      </DeferredSection>

      {/* Turnkey engineering design, consultation & 4-step execution pipeline */}
      <DeferredSection minHeight="440px" fallbackDelayMs={2100}>
        <HomeEngineeringServices />
      </DeferredSection>

      {/* Verified irrigation project records */}
      <DeferredSection minHeight="380px" fallbackDelayMs={2300}>
        <ProjectsSection compact />
      </DeferredSection>

      {/* Field demonstration videos */}
      <DeferredSection minHeight="340px" fallbackDelayMs={2500}>
        <VideoSection compact />
      </DeferredSection>

      <DeferredSection minHeight="280px" fallbackDelayMs={2700}>
        <HomeFaqSection />
      </DeferredSection>

      {/* Keep these resources discoverable without making them compete with products */}
      <section
        className="border-t border-border bg-background py-5 sm:py-8"
        aria-label="More irrigation resources"
      >
        <div className="dt-container flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            Still researching your irrigation setup?
          </p>
          <nav
            aria-label="Irrigation resources"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5 text-xs sm:text-sm font-medium"
          >
            <Link
              to="/pump-solar-calculator-kenya"
              className="inline-flex min-h-[28px] items-center text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Pump &amp; solar calculator
            </Link>
            <Link
              to="/irrigation-cost-calculator-kenya"
              className="inline-flex min-h-[28px] items-center text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Cost calculator
            </Link>
            <Link
              to="/irrigation-areas-kenya"
              className="inline-flex min-h-[28px] items-center text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Counties we serve
            </Link>
            <Link
              to="/blog"
              className="inline-flex min-h-[28px] items-center text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Irrigation guides
            </Link>
            <Link
              to="/videos"
              className="inline-flex min-h-[28px] items-center text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Video tutorials
            </Link>
            <Link
              to="/projects"
              className="inline-flex min-h-[28px] items-center text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Project examples
            </Link>
            <Link
              to="/success-stories"
              className="inline-flex min-h-[28px] items-center text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
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
