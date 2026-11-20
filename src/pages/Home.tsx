import { lazy } from "react";
import { Link } from "react-router-dom";
import HeroSectionVibe from "@/components/Home/HeroSectionVibe";
import TrustStrip from "@/components/Home/TrustStrip";
import DeferredSection from "@/components/common/DeferredSection";
import LazyWhatsAppContact from "@/components/common/LazyWhatsAppContact";

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

      {/* Product discovery mounts after hero paint so Desktop TBT & Mobile LCP stay clear */}
      <DeferredSection minHeight="560px" rootMargin="120px 0px" minMountDelayMs={400} fallbackDelayMs={3600}>
        <HomeOfferings />
      </DeferredSection>

      {/* Complete acreage kits comparison */}
      <DeferredSection minHeight="420px" rootMargin="320px 0px" fallbackDelayMs={5200}>
        <HomeKitsShowcase />
      </DeferredSection>

      {/* Shop by Farm Acreage (1/4, 1/2, 1, 5+ Acres) & Kenyan Crop Solutions */}
      <DeferredSection minHeight="460px" rootMargin="320px 0px" fallbackDelayMs={5800}>
        <HomeCropAcreageGuide />
      </DeferredSection>

      {/* Turnkey engineering design, consultation & 4-step execution pipeline */}
      <DeferredSection minHeight="440px" rootMargin="320px 0px" fallbackDelayMs={6400}>
        <HomeEngineeringServices />
      </DeferredSection>

      {/* Verified irrigation project records */}
      <DeferredSection minHeight="380px" rootMargin="320px 0px" fallbackDelayMs={7000}>
        <ProjectsSection compact />
      </DeferredSection>

      {/* Field demonstration videos */}
      <DeferredSection minHeight="340px" rootMargin="320px 0px" fallbackDelayMs={7600}>
        <VideoSection compact />
      </DeferredSection>

      <DeferredSection minHeight="280px" rootMargin="320px 0px" fallbackDelayMs={8200}>
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

      <LazyWhatsAppContact />
    </>
  );
};

export default Home;
